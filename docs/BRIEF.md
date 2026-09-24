# Build Brief — Agentic Fashion Discovery POC (Next.js)

> **For Claude Code.** This is the full spec for an internal proof-of-concept. Read the whole document before writing code.
> Work milestone by milestone (§14). Start with **Milestone 0 (catalog discovery)**, because several decisions depend on the real data.
> After each milestone:
> - run `typecheck`, `lint` and the relevant tests/eval
> - summarise what changed and anything that deviated from this brief
> - commit.
>
> If the data contradicts an assumption here, trust the data, write the deviation into `docs/DECISIONS.md` and carry on.

---

## 1. What we're building

An AI shopping stylist for the Indian fashion market (women, men, kids). Users describe what they want in their own words, including English, Hinglish or Hindi in Latin script. The app does three things:

1. It understands the request, including hard needs, soft preferences and exclusions.
2. It suggests what categories to shop when the intent is an occasion or a vibe, not a single product.
3. It returns products from our 5.5-lakh catalog (Typesense), each with a one-line reason explaining why it fits.

Buying means redirecting the user to the brand's product page. The reference product is plush.shop (search-first, "edits" with shareable URLs, smart filters). We are building our own brand and design, not a copy.

**Working name:** `Drape`. Keep it in one config constant so it's easy to rename.

### Product principles (these drive every decision)
1. **"These are what I asked for."** Every constraint the user states is visible, editable and respected. Exclusions ("no polyester", "not red", "no cutouts") are never violated in the results.
2. **Show your understanding.** Show the parsed intent as chips, stream the agent's steps, and give each product a reason.
3. **Plan, don't just match.** Occasion, vibe and gift queries become a short stylist note plus 3–5 category rails.
4. **Never dead-end.** If zero results come back, relax constraints step by step and say what was relaxed.
5. **Don't block the user.** Ask at most one clarifying question, and always show best-guess results beneath it.
6. **Explicit request > learned taste.** Session taste only breaks ties and fills gaps.

---

## 2. Fixed decisions

| Area | Decision |
|---|---|
| Framework | Next.js (latest stable, App Router), TypeScript `strict`, everything in one app. API = Route Handlers (`runtime = 'nodejs'`). |
| UI | Tailwind CSS + shadcn/ui, lucide-react icons, framer-motion for step/rail animations. |
| State | Zustand (`persist` → localStorage) for session taste, saved items, compare tray, onboarding. |
| Validation | zod everywhere at API boundaries. |
| Search | `typesense` JS client, **server-side only**. Never expose keys to the browser. |
| LLM | Official `openai` Node SDK with structured outputs (JSON schema, strict) for extraction/rerank, and tool calling for the refine agent. Model names come from env vars. |
| Streaming | Server-Sent Events from route handlers (`ReadableStream`); a small typed client hook consumes them. |
| Market | India, INR, `en-IN` number formatting (₹1,999). |
| Audience | Women, men, kids (girls/boys). Fashion only: apparel, footwear, bags, accessories, jewellery. |
| Interaction | Search-first results page plus a **refinement chat drawer** that drives the same results. |
| Checkout | None. "Shop on <domain>" opens `product_url` in a new tab with UTM params. |
| Personalization | Anonymous, session/device-level (localStorage). No auth, no DB. |
| Audience of POC | Internal. Prioritise search quality and transparency (debug panel) over polish, but it should still look good. |

---

## 3. Environment

Create `.env.local` (git-ignored) and `.env.example`. **Never commit secrets and never hard-code them.** The developer will paste the values.

```dotenv
TYPESENSE_HOST=http://<host>:8108      # parse into protocol/host/port for the client
TYPESENSE_SEARCH_KEY=
TYPESENSE_COLLECTION=products

OPENAI_API_KEY=
OPENAI_MODEL_FAST=gpt-4.1-mini          # intent extraction, rerank, refine agent
OPENAI_MODEL_VISION=gpt-4.1-mini        # image search (must accept image input)
OPENAI_MODEL_OFFLINE=gpt-4.1            # one-off taxonomy build script

NEXT_PUBLIC_APP_NAME=Drape
```

On boot in dev, verify that the configured OpenAI models exist (`models.list`). If a default isn't available, log a clear warning and suggest the closest available fast, non-reasoning model. For reasoning models, set the lowest reasoning effort. Latency matters more than depth here.

The Typesense key is **search-only**. Document GET endpoints may be forbidden, so fetch documents with `search` / `multi_search` using `filter_by: id:[...]`.

---

## 4. Catalog facts (Typesense collection `products`)

```
title          string     indexed, infix
brand          string     facet
category       string     facet
gender         string     facet
color          string     facet
fabric         string?    facet
fit            string?    facet
pattern        string?    facet
use_case       string[]?  facet      ← closest thing to "occasion"
sizes          string[]   facet
price          float      facet, sort   (INR)
in_stock       bool       facet, sort
is_active      bool?      sort
description    string     indexed
image_url      string?    not indexed
product_url    string     not indexed
embedding      float[384] auto-embedded by Typesense (ts/all-MiniLM-L12-v2)
               from: title, category, gender, color, fabric, fit, use_case, description
               cosine, HNSW
```

What this implies:
- **Hybrid search is built in.** Put `embedding` in `query_by`, and Typesense embeds `q` itself. MiniLM is **English-only** and fairly weak, so we always send a clean, descriptive **English** `semanticQuery` generated by the LLM, never the raw Hinglish text.
- **No image vectors.** Image search goes image → vision LLM → text intent.
- **No MRP/discount, rating, sub-category, length, neckline or sleeve fields.** Those attributes live only in `title`/`description`. The rerank LLM judges them, and a text post-filter handles exclusions.
- **`image_url` is optional and not filterable.** Over-fetch and drop items without images before display.
- **Facet values are unknown and probably messy** (e.g. "Navy", "Navy Blue", "navy-blue"). This is why Milestone 0 and the taxonomy (§6.2) exist.

### Milestone 0 — Catalog discovery (do this first, write `docs/catalog-notes.md`)
Write `scripts/discover.ts`. It should:
1. Report the total document count, plus counts for `in_stock:true`, `is_active:true`, `is_active:false` and missing `is_active` (to decide the base filter).
2. Dump all facet values with counts for `gender, category, color, fabric, fit, pattern, use_case, sizes, brand`, using a high `max_facet_values`, into `data/raw-facets/*.json`.
3. Compute the price distribution (min/p10/p25/median/p75/p90/max), both overall and per gender.
4. Sample 30 random documents (excluding `embedding`) and note:
   - `image_url` coverage and image domains
   - `product_url` domains
   - `description` quality and language.
5. Run 5 test hybrid queries to confirm `query_by: "title,embedding"` works on this server version, and record latency.
6. Summarise the findings and the resulting decisions:
   - the base filter
   - how gender values map to women/men/girls/boys/unisex
   - size formats
   - anything surprising.

---

## 5. Architecture

```
Browser (Next.js client)
  ├─ Zustand session store (profile, likes, dislikes, clicks, searches, compare, saved)
  ├─ useAgentStream() ── SSE ──► /api/search      (main pipeline)
  │                         ──► /api/refine      (chat agent → drives results)
  │                         ──► /api/image-search
  └─ fetch ─► /api/similar, /api/for-you, /api/compare, /api/surprise, /api/products

Server (route handlers, Node runtime)
  lib/agent/
    intent.ts        LLM → Intent (structured output)
    taxonomy.ts      canonical concepts ⇄ raw facet values (loaded from data/taxonomy.json)
    queryBuilder.ts  Intent → Typesense params (pure, unit-tested)
    retrieve.ts      multi_search, relaxation ladder, text post-filter, dedupe, diversity
    rerank.ts        LLM rerank + reasons (with deterministic fallback)
    plan.ts          occasion / vibe / gift → stylist note + rails
    pipeline.ts      orchestrates steps, emits SSE events, timings, token usage
    refineAgent.ts   tool-calling loop for the chat drawer
  lib/typesense.ts, lib/openai.ts, lib/sse.ts, lib/cache.ts (in-memory LRU)
```

### Folder layout
```
src/app/(site)/page.tsx                 home
src/app/(site)/edits/[slug]/page.tsx    results for a query (shareable)
src/app/(site)/p/[id]/page.tsx          product detail (also used as quick view)
src/app/(site)/saved/page.tsx
src/app/(site)/compare/page.tsx
src/app/api/{search,refine,image-search,similar,for-you,compare,surprise,products}/route.ts
src/components/{search,results,product,chat,taste,compare,debug,ui}/...
src/lib/agent/*, src/lib/*
src/store/session.ts
data/taxonomy.json, data/raw-facets/*.json, data/examples.json
scripts/discover.ts, scripts/build-taxonomy.ts, scripts/eval.ts
docs/catalog-notes.md, docs/DECISIONS.md, docs/eval-report.md
```

---

## 6. The search agent pipeline (`/api/search`)

The pipeline is a real **plan → act → observe → adapt → explain** loop with at most 2 adaptation rounds. Every step emits an SSE `step` event, so the user sees the agent working.

```
1. Understand   intent.ts: query + taste summary + today's date → Intent
2. Clarify?     if Intent.needsClarification → emit `clarify` (non-blocking; continue with best guess)
3. Plan         if kind ∈ {occasion, vibe, gift, browse} → plan.ts → stylist note + 3–5 rails
                else → one "main" rail
4. Retrieve     queryBuilder → multi_search (all rails in ONE request), pool 60–80 per rail
5. Observe      counts per rail; if < 8 good hits → relaxation ladder (§6.4); record what was relaxed
6. Curate       text post-filter for exclusions → dedupe → brand diversity → rerank.ts (rails in parallel)
7. Adapt        if rerank keeps < 6 items with score ≥ 0.5 → LLM rewrites semanticQuery once and retries 4–6
8. Explain      emit results with reasons, relaxation notes, smart filters, timings
```

### 6.1 Intent schema (zod; mirror as strict JSON schema, with optional fields as `nullable`)

```ts
type Strength = 'must' | 'prefer';
type Constraint = { include: string[]; exclude: string[]; strength: Strength }; // canonical ids from taxonomy

type Intent = {
  kind: 'product' | 'occasion' | 'vibe' | 'gift' | 'similar' | 'browse';
  language: 'en' | 'hinglish' | 'hi';
  audience: {
    segment: 'women' | 'men' | 'kids' | 'unisex' | 'unknown';
    kidGender: 'girl' | 'boy' | 'any' | null;
    ageYears: number | null;
    source: 'explicit' | 'implied' | 'profile' | 'unknown';   // "kurti" ⇒ implied women
  };
  semanticQuery: string;        // clean, descriptive ENGLISH for the embedding (+ keyword side)
  mustKeywords: string[];       // literal tokens that must appear, rarely used ("chikankari", "kolhapuri")
  categories: Constraint;
  colors: Constraint;           // color families
  fabrics: Constraint;
  patterns: Constraint;
  fits: Constraint;
  useCases: Constraint;
  brands: Constraint;
  price: { min: number | null; max: number | null; strength: Strength } | null;  // INR
  sizes: { values: string[]; strength: Strength } | null;  // only when user states size / "my size" toggle
  textExclusions: string[];     // non-facet negatives: "cutouts", "slit", "sleeveless", "sheer", "heavy embroidery"
  softPreferences: string[];    // non-facet positives for rerank: "midi", "flowy", "not too heavy", "squat-proof"
  occasion: { name: string; location: string | null; timeOfYear: string | null; role: string | null } | null;
  bodyType: string | null;
  sort: 'relevance' | 'price_asc' | 'price_desc';
  needsClarification: { question: string; options: string[] } | null;
};
```

**Intent extractor rules** (put these in the system prompt, with ~12 few-shot examples covering Hinglish, kids, gifts and exclusions):
- Output only canonical ids from the taxonomy list provided in the prompt. If nothing fits, leave the field empty and move the concept into `softPreferences` or `semanticQuery`.
- **Hard (`must`)**: explicit product type, explicit audience, budget ("under 2k", "₹1500 ke andar", "2-3 hazaar" = 2000–3000), explicit exclusions, explicit material ("100% cotton").
- **Soft (`prefer`)**: stylistic words ("elegant", "breezy"), inferred occasion categories, profile defaults.
- Every negative the user states goes into a `Constraint.exclude` (if it maps to a facet) or into `textExclusions`.
- **Price parsing:** "k" = ×1000; "around 2000" → 1600–2400 prefer; "cheap" → prefer max ≈ that category's p25 (pass per-gender price stats in the prompt); "premium" → prefer min ≈ p75.
- **Indian context:** decode festivals/events (sangeet, mehendi, haldi, Navratri/garba, Diwali, Eid, Karva Chauth, Pongal/Onam, farewell, college fest), places and seasons (Manali in December = cold, Goa = beach/humid, monsoon June–Sept). Today's date is injected into every prompt.
- **Audience:**
  - If unknown and the item isn't gender-implicit, use `profile.audiences` when there's exactly one.
  - Otherwise set `needsClarification` with options like "Women / Men / Kids", and still pick a best guess.
- **Clarify at most once**, only when a wrong guess would make most results useless. Never ask about budget or color. Those become smart filters.

**Chips are derived deterministically from the Intent in code, not by the LLM.** That keeps them always consistent with the filters that actually ran. Chip types:
- include: `Kurta set`, `Black`
- exclude: `✕ Polyester`
- price: `Under ₹2,000`
- audience: `Women`
- soft: `~ elegant`

Chips can be clicked to edit or remove, and there's a `+ Add` chip.

### 6.2 Taxonomy (`scripts/build-taxonomy.ts` → `data/taxonomy.json`, committed)
The script turns raw facet values into canonical concepts:
- **categories:** `{ id, label, department (e.g. women-ethnic, men-footwear, kids-girls-western), rawValues[], genders[], count }`
- **colorFamilies:** black, white, off-white/ivory/cream, beige/nude, brown, grey, navy, blue, sky/light-blue, green, olive, teal, red, maroon/wine, pink, pastel-pink, orange/rust, yellow/mustard, purple/lavender, gold, silver, multicolor, and so on. Each maps to raw values.
- **fabricFamilies, patternFamilies, fitFamilies:** same idea.
- **useCases:** a cleaned list (e.g. casual, office, party, wedding, festive, sports, lounge, travel…).
- **genderMap:** raw gender value → women | men | girls | boys | unisex | kids.

How to build it:
- Cluster values with `OPENAI_MODEL_OFFLINE` in batches.
- Drop values with a count below 5.
- Write `data/taxonomy.review.md`, listing the mappings with low confidence, for a human to skim.

`taxonomy.ts` loads the JSON once and exposes:
- `expand(field, canonicalIds) → rawValues[]`
- `promptVocabulary()`, which is compact (ids plus short labels, no raw values) to keep prompt tokens low.

### 6.3 Query builder (pure function, unit-tested)
```
q               = intent.semanticQuery
query_by        = "title,embedding"           (verify in M0; optionally "title,brand,embedding")
vector_query    = "embedding:([], k: 250, alpha: <ALPHA>)"   start ALPHA=0.5, tune with eval; confirm
                  alpha semantics for the server version in the Typesense docs
rerank_hybrid_matches = true
exclude_fields  = "embedding"
per_page        = 80 (main) / 40 (each plan rail)
filter_by       = AND of:
   base filter from M0 (e.g. in_stock:true && is_active:!=false — decide from data)
   gender:=[…expanded audience…]         women ⇒ [women, unisex]; kids+girl ⇒ [girls, kids, unisex-kids]
   for each Constraint with strength=must:
       include → field:=[raw…]         exclude → field:!=[raw…]
   exclude lists are ALWAYS applied as filters, even when the constraint is 'prefer'
   price:[min..max] when must (use price:<=max / price:>=min for open ranges)
   sizes:=[…] only when sizes.strength=must
facet_by        = "color,fabric,pattern,fit,brand,use_case" (for smart filters) on the main rail only
sort_by         = price asc/desc when intent.sort ≠ relevance, else default relevance (_text_match / fusion)
```
- **Escape filter values:** wrap every value in backticks, e.g. ``color:=[`Navy Blue`,`Off White`]``, and handle backticks inside values.
- `prefer` constraints don't filter. They're appended to `semanticQuery` as words and passed to the reranker.
- Tests should cover: exclusions, escaping, open price ranges, kids gender expansion, empty constraints, sort.

### 6.4 Relaxation ladder (when a rail has < 8 usable hits)
Relax one step at a time. Re-query after each step, and stop as soon as there are enough hits:
1. Drop `must` → `prefer` for pattern, then fit.
2. Widen colors to neighbouring families (navy → blue), and fabrics to siblings (silk → satin, crepe).
3. Price: widen max by +20%, then +40%.
4. Drop the fabric `must`.
5. Broaden the category to its department.

**Never relax:** audience, exclusions, `textExclusions`.

Emit a human note, e.g. *"No silk options under ₹3,000. Showing satin and crepe, and a few up to ₹3,600."* Show it above the results.

### 6.5 Post-retrieval curation
- **Text post-filter:** drop hits whose `title`/`description` match any `textExclusion`. Use word-boundary regex plus simple synonyms, e.g. cutout = cut-out, cut out.
- Drop hits with no `image_url`.
- **Dedupe:** by normalised `brand + title`.
- **Diversity:** at most 3 items per brand in the top 24. Keep the rest for "Show more".

### 6.6 Rerank + reasons (`rerank.ts`)
- **Input:** the user's original query, the Intent summary, a taste summary (§8), and up to 60 candidates in compact form: `{i, id, title, brand, category, color, fabric, fit, pattern, use_case, price, desc: first 220 chars}`.
- **Output (strict schema):** `{ items: [{ id, score: 0..1, reason, matched: string[], violates: string[] }] }`, sorted by the model.
- **Rules for the model:**
  - Judge fit against what the user asked for. `softPreferences` and body type matter.
  - Use taste only to break ties.
  - Any `violates` entry → drop the item. Also drop anything with score < 0.35.
  - `reason`: ≤ 16 words, specific and factual, using only product data plus the user's own words.
    - No hype, and never invent attributes the data doesn't show.
    - Good: *"Pure cotton, straight fit, black — office-ready at ₹1,799, under your ₹2k."*
    - Bad: *"Perfect stylish choice you'll love!"*
  - `matched`: short tags shown as ✓ badges ("cotton", "under ₹2k", "no slit").
- Rails rerank **in parallel**. Main rail pool is 60; plan rails are 30 each and keep the top 12.
- **Timeout 5s.** On timeout, fall back to hybrid order with **deterministic reasons** built from the attributes that matched the intent, e.g. "Black · Cotton · ₹1,799". If the LLM finishes later, send a `reasons` event that updates the text without reordering.

### 6.7 Planner (`plan.ts`), for occasion / vibe / gift / browse
- **Output:**
  - `stylistNote`: 2–3 sentences in Indian context, e.g. what the mehendi colour palette usually is, or how to dress for Jaipur in November evenings.
  - `rails`: 3–5 items of `{ id, title, why (≤ 12 words), intentPatch }`.
- **Rails are the category suggestions.** For "sangeet in Udaipur in December (women)":
  - Lehenga / Anarkali
  - Shawl or stole ("evenings drop to ~10°C")
  - Juttis / block heels
  - Potli bag
  - Jhumkas
- **Gift:** rails across price-appropriate categories for the recipient.
- **Vibe** ("old money look men"): rails such as polos, chinos, loafers, knitwear.
- Each rail inherits the base intent (audience, budget, exclusions) and merges in its patch.
- **Budget:** a total budget ("Goa trip outfits under ₹6,000 total") is split across rails by typical category share, stated in the note.

### 6.8 SSE event contract (typed union shared by server and client)
```
step       { id, label, status: 'running'|'done'|'skipped', ms? }
           labels: "Understanding your request", "Planning what you'll need", "Searching 5.5L products",
                   "Relaxing a few filters", "Hand-picking the best matches"
intent     { intent, chips }
clarify    { question, options }
plan       { stylistNote, rails: [{ id, title, why }] }
results    { railId: 'main'|string, products: ProductCard[], relaxedNote?, smartFilters?, total }
reasons    { railId, items: [{ id, reason, matched }] }
done       { timings: Record<step, ms>, tokens: { in, out }, costUsd, cacheHit }
error      { message, retryable }
```
`ProductCard = { id, title, brand, category, color, fabric, fit, pattern, price, sizes, image, url, domain, reason, matched[], score }`

### 6.9 Caching
Use an in-memory LRU (≈500 entries, 30-minute TTL) keyed by `hash(normalisedQuery + audience + tasteBucket)` for Intent and plan, and by `hash(params)` for Typesense responses. The home example edits should be served from cache after the first hit.

---

## 7. Refinement chat drawer (`/api/refine`)

The drawer slides in from the right on desktop and is a bottom sheet on mobile. It's opened by a floating "Refine with Drape" button on results pages. **The chat drives the main results.** It is not a separate product list.

**Context sent each turn:**
- current Intent (+ chips)
- the top 12 visible products as `{ n: 1..12, id, title, brand, color, price }`, so the user can say "#3"
- taste summary
- the last 10 messages.

**Tools** (OpenAI tool calling, at most 3 tool calls per turn):
| Tool | Effect |
|---|---|
| `update_search(intentPatch, note)` | Merge the patch into the current Intent and re-run the pipeline. Main results update, chips update. Handles "cheaper", "more colourful", "no polyester", "only cotton", "show men's instead", "longer ones". |
| `find_similar(ref, changes?)` | "Like #3 but in blue": vector search from that product's embedding (§9.4) plus filters from `changes`. The result replaces the main grid with the title "Like <product> · in blue". |
| `compare(refs[], criterion?)` | Opens the compare view (§9.6) with an LLM verdict. |
| `ask_user(question, options[])` | Renders option chips in the chat. Use sparingly. |

**Reply style:** ≤ 2 sentences, then 3 suggested follow-up chips relevant to the current results (e.g. "Under ₹1,500", "Show block prints", "Add a dupatta"). Style questions ("will this suit a pear body type?") are answered in text using product data. The agent never invents stock, sizes or delivery info.

Stream assistant text tokens, and emit the same `step` / `results` events as `/api/search`, so the main grid animates in sync.

---

## 8. Session-level personalization (anonymous)

### 8.1 Store (`src/store/session.ts`, Zustand persist, key `drape.session.v1`, versioned + migration)
```ts
profile: {
  audiences: ('women'|'men'|'girls'|'boys')[];      // who I shop for
  sizes: { top?: string; bottom?: string; footwear?: string };
  budget: { min?: number; max?: number } | null;
  styles: string[];                                 // from onboarding tiles
  avoidColors: string[]; avoidFabrics: string[];
  onlyMySize: boolean;
  onboarded: boolean;
}
signals: {
  liked:    ProductLite[];                          // ♥
  disliked: { p: ProductLite; reason: 'price'|'style'|'color'|'fabric'|'other' }[];  // "Not for me"
  clicked:  ProductLite[];                          // outbound "Shop" clicks
  searches: string[];                               // last 20
}
saved: string[]  // = liked ids
compare: string[] // max 3
```
`ProductLite` holds id, brand, category, color, fabric, pattern, fit and price. No embeddings are stored client-side.

### 8.2 Derived taste (`lib/taste.ts`, pure, runs client-side, sent with every request as `tasteSummary`)
Signal weights: like +3, click +2, dislike −3.
- **Affinities** for brand, color family, category, fabric and pattern. Send the top 5 of each.
- **Price band:** p25–p75 of liked and clicked prices.
- **Avoids:**
  - profile avoid lists
  - attributes of dislikes whose reason is `color` or `fabric`
  - brands disliked twice.
- **Serialisation:** compact and < 400 tokens, e.g. `likes: brands[Fabindia, W], colors[pastel-pink, ivory], fabrics[cotton], band ₹1.2k–2.8k; avoids: colors[neon], fabrics[polyester]`.

### 8.3 How taste is used (and only these ways)
1. **Intent:**
   - fill a missing audience (source = profile)
   - add the budget as `prefer`
   - add `sizes` as `must` only when `onlyMySize`
   - add avoids as `prefer`-excludes, **not** hard filters. Hard filters are only for the user's current words.
2. **Rerank:** tie-breaker context.
3. **"For you" rail:**
   - Take the mean of the embeddings of the last ≤ 10 liked items, fetched server-side with `include_fields: embedding`.
   - Run a vector search with it, excluding liked/disliked ids, and apply diversity.
   - Show it on the home page once there are ≥ 2 likes. Show it on results pages as "Because you liked <item>" when the liked item matches the rail's category.
4. **Surprise me** (§9.7).

### 8.4 Transparency
- A small "Personalized" pill appears on results when taste changed anything. Hovering it lists what changed ("Assumed Women from your profile · Preferring ₹1k–3k").
- The **Your taste** panel (header avatar menu) shows the learned preferences as removable chips, the profile fields as editable, and a "Reset session" button.

### 8.5 Onboarding (optional, skippable, first visit, ≤ 30 seconds)
It's a 4-step modal that can be reopened from the taste panel:
1. **Who are you shopping for?** Multi-select: Women, Men, Girls, Boys.
2. **Style tiles:** pick 3+ from about 12 image tiles. Tiles are real product images fetched per style query at build time, e.g. minimal, ethnic-classic, boho, streetwear, old-money, athleisure, festive-glam, indo-western, workwear, party, comfy-basics, bold-colour.
3. **Sizes:** optional, per audience.
4. **Usual budget per item:** slider plus presets.

Skipping is fine, since signals will still learn.

---

## 9. Feature specs

### 9.1 Home `/`
- A big multi-line search box. The placeholder rotates Indian examples every 3s. It has a camera button (image search) and a submit button.
- Audience quick-chips (All · Women · Men · Kids). The selection sets a session default.
- **Try asking:** 8 editorial cards from `data/examples.json`. Each has a cover image taken from the first product of that edit, cached. Examples:
  - "What do I wear to a mehendi in Jaipur in November?"
  - "Office kurta sets in cotton under ₹2,000"
  - "Old-money look for men"
  - "Birthday party dress for my 6-year-old"
  - "Manali trip in December — warm but not bulky"
  - "Navratri garba outfits for a couple"
  - "Gift for dad's 60th under ₹3,000"
  - "Monsoon-proof everyday footwear"
- **Surprise me** button.
- **For you** rail (when ≥ 2 likes) and **Recent searches** chips.

### 9.2 Results `/edits/[slug]`
- The slug is the URL-encoded, lower-cased query (like plush `/edits/...`). Optional `?s=<base64url intent overrides>` makes a refined state shareable, and `?debug=1` opens the debug panel.
- **Top:** the editable query bar, then an "I understood" row of chips (§6.1) with the Personalized pill.
- **Agent steps:** a compact animated timeline while running, which collapses to "4 steps · 3.1s" once done.
- **Clarify card** (if any): the question with option chips, sitting *above* the best-guess results.
- **Occasion/vibe/gift:** the stylist note, then horizontal rails, each with title + "why" + "See all" (which opens that rail as its own edit).
- **Product intent:** a grid (2 columns mobile, 4–5 desktop), sort (Best match / Price ↑ / Price ↓), and "Show more" (next 24 from the pool, then page 2).
- **Smart filters:** a bar built from the result-set facets, showing only the dimensions that vary. Top ~6 values each, mapped to canonical labels, plus price buckets from the result distribution. Clicking one updates the Intent. It's the same state as the chips, never a separate filter system.
- **Relaxation note** when applicable, plus a "Strict mode" toggle to show exact matches only.
- **Empty state:** never a bare "no results". Show what was relaxed and 3 suggested alternative queries.
- The floating **Refine** button opens the chat drawer.

### 9.3 Product card
- Image with lazy load, `referrerPolicy="no-referrer"` and a graceful placeholder on error. Use plain `<img>` rather than `next/image`, because image domains are many and unknown. Consider a `/api/img` proxy only if hotlinking fails in M0.
- Brand, title (2 lines), ₹ price.
- **Why-this line** (from rerank) plus up to 3 ✓ matched badges.
- **Actions:**
  - ♥ save
  - 👎 "Not for me", which opens a popover with reasons (Too pricey / Not my style / Colour / Fabric / Other). The card fades out, and future results learn from it.
  - "More like this"
  - compare checkbox.
- Clicking the card opens a quick view (a drawer that reuses `/p/[id]`):
  - larger image and details (fabric, fit, pattern, sizes as chips, use_case)
  - the reason
  - a **"Shop on {domain}"** primary CTA, which opens `product_url?utm_source=drape&utm_medium=poc`, logs a click signal and uses `rel="noopener noreferrer"`
  - a "More like this" rail.

### 9.4 More like this `/api/similar?id=&k=24`
- Fetch the product's embedding with `filter_by id:=`, `include_fields=embedding`.
- Run `vector_query: embedding:([...vector], k: 100)` via **multi_search POST**, since the vector is too long for a URL.
- Keep the same audience, exclude the item itself, and apply diversity.
- Optional `changes` (from refine or a UI chip like "in blue") merge into the filters.

### 9.5 Image search
- **Entry points:** the camera button on the search bar, and drag-drop onto the page.
- **Client:** resize to ≤ 768px JPEG and send base64 plus optional text ("like this but in blue").
- **`/api/image-search`:** the vision model returns the same Intent schema (`kind: 'similar'`) with a rich `semanticQuery` (garment type, silhouette, colours, pattern, fabric look, details, audience). The combined text modifies it. Then run the standard pipeline.
- The uploaded thumbnail shows as the first chip.
- Say honestly in the UI: *"Matched by description, not pixels."* We don't have image vectors.

### 9.6 Compare (≤ 3 items)
- A sticky compare tray appears when items are selected, with a Compare button that goes to `/compare?ids=`.
- The table rows are image, price, brand, fabric, fit, pattern, colour, sizes, use_case and link.
- **LLM verdict** (via `/api/compare`, using the originating query as context): *"Pick A if …, B if …"* in 2–3 bullets, grounded only in product data.

### 9.7 Surprise me `/api/surprise`
- **Input:** taste summary + today's date. The model should know the Indian season and upcoming festivals itself; don't hard-code dates.
- The LLM proposes 3 fresh edits `{ title, query }` the user hasn't searched. Pick one at random and navigate to its edit, with a banner showing the edit title ("Surprise: monsoon-ready kolhapuris").
- Without taste, use a random seasonal/festival edit for a random selected audience.

### 9.8 Saved `/saved`
A grid of liked items (stored as ProductLite, refreshed via `/api/products?ids=`). Actions: remove, compare, "More like my saves" (the For you rail).

### 9.9 Debug panel (`?debug=1`, internal-proof essential)
A collapsible side panel showing:
- the raw query and the Intent JSON
- per rail: `filter_by`, `q`, hit count and relaxation steps
- rerank kept/dropped counts with the `violates` reasons
- step timings
- tokens and estimated cost
- cache hits.

Add a "Copy as JSON" button.

---

## 10. Design direction
- Editorial and calm: warm neutral background (#FAF8F5-ish), near-black text, one accent colour (deep terracotta or aubergine). Images carry the colour.
- **Type:** a display serif for headings (e.g. Fraunces or Cormorant via `next/font`) and Inter for UI.
- Product imagery first: 3:4 aspect cards, subtle hover lift, no heavy borders.
- Mobile-first. The chat drawer becomes a bottom sheet under `md`, and the rails scroll horizontally with snap.
- **Motion:** step timeline ticks, results fade/stagger in, rail cards slide. Respect `prefers-reduced-motion`.
- Loading = skeleton cards in the final layout (no spinners on the grid).
- Accessibility: keyboard-navigable chips and cards, visible focus, alt text from the title, contrast AA.
- Build the brand and assets fresh. Don't reuse Plush's name, copy, imagery or logos.

---

## 11. API contracts (all zod-validated)
| Route | Method | Body / Query | Returns |
|---|---|---|---|
| `/api/search` | POST | `{ query, overrides?: Partial<Intent>, taste, debug? }` | SSE (§6.8) |
| `/api/refine` | POST | `{ messages, intent, visible, taste }` | SSE (text deltas + §6.8 events) |
| `/api/image-search` | POST | `{ imageBase64, text?, taste }` | SSE |
| `/api/similar` | POST | `{ id, changes?, audience?, excludeIds?, k? }` | `{ products }` |
| `/api/for-you` | POST | `{ likedIds, excludeIds, audience? }` | `{ products }` |
| `/api/compare` | POST | `{ ids, query? }` | `{ products, verdict }` |
| `/api/surprise` | POST | `{ taste }` | `{ title, query, slug }` |
| `/api/products` | GET | `?ids=a,b,c` | `{ products }` |

Other requirements:
- Basic per-IP rate limit (in-memory, e.g. 30 req/min) on LLM routes.
- Errors return `{ message, retryable }`, and the UI shows a retry button.
- Log every pipeline run as JSON in the dev console.

---

## 12. Budgets
| Metric | Target |
|---|---|
| Intent extraction | ≤ 1.2s p50 |
| Typesense multi_search (all rails) | ≤ 400ms |
| Rerank (parallel rails) | ≤ 2.5s p50, hard timeout 5s → fallback |
| First results visible (product query) | ≤ 4s p50 |
| First rail visible (occasion query) | ≤ 5s p50 |
| LLM tokens per search | ≤ ~8k in / 1.5k out. Log them and show them in the debug panel |

Keep prompts lean: compact candidates, truncated descriptions and the vocabulary without raw values. Reuse the static system prompt prefix so OpenAI prompt caching applies.

---

## 13. Quality & evaluation

### 13.1 Unit tests (Vitest)
- `queryBuilder` (escaping, excludes, price, gender expansion)
- the relaxation ladder order
- the text post-filter
- the taste derivation
- chip derivation.

### 13.2 Eval script `scripts/eval.ts` → `docs/eval-report.md`
Run the pipeline headless on the queries below. For each, record:
- Intent JSON
- filters
- relaxation
- the top 10 as `title | brand | ₹price | reason`
- latency and tokens.

Then add automatic checks:
- Any result violating an exclusion → **FAIL**.
- Audience mismatch → **FAIL**.
- Price outside a `must` range after no relaxation → **FAIL**.

```
1  black cotton kurta set for office under 2000
2  shaadi mein pehenne ke liye sherwani, ivory ya beige
3  what should I wear to a mehendi in Jaipur in November
4  floral maxi dress, no polyester
5  everyday college sneakers for men under 3000
6  birthday party dress for my 6 year old daughter
7  old money look for men
8  linen shirt that doesn't need much ironing
9  saree for farewell — elegant, not too heavy
10 high waist squat-proof gym leggings
11 winter jacket for Manali in December, warm but not bulky, women
12 gift for my dad's 60th birthday under 3000
13 office wear for a pear body type
14 navratri garba outfits for a couple
15 white shirt
16 kurti
17 kuch accha sa dikhao party ke liye
18 denim jacket like levis but cheaper
19 school shoes for boys
20 bodycon dress, no cutouts, not red
21 diwali ethnic wear for a 2 year old boy
22 monsoon footwear that won't get ruined
23 interview outfit for a male fresher under 4000
24 pastel co-ord set for brunch
25 Goa trip outfits for a guy, 6000 total
```
Use the report to tune `ALPHA`, the pool sizes and the prompts. Include a before/after table in `docs/DECISIONS.md` for any tuning.

---

## 14. Milestones (each ends with a runnable app/script + commit)

| # | Milestone | Done when |
|---|---|---|
| 0 | Scaffold + catalog discovery (§4) | `docs/catalog-notes.md` written; env validated; Typesense + OpenAI reachable |
| 1 | Taxonomy build (§6.2) | `data/taxonomy.json` + review file; `taxonomy.ts` with tests |
| 2 | Core pipeline: intent → query builder → retrieve → relax → curate (no rerank yet) + eval script | Eval runs end-to-end on all 25 queries; zero exclusion/audience FAILs |
| 3 | Rerank + reasons + fallback; planner + rails; clarify | Eval report shows reasons; occasion queries return 3–5 sensible rails |
| 4 | UI: home, results page, SSE hook, steps timeline, chips (editable), smart filters, product card, quick view, outbound links, debug panel | Full search flow works in the browser on mobile + desktop widths |
| 5 | Refine chat drawer with tools (§7) | "cheaper", "like #3 but blue", "no polyester", "show men's instead" all update the grid correctly |
| 6 | Personalization: store, likes/dislikes, taste derivation, onboarding, taste panel, Personalized pill, For you rail | Liking 3 pastel cotton items visibly shifts tie-breaks and fills For you; reset clears it |
| 7 | More like this, image search, surprise me, compare, saved | Each works from both the UI and (where relevant) the chat |
| 8 | Polish + budgets + README | p50 targets met or gaps documented; README covers setup, env, scripts, architecture, known limits |

---

## 15. Out of scope (don't build)
Auth, a database, cart/checkout, price alerts, virtual try-on, full outfit builder, blog/SEO pages, admin, analytics backends, and writing to Typesense (the key is read-only).

## 16. Final acceptance checklist
- [ ] Every stated exclusion is respected in all results (eval has zero FAILs).
- [ ] Chips always reflect the filters that actually ran; editing a chip re-runs the search.
- [ ] Occasion/vibe/gift queries show a stylist note plus 3–5 category rails, in Indian context.
- [ ] Every product card has a specific, truthful reason.
- [ ] Zero-result situations relax gracefully and explain what changed.
- [ ] The chat drawer changes the main results; "#n" references work.
- [ ] Session taste is visible, editable and resettable, and never overrides explicit words.
- [ ] Image search, More like this, Surprise me and Compare all work.
- [ ] `?debug=1` shows intent, filters, timings and cost.
- [ ] No secrets in the client bundle or git history (`grep` the build output for the key prefixes).
