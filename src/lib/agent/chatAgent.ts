/**
 * Conversational turn engine (Drape v2). One streamed planner call decides what the turn is and writes the
 * recommendation intro; sections are retrieved with the classic pipeline pieces; a short streamed write-up
 * then names concrete picks. Product questions, compare and "more like #n" reuse the same chat context.
 */
import { z } from "zod";
import { isShopifyId } from "../blend";
import { MEMORY_KINDS, recipientKey, SELF, type MemoryItem, type MemoryPerson } from "../memory";
import { shopifyFacts, shopifyForSection, shopifyLike } from "../blendServer";
import { noExactNote, rankBlend, SCOUT_LIST, scoutLists, sortByPrice } from "../relevance";
import { compareProducts } from "../compare";
import { FEATURES } from "../config";
import { getEnv } from "../env";
import { llmStructured, llmStructuredStream, llmTextStream, Usage, withTimeout } from "../llm";
import { gendersLike, getEmbeddings, vectorNeighbours } from "../similar";
import { getRawProducts } from "../products";
import { deriveChips } from "./chips";
import { cleanText } from "./cleanText";
import { mergeIntent, priceBandsText, sanitizeIntent } from "./intent";
import { applyTaste, tasteBoost, type TastePayload } from "./personalize";
import { sectionIntent } from "./plan";
import { intentSummary } from "./rerank";
import { diversify, retrieveAnchor, retrieveRails } from "./retrieve";
import { getTaxonomy, type TaxonomyApi } from "./taxonomy";
import { DEPARTMENTS } from "./taxonomy.schema";
import { IntentSchema, emptyIntent, type ChatSectionSpec, type Emit, type Intent, type ProductCard } from "./types";

// ---------------------------------------------------------------------------
// Contract with the client
// ---------------------------------------------------------------------------

export const ChatSectionSpecSchema = z.object({
  title: z.string(),
  categories: z.array(z.string()),
  colors: z.array(z.string()),
  fabrics: z.array(z.string()),
  patterns: z.array(z.string()),
  useCases: z.array(z.string()),
  softPreferences: z.array(z.string()),
  semanticQuery: z.string(),
  budgetMax: z.number().nullable(),
  anchor: z
    .object({
      terms: z.array(z.string()).max(8),
      categoryLevel: z.boolean(),
      mustInclude: z.array(z.string()).max(4).optional(),
      store: z.string().max(80).optional(),
      forItem: z.string().max(40).optional(),
    })
    .optional(),
});

export const ShownProductSchema = z.object({
  ref: z.number().int(),
  id: z.string(),
  title: z.string(),
  brand: z.string(),
  color: z.string(),
  fabric: z.string().nullable(),
  category: z.string(),
  price: z.number(),
});
export type ShownProduct = z.infer<typeof ShownProductSchema>;

export const ChatStateSchema = z.object({
  intent: IntentSchema.nullable(),
  lastSections: z.array(ChatSectionSpecSchema).max(6),
  products: z.array(ShownProductSchema).max(120),
  nextRef: z.number().int().min(1),
  /** Scout: whose memory this chat is using (a person key), carried across turns. */
  forPerson: z.string().max(80).nullable().optional(),
});
export type ChatState = z.infer<typeof ChatStateSchema>;

export type ChatTurnInput = {
  message: string;
  /** Products the message points at (sent by card buttons; refs aren't visible to users). */
  refs?: number[];
  /** "Shopping for" picker choice for this chat (null = anyone). */
  audience?: "women" | "men" | "girls" | "boys" | null;
  /** A photo the user attached to this message (JPEG/PNG/WebP data URL). It always comes with text. */
  image?: string;
  /** Filled by runChatTurn from `image`: what the photo shows, for the planner. */
  photo?: string;
  history: { role: "user" | "assistant"; content: string }[];
  state: ChatState;
  memory: string[];
  /** Scout memory, by person (null = memory off). Only the facts of the person a request is for reach the planner. */
  people?: MemoryPerson[] | null;
  taste?: TastePayload;
  today?: Date;
  signal?: AbortSignal;
  debug?: boolean;
  /** "aura": Aura++'s Plush-style surface (short guidance + one tappable question, results do the talking, no picks). */
  style?: "drape" | "aura";
  /** Scout: mix Shopify Global Catalog results into every result set (tagged with their source). */
  blend?: boolean;
};

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

const TURN_TYPES = ["recommend", "refine", "product_question", "compare", "more_like", "clarify", "advice", "chitchat", "off_topic"] as const;

const SectionSchema = z.object({
  title: z.string(),
  why: z.string(),
  categories: z.array(z.string()),
  colors: z.array(z.string()),
  fabrics: z.array(z.string()),
  patterns: z.array(z.string()),
  useCases: z.array(z.string()),
  softPreferences: z.array(z.string()),
  semanticQuery: z.string(),
  budgetMax: z.number().nullable(),
  anchor: z.object({ terms: z.array(z.string()), categoryLevel: z.boolean(), mustInclude: z.array(z.string()), store: z.string(), forItem: z.string() }),
});

/**
 * The chat's running understanding, slimmer than a full Intent (fewer output tokens = faster turns).
 * Converted to an Intent with toIntent().
 */
const ChatBaseSchema = z.object({
  audience: z.object({
    segment: z.enum(["women", "men", "kids", "unisex", "unknown"]),
    kidGender: z.enum(["girl", "boy", "any"]).nullable(),
    ageYears: z.number().nullable(),
  }),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  budgetStrict: z.boolean(),
  mustColors: z.array(z.string()),
  mustFabrics: z.array(z.string()),
  excludeColors: z.array(z.string()),
  excludeFabrics: z.array(z.string()),
  excludePatterns: z.array(z.string()),
  excludeBrands: z.array(z.string()),
  textExclusions: z.array(z.string()),
  preferences: z.array(z.string()),
  occasion: z.string().nullable(),
  sort: z.enum(["relevance", "price_asc", "price_desc"]),
  summary: z.string(),
});
type ChatBase = z.infer<typeof ChatBaseSchema>;

const PlanSchema = z.object({
  turnType: z.enum(TURN_TYPES),
  // Decided first so the rest of the plan follows it.
  tasteWhy: z.string(),
  useTaste: z.boolean(),
  intro: z.string(),
  /** recommend: the guidance bullets ("**Key idea**: why"), joined onto the intro by the server. */
  tips: z.array(z.string()),
  refs: z.array(z.number().int()),
  sections: z.array(SectionSchema),
  base: ChatBaseSchema,
  similar: z
    .object({ label: z.string(), colors: z.array(z.string()), fabrics: z.array(z.string()), patterns: z.array(z.string()), maxPrice: z.number().nullable() })
    .nullable(),
  compareCriterion: z.string().nullable(),
  /** The one question that closes the answer (ChatGPT-style), with tappable answers. */
  ask: z.object({ question: z.string(), options: z.array(z.string()) }).nullable(),
  followups: z.array(z.string()),
});
type Plan = z.infer<typeof PlanSchema>;

let plannerSystem: string | null = null;

/**
 * Whose memory a Scout request uses: a person named in this message ("for my mom"), else the chat's person,
 * else nobody for a gift or someone we have no notes on, else the shopper. Pure.
 */
export function forPersonOf(input: { message: string; people?: MemoryPerson[] | null; state: { forPerson?: string | null } }): string | null {
  const named = recipientKey(input.message, input.people ?? []);
  if (named) return named;
  if (input.state.forPerson) return input.state.forPerson;
  return forSomeoneElse(input.message) ? null : SELF;
}

/** The notes on the person this request is for, if any. */
function rememberedFacts(input: ChatTurnInput): { person: MemoryPerson; facts: string[] } | null {
  if (!input.people?.length) return null;
  const key = forPersonOf(input);
  const person = key ? input.people.find((p) => p.key === key) : undefined;
  // Learned notes are marked, so the reply can phrase them as a hunch ("you seemed to like pastels").
  return person?.facts.length ? { person, facts: person.facts.map((f) => (f.source === "inferred" ? `${f.text} (learned)` : f.text)) } : null;
}

/** The planner's memory context: only the facts of the person this request is for. */
function memoryLine(input: ChatTurnInput): string {
  if (!input.people) return "";
  const key = forPersonOf(input);
  const known = input.people.map((p) => p.label).join(", ") || "nobody yet";
  const who = key ? (input.people.find((p) => p.key === key)?.label ?? (key === SELF ? "You" : key)) : null;
  const facts = rememberedFacts(input)?.facts ?? [];
  return [
    `Memory. People you have notes on: ${known}.`,
    who && facts.length
      ? `This request is for ${who === "You" ? "the user" : `their ${who.toLowerCase()}`}. What you remember about them: ${facts.join("; ")}. Name at least one of these in the intro, naturally ("Since you wear M and avoid polyester, …").`
      : who
        ? `This request is for ${who === "You" ? "the user" : who}; you have no notes on them yet.`
        : "This request is for someone you have no notes on: use no memory.",
  ].join(" ");
}

const MemoryOutSchema = z.object({
  items: z.array(z.object({ person: z.string(), kind: z.enum(MEMORY_KINDS), fact: z.string(), replaces: z.string(), source: z.enum(["stated", "inferred"]) })),
});

const MEMORY_SYSTEM = `You are the memory of Scout, a shopping assistant. From the user's latest message, pick out what's worth remembering about the shopper and the people they shop for, the way a good personal shopper would. Two sources:
- stated: lasting facts the user says about someone ("I wear size M", "my mom loves cotton sarees", "I'm allergic to wool").
- inferred: preferences implied by what they ask for in ordinary chat: colours, fabrics, brands, fits or styles they ask for ("pastel cotton kurtas" → likes pastel colours, prefers cotton), their usual budget on everyday items ("under ₹2,000" → usually spends under ₹2,000), sizes mentioned in passing ("in M", "size 9 shoes"), things they reject ("not pink", "no polyester" → avoids), and lifestyle context ("for office", "humid weather", "for the gym" → works in an office, lives somewhere humid, goes to the gym).
Each item: person (whose preference it is: "self" for the user, else the relation or name, e.g. "mom", "dad", "Riya"; when the request is for someone else, it's theirs), kind (size | avoid | likes | budget | other), fact (a short note that reads on its own: "Likes pastel colours", "Usually spends under ₹2,000", "Avoids polyester"), replaces (the exact known note this updates or contradicts, else ""), source.
Never: a choice made only for one occasion or event ("red for this Diwali", "a saree for my cousin's wedding this Sunday", "under 5k for this wedding"), a gift's budget (that's the giver's one-off spend, not the recipient's habit: "gift for dad under 3000" teaches nothing about dad's budget), the product type alone ("wants kurtas"), anything the assistant suggested, guesses beyond what was said, or notes that are already known. At most 3 items; often none. Return {"items": []} when nothing qualifies.`;

/** What's worth remembering in this message (mem0-style extraction step, separate from planning). */
async function extractMemory(input: ChatTurnInput, usage: Usage, signal?: AbortSignal): Promise<MemoryItem[]> {
  const key = forPersonOf(input);
  const person = key ? input.people?.find((p) => p.key === key) : undefined;
  const lastAssistant = [...input.history].reverse().find((m) => m.role === "assistant")?.content.slice(0, 300);
  const res = await llmStructured({
    name: "memory",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: MemoryOutSchema,
    system: MEMORY_SYSTEM,
    user: [
      `This chat is about: ${key === SELF ? "the user themselves" : key ? (person?.label ?? key) : "someone the user hasn't described (e.g. a gift)"}.`,
      `Known notes about them: ${person?.facts.map((f) => f.text).join("; ") || "none"}.`,
      lastAssistant ? `The assistant last said: ${lastAssistant}` : "",
      input.photo ? `The user attached a photo showing: ${input.photo}` : "",
      `User: ${input.message}`,
    ]
      .filter(Boolean)
      .join("\n"),
    usage,
    signal,
    timeoutMs: 15_000,
    maxTokens: 250,
  });
  return res.items
    .filter((m) => m.fact.trim())
    .slice(0, 3)
    .map((m) => ({ person: m.person, kind: m.kind, text: m.fact.trim(), source: m.source, ...(m.replaces.trim() ? { replaces: m.replaces.trim() } : {}) }));
}

/** Scout: a shopping assistant for any product; shows only the first section, the others become tappable pills. */
const SCOUT_SEGMENTS = `

SCOUT (overrides the persona above): you are Scout, a shopping assistant for ANY product, not only fashion: clothing and footwear, but also electronics, home and kitchen, beauty, sports, toys, books, gifts and more. Products come from our own catalog (fashion) and partner stores (everything). For a non-fashion item, set section categories [] (the category vocabulary is fashion-only) and rely on anchor (e.g. "wireless earbuds" → terms ["wireless earbuds","earbuds","tws earphones"]). Only ask who it's for when it matters for the product (clothing, footwear, gifts); set audience "unknown" for things like headphones or cookware. When you greet people or describe what you can do, say you help them shop for anything (fashion, electronics, home, beauty, gifts…), never only fashion.
- SCOUT FORMATTING: in the intro, bold the 2–3 words or short phrases that matter most with **…** (what you're showing and the key quality to look for, e.g. "Here are **lightweight athletic shorts** with **side pockets**…"). Never bold whole sentences, and no other formatting.
- USING MEMORY: the notes given are only for the person this request is for. Use them softly: likes and budget shape section semanticQuery and softPreferences; avoids go in preferences ("avoid polyester"); never turn memory into must or exclude filters or a strict budget. Mention them naturally in the intro, the way a good shop assistant would ("Since your mom wears M and loves cotton, I've picked…"). Notes marked (learned) were picked up from earlier chats: phrase them as a hunch ("you seemed to like pastels last time"), not as fact. The user's words in this chat always win over memory.
- SCOUT VOICE: speak like a knowledgeable personal shopper, not only a stylist. For non-fashion items, explain what actually matters when choosing (specs, materials, features, capacity, battery, durability, care) instead of styling. Closing questions ask about what matters for that kind of product (budget, size or capacity, must-have features, brand preference, who it's for), not outfit colours. A vague opener ("men", "women", "something nice", "a gift") gets a question about what kind of product, across everything you can shop (clothing, footwear, gadgets, home, beauty, gifts…), not only clothing.
- SCOUT: only the FIRST section's results are shown right away; the other sections appear as buttons the user can tap to see them. Put the most important section first. In the intro, talk about the first section and mention the others briefly as things you can also show ("I can also pull up bags and cozy accessories").`;

const PhotoSchema = z.object({ description: z.string() });

/** What the attached photo shows, as a shopper would describe it (vision model, low detail). */
async function describePhoto(image: string, message: string, usage: Usage, signal?: AbortSignal): Promise<string | null> {
  const res = await llmStructured({
    name: "photo",
    model: getEnv().OPENAI_MODEL_VISION,
    schema: PhotoSchema,
    system:
      "Describe the main product (or outfit) in the photo the way a shopper would search for it: product type, colour, material, pattern, style and notable details, plus any brand or text you can read. 15–40 words, plain English. If the user's message points at one item in the photo, describe that one. Don't guess prices.",
    user: [
      { type: "text", text: `User's message: ${message}` },
      { type: "image_url", image_url: { url: image, detail: "low" } },
    ],
    usage,
    signal,
    timeoutMs: 20_000,
    maxTokens: 120,
  });
  return res.description.trim() || null;
}

/** The reply to anything that isn't about shopping. */
export const OFF_TOPIC_NOTE = "I can only help with shopping, so I can't answer that one.";
/** The follow-up when the bridge question can't be written (timeout, error) or repeats the last one. */
const OFF_TOPIC_FALLBACK = {
  question: "Are you looking for something today: a particular product, a category, or something for an occasion?",
  options: ["A product", "A category", "Something for an occasion"],
};

const BridgeSchema = z.object({ question: z.string() });

/**
 * The planner writes a generic "What are you looking to shop for today?" whatever the topic, so a small
 * dedicated call writes the question that bridges an off-topic message back to shopping.
 */
async function offTopicBridge(message: string, scout: boolean, usage: Usage, signal?: AbortSignal): Promise<{ question: string; options: string[] }> {
  const res = await withTimeout(
    llmStructured({
      name: "off-topic-bridge",
      model: getEnv().OPENAI_MODEL_FAST,
      schema: BridgeSchema,
      system: `You are ${scout ? "Scout, a shopping assistant for any product" : "Drape, a fashion stylist"}. The user asked something that isn't about shopping, and the app has already said it can't answer. Write ONE short, friendly follow-up question (≤ 25 words) that brings them back to shopping.
- If the topic links naturally to shopping, offer that link: a film star, athlete or influencer → shopping their style; a sports team or match → jerseys and fan gear; a festival or event → outfits and gifts; a place or its weather → what to wear or pack for a trip there${scout ? "; a company or gadget → its products" : ""}.
- Otherwise ask whether they're looking for a particular product, a category, or something for an occasion.
- Never answer the question or state any fact about the topic (no names of winners, roles, numbers or results).
Examples: "Who is <film star>?" → "Would you like to shop their style, like their festive outfits or everyday looks?"; "Who won the match?" → "Looking for your team's jersey or some match-day gear?"; "Weather in <city>?" → "Planning a trip there? I can help you pick outfits and essentials to pack."; "What is 12 × 7?" → "Is there something I can help you shop for, like a product, a category, or an outfit for an occasion?"`,
      user: message,
      usage,
      signal,
      timeoutMs: 6_000,
      maxTokens: 80,
    }).catch(() => null),
    7_000,
  );
  const q = res?.question.trim();
  return q ? { question: q, options: [] } : OFF_TOPIC_FALLBACK;
}

const DRAPE_PERSONA = "You are Drape, a warm, knowledgeable personal stylist for Indian shoppers (women, men, kids; apparel, footwear, bags, accessories, jewellery), chatting with a user.";
const SCOUT_PERSONA = "You are Scout, a warm, knowledgeable shopping assistant for Indian shoppers who helps people buy anything (fashion, electronics, home and kitchen, beauty, sports, gifts and more), chatting with a user.";

let scoutSystem: string | null = null;
/** Scout's planner prompt: Drape's, with the shopping-assistant persona, Aura style and Scout's rules. */
function scoutPrompt(tax: TaxonomyApi): string {
  if (scoutSystem) return scoutSystem;
  const base = plannerPrompt(tax);
  // Fail loudly if the persona line is edited: Scout would silently become a fashion-only stylist.
  if (!base.includes(DRAPE_PERSONA)) throw new Error("scoutPrompt: Drape persona line not found in the planner prompt");
  scoutSystem = base.replace(DRAPE_PERSONA, SCOUT_PERSONA) + AURA_STYLE + SCOUT_SEGMENTS;
  return scoutSystem;
}

/** Answer-step rules for Scout (the stylist rules, as a general shopping assistant). */
const SCOUT_RULES_PREFIX = "You are Scout, a warm, knowledgeable shopping assistant for Indian shoppers (any product, not only fashion).";

/** Scout's version: it shops for anything, not only clothes. */
const SCOUT_CLARIFY_FALLBACK = {
  question: "What are you shopping for today: something to wear, a gadget, something for your home, beauty and personal care, or a gift?",
  options: ["Something to wear", "A gadget", "For my home", "Beauty & personal care", "A gift"],
};

/** Used when a clarify turn comes back without a (new) question. */
const CLARIFY_FALLBACK = { question: "What are you shopping for today: everyday wear, office wear, something festive, or footwear and accessories?", options: ["Everyday wear", "Office wear", "Party or festive", "Footwear", "Accessories"] };

/** Appended to the planner prompt for Aura++ (overrides the intro / sections / ask guidance above). */
const AURA_STYLE = `

AURA STYLE (this chat is in a Plush-style search app: the results appear as a big grid next to the chat, so your words stay short). These rules override the intro, sections and ask guidance above:
- intro for clarify: one short friendly sentence (no products, no bullets); the question goes in ask.
- intro for recommend/refine: 2–3 warm sentences (≤ 60 words), no bullets, no headings; tips = [] always. Say what you're showing and what to look for, like a personal stylist: e.g. "Here are some Western-inspired pieces to get you started, from casual denim and fringe to polished Americana silhouettes." Don't end the intro with a question.
- sections: usually 1–2 (one per distinct thing to shop); up to 3 only for a full look or outfit.
- ask: ALWAYS set it for recommend/refine/clarify: one guiding question that narrows the search, written as a natural chat sentence (e.g. "Are you looking for a full Western look or a few key pieces for your existing wardrobe?"), with 2–4 short options.
- product_question / compare / more_like: keep the answer to 2–4 sentences.
- advice: answer it properly: one sentence, a blank line, then 3–5 "- **Point**: why" bullets of concrete dos and don'ts (≤ 130 words).`;

function plannerPrompt(tax: TaxonomyApi): string {
  if (plannerSystem) return plannerSystem;
  plannerSystem = `You are Drape, a warm, knowledgeable personal stylist for Indian shoppers (women, men, kids; apparel, footwear, bags, accessories, jewellery), chatting with a user. You shop from a real catalog. Users write English, Hinglish or Hindi in Latin script; always reply in clear, friendly English (mirror a little Hinglish if they use it).

For every user message return the plan JSON:

turnType
- recommend: a new need (product, occasion, vibe, gift, trip…). Plan 2–4 sections (up to 5 for full looks/trips). For a single-item ask ("a purse for my wedding dress", "a kurta for office"), split it into 2–3 sections by the style options you'd recommend (e.g. potli bags / embellished clutches / metallic box clutches), each a different right answer.
- refine: change the current results ("cheaper", "more colourful", "no polyester", "show men's instead", "longer ones"). Re-issue the previous sections (given in the state) with the change applied, unless the user asks for different things.
- product_question: a question about shown products ("is #3 good for monsoon?", "which is more formal?", "will this suit a pear shape?"). Put their numbers in refs. No sections.
- compare: the user wants to compare 2–3 shown products. refs = those numbers; compareCriterion = what they care about (occasion, comfort…) or null.
- more_like: "more like #3", "like #3 but in blue". refs = [3]; similar = the requested changes (colours/fabrics/patterns ids, maxPrice), label e.g. "in blue" or "".
- clarify: the request is too vague to guide well; ask first, no sections (see VAGUE REQUESTS at the end).
- advice: a shopping question that needs an explanation, not products; no sections (see NON-PRODUCT TURNS at the end).
- chitchat: greetings, thanks, or what you can help with → short friendly reply, no sections.
- off_topic: not about shopping at all; intro "" (see NON-PRODUCT TURNS at the end).

intro (shown first, streamed) is your GUIDANCE, the way a great stylist (or ChatGPT) answers before showing anything:
- recommend: intro = one or two sentences that answer directly (no bullets in intro), and tips = 3–5 guidance bullets, each "**Key idea**: why / how" in one or two sentences (≤ 130 words across tips). Cover what actually works for this occasion, outfit and person: which styles, colours that pair, fabric, how much embellishment, proportions, what to avoid. Build on everything this chat already knows (the outfit they described, occasion, place, season, budget). Example for "purse for my wedding lehenga":
intro "For a wedding lehenga, pick a small, embellished bag that echoes your outfit's work without competing with it."
tips ["**Potli bags** are the classic pick: zari or gota work sits naturally with traditional embroidery.", "**Match the metal**: gold-toned hardware with gold jewellery, silver or oxidised with silver.", "**Keep it compact**: a heavy lehenga needs a bag that carries only the essentials."]
- every other turn type: tips = [].
- refine: 1–2 sentences on what you changed, plus one styling tip for the new direction.
Don't name specific products yet (you haven't seen them).
- product_question: leave intro "" (a detailed answer follows separately).
- compare / more_like: one short lead-in sentence.
- clarify / chitchat: the full reply.
You may use general fashion knowledge freely (fabric behaviour, styling, pairing, occasion norms, climate, body-shape tips). Never invent stock, delivery, discounts, ratings or reviews.

sections: each = a category the user should shop, with title (2–4 words), why = a practical tip for choosing within it (≤ 25 words, e.g. "Pick zari or mirror work if your lehenga is heavily embroidered; plain silk if it's minimal"), categories (1–3 canonical CATEGORY ids from the lists below, e.g. "shirt", "trouser", "loafer", "kurta-set", never department names), optional colors/fabrics/patterns/useCases ids that suit, softPreferences, semanticQuery (clean English, 6–12 words, for embedding search), budgetMax (per-section ₹ cap only when the user gave a total budget; else null), anchor = the exact item this section is for, used to show only exact matches: terms = the ITEM's name as the user said it (or this section's product noun when you chose it, e.g. "anarkali") plus spellings and transliterations of the SAME item only, lowercase ("chaniya choli", "chaniya-choli", "chaniyacholi", "chania choli"); never broader or related items ("lehenga" or "navratri lehenga" are not chaniya choli). Keep named types that change what the item is (bandhani saree, kanjivaram saree, kolhapuri chappal, patola dupatta, potli bag), but leave out plain attributes, which are filtered separately: fabric, colour, fit, print, occasion ("linen kurta" → "kurta", "red silk saree" → "saree"). categoryLevel = true when the name is a whole canonical category ("saree", "kurta set", "loafer"), false when it's narrower than its category ("chaniya choli" within lehenga, "kolhapuri" within sandals, "bandhani saree" within saree). mustInclude = the specific names the user insists on, which every result must mention: a person, team, brand, franchise, character or model ("Virat Kohli t-shirt" → terms ["t-shirt","tshirt","tee","jersey"], mustInclude ["kohli"]; "Nike running shoes" → mustInclude ["nike"]; "Marvel hoodie" → ["marvel"]). Use the most distinctive single word of a name (a surname, the brand). Never put colours, fabrics or styles in mustInclude. Usually []. store = the store or brand the user asked to buy FROM ("leather watch straps from DailyObjects" → "DailyObjects"; "Nike running shoes" is a brand of the product, so it goes in mustInclude, not store); "" when none. The app checks whether that store is available, so don't promise its products in the intro. forItem = for an accessory or part, the main item it is FOR, in one or two words ("watch straps" → "watch"; "phone case" → "phone"; "laptop sleeve" → "laptop"; "saree blouse" → "saree"); "" when the item isn't an accessory of something else (a chaniya choli is a kind of lehenga, not an accessory: "").

base: the chat's running understanding, CARRIED FORWARD from the current state and updated with this message: audience; budgetMin/budgetMax (₹) with budgetStrict (true when the user stated a limit or said "cheaper"); mustColors/mustFabrics ONLY when the user explicitly requires them ("only cotton", "must be black"). Fabrics/colours YOU suggest go in section fabrics/colors, never in must; excludeColors/excludeFabrics/excludePatterns/excludeBrands (canonical ids) and textExclusions (other negatives: "cutouts", "sleeveless", "heavy embroidery"); preferences (soft style words: "breathable", "minimal", "not too heavy"); occasion; sort ("price_asc" for cheapest first / price low to high, "price_desc" for most expensive first / high to low, else "relevance"; a sort request alone is a refine turn that re-issues the previous sections, and the sort is carried forward until the user changes it or starts a new need); summary (short English description of the current need). Keep everything from the previous state unless the user changes or drops it ("polyester is fine now" removes that exclusion; a new unrelated need resets occasion/preferences but keeps audience and exclusions).
Rules: canonical ids only (from the vocabulary). "k" = ×1000; "under 2k" → budgetMax 2000 strict; "around 2000" → 1600–2400 not strict; "cheaper" → budgetMax below most shown prices, strict. Audience: explicit words or gender-implicit items (saree → women, sherwani → men); "for my wife/daughter/dad" sets it; if unknown and the profile has exactly one audience use it. If it's still unknown and the need is gendered clothing or footwear, set ask {"Who is this for?", ["Women","Men","Kids"]} and still plan best-guess sections.

ask: end every recommend/refine/clarify turn with ONE relevant question, as ChatGPT does: the detail that would most improve your next suggestion (outfit colour or work, budget, venue or time of day, formality, who it's for, style leaning) or a natural next step ("Want me to find jewellery to match?"). Short, friendly, specific to this chat. It must unlock NEW information or move the look forward: don't ask them to choose between the sections you just showed (the cards already do that), never repeat a question you asked earlier in this chat ("I asked: …" in the conversation), and never ask what they already told you. Once the main item is settled, suggest the next piece ("Should I find a belt and socks to match?"). Write the question as a natural chat sentence; when it helps, name 2–3 example choices inline ("Is your lehenga red and gold, pastel, or something else?"). options = 2–4 short answers (kept for the app; not shown as buttons). product_question/compare/more_like: a question only if it genuinely helps, else null. chitchat: null.

followups: exactly 3 short next steps (shown only when there is no ask) the user might tap (≤ 5 words each), specific to this turn (e.g. "Under ₹1,500", "Show linen only", "Add a watch"). Never put product numbers in followups or the intro: users can't see them. The numbers below are internal; users point at products by name, colour, position ("the second one") or card buttons.

tasteWhy + useTaste (decide these FIRST; tasteWhy ≤ 12 words): decide from the INTENT of this message whether the user's learned taste (colours, fabrics, brands and budget learned from their clicks and saves; you don't see it, the app applies it as gentle tie-breaks) would genuinely help. true when the ask is open-ended about the user's own style and they haven't specified those things ("new tops for college", "something for date night"). false when it would distort the ask: shopping for someone else (a gift for dad, clothes for a child), a specific or functional need that already states what matters, or a new direction the user asks for ("something different", "bolder than usual", "try a new style"). Rule: if the user asks for a change from their usual (new look, different, bolder, experiment, "than usual", out of comfort zone), useTaste is false: their past taste is exactly what they want to move away from. Examples: "saree for my mom" → false (her taste, not the user's); "gift for dad" → false; "bolder than usual for a party" → false (user wants a change); "office shirts, only white cotton" → false (fully specified); "new tops for college" → true; "what should I wear to brunch" → true. Context from THIS chat always applies; that is not taste.

NON-PRODUCT TURNS. advice: a shopping question that needs an explanation rather than products ("what should I avoid when buying sarees?", "how do I choose running shoes?", "is linen good for humid weather?", "what should I avoid wearing to client meetings?"); no sections, and never make sections of things to avoid; a separate step writes the answer, so keep intro short. off_topic: anything not about shopping, products or style (maths, general knowledge, news, politics, people, coding, homework, health or legal advice, jokes, questions about how you were built or whether you can be copied); intro "", ask null; the app replies with a fixed note and its own follow-up question; never answer the question itself.

VAGUE REQUESTS (turnType clarify): you're a guidance agent, so when a request is too vague to guide well, ask before showing anything. Vague = you know neither WHAT kind of item they want nor an occasion or purpose to choose items for: "men", "women", "kids", "apparel", "clothes", "I need something", "show me something nice", "gift ideas" with no recipient. A gender, a budget, a colour or a vibe alone is not enough. Then: sections = [], intro = one short friendly sentence on what you know so far (this short intro is for clarify only), ask = the single most useful missing detail as a natural, friendly question that names a few example choices inline (e.g. "Are you shopping for everyday wear, office wear, something festive, or footwear and accessories?"), with 3–5 short options. Keep clarifying across turns until you know the item type or an occasion or purpose to recommend for: one new question per turn, never repeat one, never ask what you already know. Only when they answer one of your questions with "just show me", "anything" or "surprise me", stop asking and recommend your best guess; an opening "show me something" is still vague. As soon as the need is clear ("office wear", "a birthday party", "linen shirts"), recommend with the full guidance intro.

Vocabulary (canonical ids):
${tax.promptVocabulary()}

Departments: ${DEPARTMENTS.filter((d) => d.id !== "non-fashion").map((d) => d.id).join(", ")}.

Typical in-stock prices, ₹ p25/median/p75 by audience and department:
${priceBandsText(tax)}`;
  return plannerSystem;
}

/** Department ids ("footwear") → their top-level categories; category ids pass through. */
export function resolveCategories(ids: string[], tax: TaxonomyApi): string[] {
  const out: string[] = [];
  for (const id of ids) {
    if (tax.has("category", id)) out.push(id);
    else if (DEPARTMENTS.some((d) => d.id === id)) {
      out.push(...tax.data.categories.filter((c) => c.department === id && !c.parent).map((c) => c.id));
    } else out.push(id); // sanitizeIntent repairs plurals/near-misses or drops it
  }
  return [...new Set(out)];
}

/** Planner base → Intent. mustKeywords are never used in chat (the planner over-applied them to titles). */
export function toIntent(b: ChatBase, tax: TaxonomyApi, message: string): Intent {
  const i = emptyIntent(b.summary || message);
  const strength = b.budgetStrict ? "must" : "prefer";
  const draft: Intent = {
    ...i,
    audience: { ...b.audience, source: b.audience.segment === "unknown" ? "unknown" : "explicit" },
    colors: { include: b.mustColors, exclude: b.excludeColors, strength: b.mustColors.length ? "must" : "prefer" },
    fabrics: { include: b.mustFabrics, exclude: b.excludeFabrics, strength: b.mustFabrics.length ? "must" : "prefer" },
    patterns: { include: [], exclude: b.excludePatterns, strength: "prefer" },
    brands: { include: [], exclude: b.excludeBrands, strength: "prefer" },
    price: b.budgetMin || b.budgetMax ? { min: b.budgetMin, max: b.budgetMax, strength } : null,
    textExclusions: b.textExclusions,
    softPreferences: b.preferences,
    occasion: b.occasion ? { name: b.occasion, location: null, timeOfYear: null, role: null } : null,
    sort: b.sort,
  };
  return { ...sanitizeIntent(draft, tax, message), mustKeywords: [], needsClarification: null };
}

/**
 * The planner tends to promote colours/fabrics it *suggests* into hard filters. A must colour/fabric
 * survives only if the user actually named it (label or keyword) somewhere in this chat; otherwise it
 * becomes a preference. Exclusions are untouched.
 */
export function keepUserStatedMusts(i: Intent, userText: string, tax: TaxonomyApi): Intent {
  const text = userText.toLowerCase();
  const named = (field: "color" | "fabric", id: string) => {
    const fam = tax.families(field).find((f) => f.id === id);
    const words = [id.replace(/-/g, " "), ...(fam?.label.toLowerCase().split(/\s*\/\s*/) ?? []), ...(fam?.keywords ?? [])].filter((w) => w.length >= 3);
    return words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text));
  };
  const fix = (c: Intent["colors"], field: "color" | "fabric") => {
    if (c.strength !== "must") return c;
    const kept = c.include.filter((id) => named(field, id));
    return kept.length ? { ...c, include: kept } : { ...c, strength: "prefer" as const };
  };
  return { ...i, colors: fix(i.colors, "color"), fabrics: fix(i.fabrics, "fabric") };
}

function compactIntent(i: Intent | null): string {
  if (!i) return "none yet";
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(i)) {
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (typeof v === "object" && "include" in (v as object)) {
      const c = v as { include: string[]; exclude: string[] };
      if (!c.include.length && !c.exclude.length) continue;
    }
    out[k] = v;
  }
  return JSON.stringify(out);
}

const shortTitle = (t: string) => (t.length > 40 ? `${t.slice(0, 38).trimEnd()}…` : t);

/** A minimal card for a product the chat has shown (the client fills in its image from the same ref). */
const shownCard = (p: ShownProduct): ProductCard => ({
  id: p.id,
  title: p.title,
  brand: p.brand,
  category: p.category,
  gender: "",
  color: p.color,
  fabric: p.fabric,
  fit: null,
  pattern: null,
  useCase: [],
  price: p.price,
  sizes: [],
  image: null,
  url: "",
  domain: "",
  reason: "",
  matched: [],
  score: 0,
});

/** A product as the model should write it: a link with a short name (copied as-is into answers). */
const asLink = (p: { ref?: number; title: string }) => `[${shortTitle(p.title)}](#${p.ref})`;

const productLine = (p: ShownProduct) => `#${p.ref} ${p.title} | ${p.brand} | ${p.color}${p.fabric ? ` | ${p.fabric}` : ""} | ₹${Math.round(p.price)}`;

/** Refs sent with the message (card buttons) plus any typed "#n". */
const messageRefs = (input: ChatTurnInput) => [...new Set([...(input.refs ?? []), ...refsInText(input.message)])];

/** "#3", "# 12" → [3, 12] */
export function refsInText(text: string): number[] {
  return [...new Set([...text.matchAll(/#\s?(\d{1,3})\b/g)].map((m) => Number(m[1])))];
}

function plannerUser(input: ChatTurnInput): string {
  // Recent products plus any the user mentions by number (older refs would otherwise fall out of the window).
  const mentioned = new Set(messageRefs(input));
  const recent = input.state.products.slice(-48);
  const shown = [...input.state.products.filter((p) => mentioned.has(p.ref) && !recent.includes(p)), ...recent];
  return [
    `Today: ${(input.today ?? new Date()).toISOString().slice(0, 10)}`,
    FEATURES.memory && input.memory.length ? `What Drape remembers about this user: ${input.memory.join("; ")}` : "",
    memoryLine(input),
    input.audience
      ? `Shopping for (picked in the chat's picker): ${input.audience}. This is only the DEFAULT audience: a recipient named in the conversation ("a gift for my mom" → women, "for my son" → kids boy) or a gendered item ("saree" → women, "sherwani" → men) overrides it.`
      : input.taste?.audiences.length
        ? `Profile audiences: ${input.taste.audiences.join(", ")}`
        : "Profile audiences: none",
    `Current state (base intent): ${compactIntent(input.state.intent)}`,
    input.state.lastSections.length ? `Previous sections: ${input.state.lastSections.map((s) => `${s.title} [${s.categories.join(", ")}] "${s.semanticQuery}"`).join(" | ")}` : "",
    shown.length ? `Products shown so far:\n${shown.map(productLine).join("\n")}` : "No products shown yet.",
    input.history.length ? `Conversation so far:\n${input.history.slice(-8).map((m) => `${m.role}: ${m.content.slice(0, 600)}`).join("\n")}` : "",
    mentioned.size ? `The user is pointing at: ${[...mentioned].map((r) => `#${r}`).join(", ")}` : "",
    input.photo
      ? `The user attached a photo with this message. It shows: ${input.photo}\nRead their words together with the photo ("this", "something like this", "in blue", "what goes with this"). Name the items to search from the photo plus their words.`
      : "",
    `User: ${input.message}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Safety net for the planner's useTaste call: a gift or a clearly named other wearer ("for my mom",
 * "papa ke liye") means the user's own taste doesn't apply to this request.
 */
export function forSomeoneElse(message: string): boolean {
  const who =
    "(?:mom|mum|mother|maa|mummy|dad|papa|father|wife|husband|son|daughter|kid|kids|child|baby|brother|bro|sister|sis|friend|boyfriend|girlfriend|bf|gf|grand(?:ma|pa|mother|father)|nani|dadi|nana|dada|aunt|uncle|chacha|chachi|mama|mami|bhai|bhaiya|didi|bhabhi|niece|nephew|boss|colleague|in-?laws?|fianc[eé]e?|partner)";
  // "my friend's wedding" is the user's occasion, not someone else wearing it: skip possessives.
  const person = `${who}(?!['’]s)\\b`;
  const m = message.toLowerCase();
  return (
    /\bgift(?:s|ing)?\b/.test(m) ||
    new RegExp(`\\bfor\\s+(?:my|our|a|the)\\s+(?:\\w+\\s+)?${person}`).test(m) ||
    new RegExp(`\\b${who}\\s+(?:ke|ki|ka)\\s+liye\\b`).test(m) ||
    /\bfor\s+(?:him|her|them)\b/.test(m)
  );
}

/** The question the assistant closed its last message with ("I asked: …" in the history text). */
export function lastAsked(history: ChatTurnInput["history"]): string | undefined {
  const last = [...history].reverse().find((m) => m.role === "assistant");
  return last?.content.match(/I asked: (.+?)(?:$|\n)/)?.[1];
}

export function sameQuestion(a: string, b: string | undefined): boolean {
  const norm = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  return !!b && norm(a) === norm(b);
}

/** "Shopping for" picker value → Intent audience. */
export function pickedAudience(a: NonNullable<ChatTurnInput["audience"]>): Intent["audience"] {
  return a === "girls" || a === "boys"
    ? { segment: "kids", kidGender: a === "girls" ? "girl" : "boy", ageYears: null, source: "explicit" }
    : { segment: a, kidGender: null, ageYears: null, source: "explicit" };
}

const RECIPIENTS: [RegExp, NonNullable<ChatTurnInput["audience"]>][] = [
  [/(?:mom|mum|mother|maa|mummy|wife|sister|sis|didi|bhabhi|girlfriend|gf|fianc[eé]e|aunt|chachi|mami|nani|dadi|grandma|grandmother|mother-in-law)/, "women"],
  [/(?:dad|papa|father|husband|brother|bro|bhai|bhaiya|boyfriend|bf|fianc[eé]|uncle|chacha|mama|nana|dada|grandpa|grandfather|father-in-law)/, "men"],
  [/(?:daughter|niece|baby girl|little girl)/, "girls"],
  [/(?:son|nephew|baby boy|little boy)/, "boys"],
];

/** The audience of a recipient named in the message ("gift for my mom", "papa ke liye"), if any. */
export function recipientAudience(message: string): ChatTurnInput["audience"] {
  const m = message.toLowerCase();
  for (const [who, a] of RECIPIENTS) {
    const w = who.source;
    if (new RegExp(`\\bfor\\s+(?:my|our|a|the)\\s+(?:[\\w-]+\\s+){0,3}${w}(?!['’]s)\\b`).test(m) || new RegExp(`\\b${w}\\s+(?:ke|ki|ka)\\s+liye\\b`).test(m)) return a;
  }
  return null;
}

function audienceKey(a: Intent["audience"]): ChatTurnInput["audience"] {
  if (a.segment === "women" || a.segment === "men") return a.segment;
  if (a.segment === "kids" && a.kidGender !== "any" && a.kidGender) return a.kidGender === "girl" ? "girls" : "boys";
  return null;
}

/** Safety net: asking for a change from the usual means past taste is what to move away from. */
export function wantsChange(message: string): boolean {
  return /\b(?:than usual|new look|fresh look|different|bolder|experiment\w*|out of (?:my )?comfort zone|change (?:my|of) (?:style|look)|something new|kuch (?:naya|alag|hatke))\b/i.test(message);
}

/**
 * Bolds the first mention of the item in a sentence ("insulated tumblers"), trying the longest names first and
 * allowing a plural. Pure; unit-tested.
 */
export function boldItem(text: string, names: string[]): string {
  const sorted = [...new Set(names.map((n) => n.trim().toLowerCase()).filter((n) => n.length >= 3))].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    const words = name.replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const re = new RegExp(`\\b(${words.map((w) => w.replace(/s$/, "")).join("[\\s-]+")}(?:s|es)?)\\b`, "i");
    const m = re.exec(text);
    if (m) return `${text.slice(0, m.index)}**${m[1]}**${text.slice(m.index + m[1].length)}`;
  }
  return text;
}

/** mustInclude minus the store the shopper asked to buy from (the planner sometimes puts it in both). */
export function namesWithoutStore(names: string[], store: string): string[] {
  const squash = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const st = squash(store);
  return st ? names.filter((n) => squash(n) && !st.includes(squash(n)) && !squash(n).includes(st)) : names;
}

/** Scout's Shopify query for a section: its own angle ("mirror work chaniya choli"), always naming the item and any insisted-on names. */
export function shopifyQuery(anchor: { terms: string[]; mustInclude?: string[]; store?: string } | undefined, semanticQuery: string): string {
  const item = anchor?.terms[0]?.trim();
  if (!item) return semanticQuery;
  const flat = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  let words = semanticQuery.split(/\s+/).slice(0, 8).join(" ");
  if (!flat(words).includes(flat(item))) words = `${item} ${words}`;
  const missing = [...(anchor?.mustInclude ?? []), ...(anchor?.store ? [anchor.store] : [])].filter((n) => !flat(words).includes(flat(n)));
  return missing.length ? `${missing.join(" ")} ${words}` : words;
}

/** Title searches for an anchor: each spelling of the item, with the insisted-on names ("kohli t-shirt"). */
export const anchorQueries = (anchor: { terms: string[]; mustInclude?: string[] }) => anchor.terms.map((t) => [...(anchor.mustInclude ?? []), t].join(" "));

function tasteNote(taste: TastePayload): string {
  const liked = [...taste.likes.colors, ...taste.likes.fabrics, ...taste.likes.brands].slice(0, 3);
  return liked.length ? `Used your taste (${liked.join(", ")})` : "Used your taste";
}

// ---------------------------------------------------------------------------
// Turn
// ---------------------------------------------------------------------------

const PickSchema = z.object({ ref: z.number().int(), headline: z.string(), why: z.string(), tip: z.string() });
type Pick = z.infer<typeof PickSchema>;
const PicksSchema = z.object({ picks: z.array(PickSchema), wrap: z.string() });

const STYLIST_RULES =
  "You are Drape, a warm, knowledgeable stylist for Indian shoppers. Write in friendly, concise English. Use general fashion knowledge and reasonable inference freely (fabric behaviour, fit and feel, styling and pairing, occasion norms, weather, care). Users can't see product numbers: whenever you mention a product, write it as a markdown link with a short name (3–6 words) and its number, e.g. [Libas cotton straight kurta](#3); never write a bare #number. Each link is shown as a small product card with its image, so mention each product once, never wrap a link in brackets or parentheses, and never put a product name next to its own link. Never invent stock, delivery, discounts, ratings or reviews; for those, say the brand's page has the latest details.";

/** The same rules for Scout's answers, as a general shopping assistant. */
const SCOUT_RULES = STYLIST_RULES.replace("You are Drape, a warm, knowledgeable stylist for Indian shoppers.", SCOUT_RULES_PREFIX).replace(
  "general fashion knowledge",
  "general product and fashion knowledge",
);

export async function runChatTurn(input: ChatTurnInput, emit: Emit): Promise<void> {
  const tax = getTaxonomy();
  const usage = new Usage();
  const model = getEnv().OPENAI_MODEL_FAST;
  const t0 = performance.now();
  const timings: Record<string, number> = {};
  const debug: Record<string, unknown> = {};

  // 0. A photo: read it first, so the planner works from what it shows plus the user's words.
  if (input.image && !input.photo) {
    emit({ type: "step", id: "understand", label: "Looking at your photo", status: "running" });
    const p0 = performance.now();
    const seen = await describePhoto(input.image, input.message, usage, input.signal).catch(() => null);
    timings.photo = Math.round(performance.now() - p0);
    if (seen) {
      input = { ...input, photo: seen };
      // The client keeps this on the user's message, so later turns know what the photo showed.
      emit({ type: "photo", description: seen });
    }
  }

  // Memory extraction runs alongside planning and search (Scout with memory on), so it adds no wait.
  const memoryP: Promise<MemoryItem[]> = input.people ? extractMemory(input, usage, input.signal).catch(() => []) : Promise.resolve([]);

  // 1. Understand + plan (intro streams while the rest of the plan is generated)
  emit({ type: "step", id: "understand", label: "Thinking about what you need", status: "running" });
  let introSent = "";
  let tipsSent = 0;
  // Scout and Typesense search keep replies short: their results grid does the showing, so no bullets.
  const withTips = input.style !== "aura";
  // The tips are bullets under the intro; each is sent once complete (the next one has started, or the plan ended).
  const sendTips = (tips: unknown, final: boolean) => {
    if (!Array.isArray(tips)) return;
    const done = (final ? tips : tips.slice(0, -1)).filter((t): t is string => typeof t === "string" && !!t.trim());
    for (; tipsSent < done.length; tipsSent++) emit({ type: "chat_text", block: "intro", delta: `${tipsSent === 0 ? "\n\n" : "\n"}- ${done[tipsSent].trim()}` });
  };
  const plan: Plan = await llmStructuredStream({
    name: "chat-plan",
    model,
    schema: PlanSchema,
    system: input.blend ? scoutPrompt(tax) : input.style === "aura" ? plannerPrompt(tax) + AURA_STYLE : plannerPrompt(tax),
    user: plannerUser(input),
    usage,
    signal: input.signal,
    timeoutMs: 30_000,
    onPartial: (p) => {
      // turnType is generated first: an off-topic answer is never streamed, and advice has its own answer step.
      if (p.turnType === "off_topic" || p.turnType === "advice") return;
      if (typeof p.intro === "string" && p.intro.length > introSent.length && p.intro.startsWith(introSent)) {
        emit({ type: "chat_text", block: "intro", delta: p.intro.slice(introSent.length) });
        introSent = p.intro;
      }
      if (withTips && p.turnType === "recommend" && Array.isArray(p.tips) && p.tips.length) sendTips(p.tips, false);
    },
  });
  if (plan.turnType === "off_topic") {
    // A fixed note, whatever the model drafted: we never answer non-shopping questions.
    emit({ type: "chat_text", block: "intro", delta: OFF_TOPIC_NOTE });
  } else if (plan.turnType !== "advice") {
    if (plan.intro.length > introSent.length && plan.intro.startsWith(introSent)) emit({ type: "chat_text", block: "intro", delta: plan.intro.slice(introSent.length) });
    // Bullets only once, and only when the intro didn't already include its own.
    if (withTips && plan.turnType === "recommend" && !/^\s*[-•*]\s+/m.test(plan.intro)) sendTips(plan.tips, true);
  }
  // Scout bolds the key words; when the model didn't, bold the item's name where the intro mentions it.
  if (input.blend && (plan.turnType === "recommend" || plan.turnType === "refine") && plan.intro && !plan.intro.includes("**")) {
    const bolded = boldItem(plan.intro, plan.sections.flatMap((s) => [...s.anchor.terms, s.title]));
    if (bolded !== plan.intro) emit({ type: "chat_text", block: "intro", delta: bolded, replace: true });
  }
  timings.understand = Math.round(performance.now() - t0);
  emit({ type: "step", id: "understand", label: "Thinking about what you need", status: "done", ms: timings.understand });
  debug.plan = { turnType: plan.turnType, useTaste: plan.useTaste, tasteWhy: plan.tasteWhy, refs: plan.refs, ask: plan.ask, sections: plan.sections.map((s) => s.title) };

  // Sticky base intent: the planner carries it forward; guard against dropping a known audience by accident.
  let base = keepUserStatedMusts(
    toIntent(plan.base, tax, input.message),
    [...input.history.filter((m) => m.role === "user").map((m) => m.content), input.message].join(" \n "),
    tax,
  );
  const prev = input.state.intent;
  if (prev && base.audience.segment === "unknown" && prev.audience.segment !== "unknown") base = { ...base, audience: prev.audience };
  // A named recipient in this message beats the picker and a carried-over audience.
  const recipient = recipientAudience(input.message);
  if (recipient && recipient !== audienceKey(base.audience)) base = { ...base, audience: pickedAudience(recipient) };
  if (base.audience.segment === "unknown" && input.audience) base = { ...base, audience: pickedAudience(input.audience) };
  // What the user actually said in this chat. It's what the chat remembers; taste is layered on per turn,
  // so a learned budget can't turn into "the user's budget" on a later "cheaper".
  const userBase = base;
  // Taste is used only when the planner judged it useful for this request's intent (with a guard for gifts).
  const taste = plan.useTaste && !forSomeoneElse(input.message) && !wantsChange(input.message) ? input.taste : undefined;
  const personalized = applyTaste(base, taste, tax);
  base = personalized.intent;
  // The planner may also have used taste directly (colours, budget), so say so whenever it's on.
  if (taste) personalized.notes.unshift(tasteNote(taste));
  // Scout memory: say whose notes shaped this answer (the reply mentions them too).
  const remembered = rememberedFacts(input);
  if (remembered && plan.turnType !== "off_topic" && plan.turnType !== "chitchat") {
    personalized.notes.push(`Remembered about ${remembered.person.key === SELF ? "you" : remembered.person.label}: ${remembered.facts.slice(0, 3).map((f) => f.replace(/ \(learned\)$/, "")).join(", ")}`);
  }

  const specs: ChatSectionSpec[] =
    plan.turnType === "refine" && !plan.sections.length
      ? input.state.lastSections
      : plan.sections.slice(0, 5).map((s) => ({
          title: s.title,
          categories: resolveCategories(s.categories, tax),
          colors: s.colors,
          fabrics: s.fabrics,
          patterns: s.patterns,
          useCases: s.useCases,
          softPreferences: s.softPreferences,
          semanticQuery: s.semanticQuery,
          budgetMax: s.budgetMax,
          anchor: s.anchor.terms.length
            ? {
                terms: s.anchor.terms.slice(0, 6),
                categoryLevel: s.anchor.categoryLevel,
                // A store is a preference (with a note when unavailable), never a word every title must contain.
                ...(namesWithoutStore(s.anchor.mustInclude, s.anchor.store).length ? { mustInclude: namesWithoutStore(s.anchor.mustInclude, s.anchor.store).slice(0, 4) } : {}),
                ...(s.anchor.store.trim() ? { store: s.anchor.store.trim() } : {}),
                ...(s.anchor.forItem.trim() ? { forItem: s.anchor.forItem.trim().toLowerCase() } : {}),
              }
            : undefined,
        }));
  const whyByTitle = new Map(plan.sections.map((s) => [s.title, s.why]));
  // A clarify turn only asks: products come once the need is clear.
  const hasSections = (plan.turnType === "recommend" || plan.turnType === "refine") && specs.length > 0;

  emit({
    type: "chat_state",
    // An off-topic message changes nothing the chat knows.
    intent: plan.turnType === "off_topic" && input.state.intent ? input.state.intent : userBase,
    chips: deriveChips(plan.turnType === "off_topic" && input.state.intent ? input.state.intent : userBase, tax),
    lastSections: hasSections ? specs : input.state.lastSections,
    personalized: personalized.notes,
    ...(input.people ? { forPerson: plan.turnType === "off_topic" ? (input.state.forPerson ?? null) : forPersonOf(input) } : {}),
  });
  const asked = plan.ask?.question.trim() ?? "";
  // The model sometimes repeats its last question; drop it then (the follow-up chips show instead).
  const fresh = asked && !sameQuestion(asked, lastAsked(input.history)) ? { question: asked, options: plan.ask!.options.slice(0, plan.turnType === "clarify" ? 5 : 4) } : null;
  // Clarify and off-topic turns always end with a question. Off-topic steers back to shopping (never answers),
  // with a question from its own small call that links the topic to shopping where that's natural.
  let ask = plan.turnType === "clarify" ? (fresh ?? (input.blend ? SCOUT_CLARIFY_FALLBACK : CLARIFY_FALLBACK)) : fresh;
  if (plan.turnType === "off_topic") {
    const bridge = await offTopicBridge(input.message, !!input.blend, usage, input.signal);
    ask = sameQuestion(bridge.question, lastAsked(input.history)) ? OFF_TOPIC_FALLBACK : bridge;
  }

  let nextRef = input.state.nextRef;
  const withRefs = (cards: ProductCard[]) => cards.map((c) => ({ ...c, ref: nextRef++ }));
  // Refs typed by the user win; the planner's refs fill in ("the second one", "that Libas kurta").
  const typedRefs = messageRefs(input);
  const refProducts = (refs: number[]) =>
    [...new Set([...typedRefs, ...refs])].map((r) => input.state.products.find((p) => p.ref === r)).filter((p): p is ShownProduct => !!p);

  // 2. Act
  if (hasSections) {
    const planned = specs.map((s, i) => ({ id: `s${Date.now().toString(36)}-${i}`, spec: s, why: whyByTitle.get(s.title) ?? "", intent: sectionIntent(base, s, tax) }));
    // Scout mixes in Shopify Global Catalog matches, fetched in parallel with Typesense. It shows only the first
    // segment; the rest are offered as pills and fetched when tapped (/api/blend/section with these filters).
    const blendShopify = !!input.blend;
    const sections = blendShopify ? planned.slice(0, 1) : planned;
    const offered = blendShopify ? planned.slice(1) : [];
    emit({ type: "sections_plan", sections: sections.map(({ id, spec, why }) => ({ id, title: spec.title, why })) });
    emit({ type: "step", id: "search", label: "Finding options in the catalog", status: "running" });
    const s0 = performance.now();
    // Scout: Shopify is searched by the item's name; Typesense also searches titles for it in any category.
    const [rails, shopifyLists, anchorLists] = await Promise.all([
      retrieveRails(
        // Scout pulls the same pool as its results grid, so the chat's top 8 are the top of the grid's one list.
        sections.map((s) => ({ id: s.id, title: s.spec.title, intent: s.intent, perPage: blendShopify ? SCOUT_LIST.catalogPerPage : 40 })),
        tax,
      ),
      blendShopify
        ? Promise.all(
            sections.map((s, i) =>
              shopifyForSection({
                // The photographed item is the first section: Shopify searches by the photo plus the item and the
                // shopper's own words; a long planner query would drown out what the photo shows.
                query: input.image && i === 0 ? shopifyQuery(s.spec.anchor, input.message) : shopifyQuery(s.spec.anchor, s.intent.semanticQuery || s.spec.title),
                ...(input.image && i === 0 ? { image: input.image } : {}),
                audience: s.intent.audience,
                min: s.intent.price?.min,
                max: s.intent.price?.max,
                limit: SCOUT_LIST.shopifyLimit,
                signal: input.signal,
              }),
            ),
          )
        : Promise.resolve([] as ProductCard[][]),
      blendShopify
        ? Promise.all(sections.map((s) => (s.spec.anchor ? retrieveAnchor(s.intent, anchorQueries(s.spec.anchor), tax, SCOUT_LIST.anchorPerPage) : Promise.resolve([]))))
        : Promise.resolve([] as ProductCard[][]),
    ]);
    // Scout: only exact matches from either source; our catalog first, then Shopify, each by relevance.
    const blended = blendShopify
      ? await Promise.all(
          sections.map((s, i) =>
            rankBlend({
              // Our catalog is fashion-only: a section with no fashion category (headphones, cookware) uses partner stores only.
              catalog: s.spec.categories.length ? [...(anchorLists[i] ?? []), ...tasteBoost(rails[i].products, taste, tax)] : [],
              shopify: shopifyLists[i] ?? [],
              query: s.intent.semanticQuery || s.spec.title,
              anchor: s.spec.anchor ?? null,
              sectionCategories: s.spec.categories,
              tax,
              limit: SCOUT_LIST.limit,
              perBrand: SCOUT_LIST.perBrand,
              sort: s.intent.sort,
              visual: !!input.image && i === 0,
              usage,
              signal: input.signal,
            }),
          ),
        )
      : [];
    // Sections of one answer shouldn't repeat each other: earlier sections keep their items, later ones
    // take the next best (repeats only when a section would otherwise run short).
    const usedIds = new Set<string>();
    // Each section's list is cached under its id: its top 8 go in the chat, and the results grid reads the same list.
    const blendedShown = blended.map((r, i) => {
      const fresh = r.products.filter((p) => !usedIds.has(p.id));
      const list = fresh.length >= 4 ? fresh : [...fresh, ...r.products.filter((p) => usedIds.has(p.id))];
      scoutLists.set(sections[i].id, { ...r, products: list });
      const pick = list.slice(0, 8);
      pick.forEach((p) => usedIds.add(p.id));
      return pick;
    });
    timings.search = Math.round(performance.now() - s0);
    emit({ type: "step", id: "search", label: "Finding options in the catalog", status: "done", ms: timings.search });

    const top: { title: string; products: ProductCard[] }[] = [];
    rails.forEach((rail, i) => {
      const s = sections[i];
      // 8 per section like a chat answer; "See all" lists more with these same filters (/api/chat/section).
      const ranked = sortByPrice(diversify(tasteBoost(rail.products, taste, tax), 8, 2), s.intent.sort);
      const shown = withRefs(blendShopify ? blendedShown[i] : ranked.slice(0, 8));
      // Scout: when the store the shopper asked for isn't available, say so above the other stores' results.
      const storeNote = blendShopify ? blended[i].storeNote : undefined;
      const anchor = s.spec.anchor;
      const emptyNote = blendShopify && anchor && !shown.length ? noExactNote(anchor) : undefined;
      const more: ProductCard[] = [];
      top.push({ title: s.spec.title, products: shown.slice(0, 4) });
      emit({ type: "section", id: s.id, title: s.spec.title, why: s.why, query: s.intent.semanticQuery, products: shown, more, relaxedNote: blendShopify ? storeNote : rail.relaxedNote, intent: rail.intent, ...(blendShopify ? { anchor, emptyNote } : {}) });
    });
    if (offered.length) {
      emit({
        type: "segments",
        items: offered.map((o) => ({ id: o.id, title: o.spec.title, why: o.why, intent: o.intent, anchor: o.spec.anchor, categories: o.spec.categories })),
      });
    }
    debug.rails = rails.map((r) => ({ id: r.id, title: r.title, q: r.debug.q, filter: r.debug.filter, rounds: r.debug.rounds, dropped: r.debug.dropped, relaxed: r.relaxed.map((x) => x.id) }));

    // 3. Drape's picks: 3–4 products explained like a stylist would (what it is, why it suits, how to style it).
    // Aura++ skips them: its results grid does the showing, and it saves a model call per turn.
    if (input.style !== "aura" && top.some((t) => t.products.length)) {
      emit({ type: "step", id: "curate", label: "Picking my favourites", status: "running" });
      const w0 = performance.now();
      const candidates = top.flatMap((t) => t.products);
      const raw = new Map((await getRawProducts(candidates.map((c) => c.id)).catch(() => [])).map((r) => [r.id, r]));
      const valid = new Set(candidates.map((c) => c.ref));
      let sent = 0;
      const sendPicks = (items: Partial<Pick>[], final: boolean) => {
        // A pick is complete once the next one starts (or the stream ends).
        const done = (final ? items : items.slice(0, -1)).filter((x): x is Pick => !!x.ref && valid.has(x.ref) && !!x.why);
        if (done.length > sent || (final && done.length !== sent)) {
          sent = done.length;
          emit({ type: "picks", items: done.map((x) => ({ ref: x.ref, headline: x.headline ?? "", why: x.why, tip: x.tip ?? "" })) });
        }
      };
      const res = await llmStructuredStream({
        name: "chat-picks",
        model,
        schema: PicksSchema,
        system: `${STYLIST_RULES}
You just gave styling guidance and the catalog returned options. Pick your 3–4 favourites across the sections (the strongest match first; cover different sections when they're all good) and explain each like a stylist in a store, so the user understands the product, not just its name:
- ref: the product's number.
- headline: ≤ 6 words on what it's best for ("Best with heavy zari", "Easiest all-day comfort", "Best value under ₹2k").
- why: 2–3 sentences. Say what the product actually is (fabric, work or embellishment, cut and fit, colour) using the details given, and why that suits this user's occasion, outfit, weather or budget. Be specific; no generic praise.
- tip: 1 sentence on how to wear or pair it.
- wrap: 1 short sentence tying the picks together (≤ 25 words). No question.
Don't write product numbers in the text.`,
        user: `User asked: ${input.message}\nYour guidance: ${[plan.intro, ...plan.tips].join(" ")}\nWhat you know: ${intentSummary(base, tax)}\n\nOptions by section:\n${top
          .map(
            (t) =>
              `${t.title}:\n${t.products
                .map((p) => {
                  const r = raw.get(p.id);
                  return `#${p.ref} ${p.title} | ${p.brand} | ₹${Math.round(p.price)} | colour ${p.color}${p.fabric ? ` | fabric ${p.fabric}` : ""}${p.fit ? ` | fit ${p.fit}` : ""}${r?.pattern ? ` | pattern ${r.pattern}` : ""}${r?.use_case?.length ? ` | occasions ${r.use_case.slice(0, 3).join(", ")}` : ""}${r?.description ? ` | ${cleanText(r.description).slice(0, 180)}` : ""}`;
                })
                .join("\n")}`,
          )
          .join("\n\n")}`,
        usage,
        signal: input.signal,
        timeoutMs: 25_000,
        onPartial: (partial) => Array.isArray(partial.picks) && sendPicks(partial.picks as Partial<Pick>[], false),
      }).catch(() => null);
      if (res) {
        sendPicks(res.picks, true);
        if (res.wrap.trim()) emit({ type: "chat_text", block: "outro", delta: res.wrap.trim() });
      }
      timings.write = Math.round(performance.now() - w0);
      emit({ type: "step", id: "curate", label: "Picking my favourites", status: "done", ms: timings.write });
    }
  } else if (plan.turnType === "advice") {
    // Shopping advice gets its own answer step: the planner's intro is too short for real dos and don'ts.
    await llmTextStream({
      name: "chat-advice",
      model,
      system: `${input.blend ? SCOUT_RULES : STYLIST_RULES}\nAnswer the shopping question with practical, specific advice for this person: one sentence that answers directly, a blank line, then 3–5 "- **Point**: why" bullets of concrete dos and don'ts (≤ 140 words). No product links (no products were searched).`,
      user: `Context: ${intentSummary(base, tax)}\nConversation:\n${input.history
        .slice(-4)
        .map((m) => `${m.role}: ${m.content.slice(0, 400)}`)
        .join("\n")}\n\nQuestion: ${input.message}`,
      usage,
      signal: input.signal,
      maxTokens: 320,
      onDelta: (delta) => emit({ type: "chat_text", block: "answer", delta }),
    });
  } else if (plan.turnType === "product_question") {
    let targets = refProducts(plan.refs);
    if (!targets.length) targets = input.state.products.slice(-6);
    const raw = targets.length ? await getRawProducts(targets.filter((t) => !isShopifyId(t.id)).map((t) => t.id)) : [];
    const byId = new Map(raw.map((r) => [r.id, r]));
    // Shopify products aren't in Typesense: read their live details from Shopify instead.
    const shopifyLines = new Map(
      await Promise.all(targets.filter((t) => isShopifyId(t.id)).map(async (t) => [t.id, await shopifyFacts(t.id, input.signal)] as const)),
    );
    await llmTextStream({
      name: "chat-answer",
      model,
      system: `${input.blend ? SCOUT_RULES : STYLIST_RULES}\nAnswer the user's question about the products below like an expert: direct answer first, then the reasoning (fabric, construction, fit, occasion, weather, body shape, styling). If comparing, say which one wins for what. 2–5 sentences, or a short list if several products.
When they ask which is best, to rank or to sort the products (in any language, e.g. "aama thi best kai?", "inme se best kaunsa?"), answer with one sentence, then a numbered list ranked best first, one line per product, exactly in this form: "1. [short name](#n): the reason in under 15 words" (the link IS the product name; don't write the name again or "(#n)"). Rank by what they asked for (overall fit for their need, price, comfort…); for price, order by the prices given.`,
      user: `Context: ${intentSummary(base, tax)}\nConversation:\n${input.history
        .slice(-4)
        .map((m) => `${m.role}: ${m.content.slice(0, 400)}`)
        .join("\n")}\n\nProducts:\n${targets
        .map((t) => {
          const facts = shopifyLines.get(t.id);
          if (isShopifyId(t.id)) return `${asLink(t)} | ${t.brand} (an online store on Shopify) | ₹${Math.round(t.price)} | ${facts ?? "details unavailable"}`;
          const r = byId.get(t.id);
          return `${asLink(t)} | ${t.brand} | ₹${Math.round(t.price)} | colour ${t.color} | fabric ${r?.fabric ?? t.fabric ?? "?"} | fit ${r?.fit ?? "?"} | pattern ${r?.pattern ?? "?"} | occasions ${(r?.use_case ?? []).join(", ")} | sizes ${(r?.sizes ?? []).slice(0, 10).join(", ") || "not listed"} | ${cleanText(r?.description).slice(0, 200)}`;
        })
        .join("\n")}\n\nQuestion: ${input.message}`,
      usage,
      signal: input.signal,
      maxTokens: 350,
      onDelta: (delta) => emit({ type: "chat_text", block: "answer", delta }),
    });
  } else if (plan.turnType === "compare") {
    const targets = refProducts(plan.refs).slice(0, 3);
    if (targets.length >= 2) {
      emit({ type: "step", id: "curate", label: "Comparing them side by side", status: "running" });
      try {
        // Partner-store products aren't in our catalog: compare them on their live details.
        const extra = await Promise.all(
          targets
            .filter((t) => isShopifyId(t.id))
            .map(async (t) => ({
              id: t.id,
              card: { ...shownCard(t), source: "shopify" as const },
              facts: (await shopifyFacts(t.id, input.signal)) ?? "details unavailable",
            })),
        );
        const res = await compareProducts({
          ids: targets.map((t) => t.id),
          extra,
          general: !!input.blend,
          query: `${input.message} (${intentSummary(base, tax)})`,
          criterion: plan.compareCriterion ?? undefined,
          usage,
          signal: input.signal,
        });
        const refById = new Map(targets.map((t) => [t.id, t.ref]));
        emit({ type: "compare", data: { ...res, products: res.products.map((p) => ({ ...p, ref: refById.get(p.id) })) } });
      } catch (err) {
        debug.compareError = String(err);
        emit({ type: "chat_text", block: "answer", delta: "I couldn't finish the comparison just now. Please try again in a moment." });
      }
      emit({ type: "step", id: "curate", label: "Comparing them side by side", status: "done" });
    } else {
      emit({ type: "chat_text", block: "answer", delta: "Tell me which two or three to compare. Tap Compare on the cards or say e.g. “compare #1 and #3”." });
    }
  } else if (plan.turnType === "more_like") {
    const target = refProducts(plan.refs)[0];
    if (target) {
      emit({ type: "step", id: "search", label: "Finding similar pieces", status: "running" });
      const fromShopify = isShopifyId(target.id);
      const blendShopify = !!input.blend || fromShopify;
      const shopifyMatches = blendShopify ? shopifyLike(target, { max: plan.similar?.maxPrice ?? null, signal: input.signal }) : Promise.resolve([] as ProductCard[]);
      const emb = fromShopify ? undefined : (await getEmbeddings([target.id])).get(target.id);
      const changes = sanitizeIntent(
        mergeIntent(emptyIntent(""), {
          colors: { include: plan.similar?.colors ?? [], exclude: base.colors.exclude, strength: "must" },
          fabrics: { include: plan.similar?.fabrics ?? [], exclude: base.fabrics.exclude, strength: "must" },
          patterns: { include: plan.similar?.patterns ?? [], exclude: base.patterns.exclude, strength: "must" },
          textExclusions: base.textExclusions,
          price: plan.similar?.maxPrice ? { min: null, max: plan.similar.maxPrice, strength: "must" } : null,
        }),
        tax,
      );
      const found = emb ? await vectorNeighbours({ vector: emb.vec, genders: gendersLike(emb.doc.gender), excludeIds: [target.id], k: 16, intent: changes }) : [];
      const catalog = tasteBoost(found, taste, tax);
      const shopifyFound = await shopifyMatches;
      // A Shopify product's look-alikes come from Shopify; a catalog product's are catalog first, Shopify blended in.
      // A catalog product's look-alikes from both sources share one similarity scale (catalog first on ties).
      const ranked = fromShopify
        ? shopifyFound
        : blendShopify
          ? (await rankBlend({ catalog: catalog.slice(0, 12), shopify: shopifyFound, query: target.title, anchor: null, sectionCategories: [], tax, limit: 12, usage, signal: input.signal })).products
          : catalog;
      // The label is the requested change ("in blue"); the planner sometimes echoes the product name instead.
      const rawLabel = plan.similar?.label?.trim() ?? "";
      const echoes = /^(more )?like\b/i.test(rawLabel) || target.title.toLowerCase().includes(rawLabel.toLowerCase().replace(/^(more )?like\s+/i, "").slice(0, 20));
      const label = rawLabel && !echoes ? ` · ${rawLabel}` : "";
      emit({ type: "step", id: "search", label: "Finding similar pieces", status: "done" });
      emit({ type: "section", id: `like-${target.ref}-${Date.now().toString(36)}`, title: `More like ${shortTitle(target.title)}${label}`, why: target.title, query: `${target.title}${label}`, products: withRefs(ranked.slice(0, blendShopify ? 12 : 8)), more: [] });
    }
  }

  // Memory learned from this message (its own extraction step, run alongside the turn): the client files it by person.
  const memory = await memoryP;
  if (memory.length) emit({ type: "memory", facts: memory });

  // The closing question comes last, after the products and picks.
  if (ask) emit({ type: "ask", ...ask });
  emit({ type: "suggestions", items: plan.turnType === "off_topic" ? [] : plan.followups.slice(0, 3) });
  timings.total = Math.round(performance.now() - t0);
  if (input.debug) emit({ type: "debug", data: { ...debug, base, llmCalls: usage.calls } });
  emit({ type: "done", timings, tokens: { in: usage.in, out: usage.out }, costUsd: +usage.costUsd.toFixed(5), cacheHit: false });
  if (process.env.NODE_ENV !== "test") {
    console.log(JSON.stringify({ at: new Date().toISOString(), event: "chat", turnType: plan.turnType, message: input.message.slice(0, 120), timings, tokens: { in: usage.in, out: usage.out }, costUsd: +usage.costUsd.toFixed(5) }));
  }
}
