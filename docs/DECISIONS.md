# Decisions & deviations from the brief

Newest last. Each entry: what, why, and where it applies.

## M0 — Scaffold

- **Next.js 16.3 (App Router), React 19.2, Tailwind v4, ESLint 9 flat config.** Latest stable at scaffold time, from `create-next-app`. Tailwind v4 has no `tailwind.config.js`; theme tokens go in CSS (`@theme`) when the UI is built in M4.
- **UI dependencies deferred.** shadcn/ui, lucide-react, framer-motion and zustand get added in M4/M6, when the first component that needs them is written. M0 ships only what discovery and env validation need: `typesense`, `openai`, `zod` (+ `tsx`, `vitest`).
- **Scripts run with `node --env-file-if-exists=.env.local --import tsx`.** This uses Node 24's built-in env loading, so no `dotenv` dependency is needed.
- **`npm run typecheck` = `next typegen && tsc --noEmit`.** Next 16 generates global route types (`LayoutProps`, etc.), and plain `tsc` fails without them.
- **Boot-time model check lives in `src/instrumentation.ts`** (dev only, non-blocking). It warns when a configured model is missing and names the closest available model. `npm run check` runs the same check plus a Typesense ping, and exits non-zero on failure.
- **Env access is centralised** in `src/lib/env.ts` (zod-validated, blank values treated as unset). The Typesense and OpenAI clients are lazily created singletons in `src/lib/typesense.ts` and `src/lib/openai.ts`.

## M0 — Catalog discovery (details in `docs/catalog-notes.md`)

- **Base filter** is `in_stock:true && is_active:!=false && gender:!=[other,unidentified] && price:>=50`, plus a non-fashion category deny-list that M1 generates. The brief's example only had the first two clauses. Gender `other`/`unidentified` is furniture and tableware, and items under ₹50 are beauty products.
- **Gender values differ from the brief's examples.** Raw values are `female, male, unisex, boy, girl, infant, other, unidentified`. There is no `women`/`kids`/`unisex-kids`. Kids expansion uses `girl`/`boy`, plus `infant` for ages ≤ 2.
- **Dedupe key is `brand + normalised title + color`** (the brief's §6.5 says `brand + title`). Colour variants share identical titles, so `brand + title` would merge different colours.
- **Text post-filter targets `title` first.** Descriptions are templated from facets, so they never mention details like cutouts, slits, sleeves or neckline.
- **No `/api/img` proxy.** Every image host tested allows hotlinking.
- **`query_by` stays `title,embedding`.** Adding `brand` didn't help, and brands go through the facet.
- **Titles need cleanup** (mojibake + SEO boilerplate) before display and before going into LLM prompts. Prices written in titles are never shown.

## M1 — Taxonomy

- **Families are a committed file.** `data/taxonomy.families.json` holds canonical ids, labels, departments and parents. The LLM proposes it on the first run, and later runs reuse it (`--repropose` regenerates it). Why: the category prompt includes live per-gender counts, and even at temperature 0 two proposals differed (176 vs 172 categories; one used plural ids and returned only 8 of 161 parent links). Reusing the file makes builds reproducible and gives reviewers one place to edit.
- **Categories have `parent` links (multi-level, same department, no cycles)**, and `expand()` includes all descendants. The raw data is granular: `kurta-set` alone is 2.4k items, but with `kurta-palazzo-set` and its siblings it's 16.6k for women. `dress` covers `maxi-dress`, `midi-dress` and others; `jewellery` → `earring` → `jhumka`. `PARENT_OVERRIDES` fixes links that were too broad (jeans, shorts and leggings aren't "trousers"; wallets aren't "bags").
- **Departments are gender-neutral** (`ethnic-wear`, `footwear`, …, `non-fashion`). The brief's examples were gender-specific (`women-ethnic`); here, department + audience filter gives the same result without duplicating categories per gender.
- **Include vs exclude expansion.** Each raw value has a *primary* family and *also* families ("red and white" → red, also white; "poly cotton" → cotton-blend, also polyester). Includes use primary values only, which keeps them precise. Excludes add the also-values, which keeps them safe. `classify()` falls back to keywords for raw values the taxonomy never saw (count < 5).
- **All 441 category values are mapped**, not just those with count ≥ 5, so the non-fashion deny-list (26 values) has no gaps. Other fields drop values with count < 5 (brief §6.2).
- **Human corrections live in code:** `FABRIC_MERGES` (spandex/lycra/elastane are one fibre; rayon = viscose), `OVERRIDES` (fleece → polyester) and `PARENT_OVERRIDES`.
- **Brands are in the taxonomy** (301 brands, display names cleaned, e.g. Jackjones → Jack & Jones). They're included in `promptVocabulary()` by default. The vocabulary is ≈1.8k tokens with brands and ≈0.9k without.
- **Price bands per audience × department** (p25/median/p75, in stock, base filter) are stored in `taxonomy.json` for "cheap"/"premium" parsing. They're computed exactly from price facet counts: one request per group. An earlier bisection approach took 10+ minutes.
- **Filter escaping:** backslashes and backticks inside values are escaped. Both were verified on the live server against real values.
- **For M2: long expanded filters are slow.** Measured on the live server: "no polyester" expands to 868 raw values (31k-char filter, ~1.2s), and black + cotton + kurta set is a 16k-char filter (~0.8s). Both break the 400 ms budget. Raw values are stored count-descending, so the query builder should filter on the top values covering ~99% of docs and let a code post-filter (`classify()` on each hit) catch the tail. Exclusions stay 100% safe.

## M2 + M3 — Pipeline, rerank, planner (one commit)

M2 and M3 were built together because the pipeline orchestrator needed both. Eval: **25/25 pass** the automatic checks (docs/eval-report.md).

- **Two-leg retrieval instead of one filtered hybrid search.** On this Typesense server, vector search under a restrictive filter is pathologically slow. Measured: black + cotton + kurta set for women under ₹2k took 8.4s vector-only and >60s hybrid, against ~0.3s hybrid with a light filter. `flat_search_cutoff` didn't help. Each rail therefore runs, in one `multi_search`:
  - an **exact** leg: keyword on title with every filter, `drop_tokens_threshold = perPage` so it doesn't return 1 hit;
  - a **semantic** leg: title+embedding hybrid with only base + audience filters.

  Must-requirements and exclusions for semantic hits are checked in code (`Checker.unmet()` / `violations()` over the full taxonomy), and the legs are merged with reciprocal-rank fusion. Search went from 4–10s+ (with timeouts) to ~1s.
- **Filter lists are capped** (60 include / 120 exclude values, most common first). The post-filter catches the tail, so exclusions stay 100% enforced.
- **Smart filters come from the curated pool**, not Typesense facets. It's cheaper, and it reflects what's shown.
- **Dedupe key includes colour** (M0); **brand display names come from the taxonomy** ("Jackjones" → "Jack & Jones"). Mojibake with a lost byte (`KAPRAÃHA`) can't be decoded, so the taxonomy label is used instead.
- **Rerank:** chunks of 4 candidates scored in parallel (output tokens dominate latency). Main pool is 36, not the brief's 60; rails score 18 and keep 12. The hard 5s timeout falls back to deterministic reasons, and late LLM reasons arrive as a `reasons` event.
- **LLM "violates" is advisory.** The model kept flagging missed *preferences* ("over budget" on a prefer price, "not office") as violations, which emptied results: "Levi's-like denim jacket, cheaper" kept 8 of 36. Exclusions and musts are already enforced in code, so an LLM violation only drops an item when it names a user text exclusion; otherwise the score is halved.
- **Reasons never invent budgets:** the prompt states "Budget: none stated" explicitly.
- **Category deny-list fixes:** the seeded families file had a single non-fashion bucket, so a few fashion raw categories landed in it (`footwear`, `hair accessories`, `brooches & pins`, `briefcases`, ~170 docs). `CATEGORY_OVERRIDES` in build-taxonomy maps them back.
- **Latency gap (documented, not hidden).** From this dev machine, a trivial gpt-4.1-mini call takes ~1.3s (network) and generation runs ~100 tok/s. Intent (≈200 output tokens, cached 5k prompt) therefore takes 2.5–4s, against the brief's 1.2s target. Eval p50 is ~8.7s end to end (product queries ~7–9s, occasion queries ~15–19s with planner + 4–5 rails). Options if this matters: deploy close to OpenAI's region, use gpt-4.1-nano for rerank, or merge the intent and plan calls.
- **Alpha:** kept at 0.5. With the two-leg design, alpha only affects the semantic leg; tuning is left for M8.

## M4–M7 — UI, refine chat, personalization, similar/image/surprise/compare/saved (one commit)

These were built together because the results page references all of them (refine drawer, compare tray, taste panel). Verified with a 22-check end-to-end smoke test against `next start` (every API route, and every M5 done-criterion: "cheaper", "like #3 but in blue", "no polyester", "show men's instead"). Also checked: a production build, and a grep of `.next/static` for key prefixes, the Typesense key and the host (0 hits).

- **UI primitives are hand-written** (drawer/bottom sheet, popovers) with framer-motion and lucide, in shadcn's style, instead of running the shadcn CLI. The CLI is interactive, and radix wasn't needed for these few components.
- **Plain `<img>`** with `referrerPolicy="no-referrer"`, lazy loading and a placeholder on error (M0: hotlinking works everywhere).
- **Hydration:** persisted zustand state is read behind `useHydrated()` (`useSyncExternalStore`). Loaders derive from keyed results rather than resetting state in effects (React-compiler lint rules).
- **Shareable refined state:** chip edits, smart filters, sort and clarify answers re-run `/api/search` with the full edited Intent (understanding is skipped). The URL carries `?s=<base64url intent>`.
- **"+ Add" chip** appends the text to the query and re-understands it. It's simpler than a free-text intent patch, and it keeps chips consistent with what ran.
- **Refine chat reply "streaming":** tool calls run first (non-streamed), then a structured `{reply, suggestions}` call. The reply is emitted word by word as `text` events. True token streaming conflicts with the structured suggestions. Tool results reach the grid through the same `step`/`intent`/`results` events as `/api/search`.
- **Taste as a deterministic tie-break.** The first version only passed the taste summary to the LLM prompts, and a with/without-taste test reshuffled the whole top 12 (0/12 overlap) instead of nudging ties. Now the taste payload carries structured `likes`: +0.04 per liked colour family/fabric family/brand/category (cap +0.1) after rerank, −0.1 for avoided colours/fabrics. Avoids stay soft (never filters), per §8.3.
- **Similar / For you / Because you liked** use stored embeddings, fetched with a filtered search (`include_fields`), and a pure vector query with only base + audience filters; changes like "in blue" are checked in code. Filtered vector search is the slow path on this server (M2).
- **Image search:** the client resizes to ≤768px JPEG and keeps the photo in `sessionStorage` (not in the URL). The vision model returns the same Intent schema (`kind: "similar"`), then the standard pipeline runs. The UI says "Matched by description, not pixels."
- **Style tiles** for onboarding are fetched at runtime (cached 12h) rather than at build time. Build-time fetching would make `next build` depend on Typesense.
- **Not verified in a real browser.** The pages were checked via server rendering (200s, content present), the build, lint, and the API smoke test. Interactive behaviour (drawers, chips, mobile bottom sheet) hasn't been clicked through in a browser in this session.

## M8 — Polish + budgets

- **Budgets are documented as gaps, not met.** The measured table and the levers are in the README. From this dev network, LLM round trips (~1.3s each) and the Typesense server's elevated baseline dominate. Tokens per search are ~13.8k in / 2.5k out against the ~8k / 1.5k target. The biggest contributors are the rerank prompt repeated across parallel chunks and the 5k-token intent prompt (vocabulary + price bands + few-shots), mostly prompt-cached.
- **README** covers setup, env, scripts, architecture (including the two-leg retrieval), measured budgets and known limits.

## Conversational Drape (branch `feat/conversational`)

Leadership compared the POC with ChatGPT, Perplexity and Google AI Mode. They liked the recommendation quality, For you, More like this and Compare. They asked for a **conversational** experience with recommendations and personalization (including from clicks), new chat / chat history, no per-product reason lines, image search hidden, and compare as table + text by occasion. The approved plan is summarised below.

- **One streamed planner call per turn** replaces intent + planner. It returns turn type, intro, sections, the chat's running constraints ("base"), refs, compare criterion, clarify, follow-ups and memory. The intro streams as it's generated, through the SDK's partial-JSON `content.delta` events, so the first words appear in about **0.8s median**.
- **Slim "chat base" schema** instead of a full Intent (≈490 vs ≈630 output tokens; planning ~4s → faster). `toIntent()` converts it.
- **Retrieval reuses the classic pipeline** (`retrieveRails`, relaxation, post-filter, dedupe, diversity) through a shared `sectionIntent()` extracted from `plan.ts`. There's **no per-product LLM rerank** (it cost ~4s and per-product reasons were dropped by request). Ranking is fused order + taste tie-breaks. A short streamed write-up names 2–3 concrete picks after retrieval.
- **Guards added after testing:**
  - The planner put department ids in `categories`; `resolveCategories()` expands them.
  - It put "comfortable/office" in `mustKeywords`, emptying results; chat never uses mustKeywords.
  - It promoted its own fabric suggestions to must-filters; `keepUserStatedMusts()` keeps a must colour/fabric only if the user named it.
  - Typed `#n` refs are parsed deterministically.
  - Chat sections show 8 products with no hidden "more", so `#n` numbers stay small and meaningful.
- **Search legs run as parallel requests.** A single `multi_search` executes its searches sequentially on the server (~0.5s each), so 3 sections × 2 legs took ~4s; parallel requests take ~2s. This also sped up classic search (p50 8.7s → ~6s).
- **Answer style:** per stakeholder request, answers use general fashion knowledge and inference like ChatGPT (fabric behaviour, fit, occasion, weather, body shape). The hard line is listing facts: no invented stock, delivery, discounts, ratings or unlisted sizes.
- **Chats are stored in the browser** (`drape.chats.v1`, max 25 chats × 40 messages, slimmed cards, quota-safe writes that drop the oldest chats). Each chat's context (running constraints, shown products with refs, last sections) stays inside that chat.
- **Personalization v2:**
  - An interaction log with weights and a 14-day half-life: view +1, 5s read +1, outbound click +2, compare +1, more-like +2, plus saves +3 and dislikes −3.
  - For you is seeded by the strongest engagement (score ≥ 1.5, so a single glance doesn't count; decay makes view + read land just under 2).
  - "Drape remembers" holds durable facts from chat, global and deletable; one-off asks stay in their chat.
  - Personalized starter chips on the chat home.
- **Kids'-title guard:** some kids' products carry an adult gender in the catalog ("Striped Shirt (0-5 Yrs)"). For women/men audiences, titles with kids/baby/age ranges are dropped in the post-filter, on both search legs.
- **Compare v2:** `src/lib/compare.ts` returns table data + a 4–6 occasion matrix (Great/OK/Not ideal, best pick per occasion) + verdict. It's used inline in chat and on `/compare`, and it fails gracefully in chat.
- **Classic search kept** at `/search`; `main` is untouched.

## Guidance-first Drape (branch `feat/guidence`)

Management feedback on the conversational branch (2026-09-28):
- Hide "Ask Drape about this" and the `#n` product numbers.
- Answer like ChatGPT: guide first (what goes with this occasion or outfit, and why), then show products, then ask one relevant question.
- Context should connect within a chat, but personalization shouldn't take over. The trigger was a screenshot: "gift for papa" was ranked by the user's own taste (green, purple, cotton blend) and inherited `Under ₹2,100 · ✕ cutouts · ✕ sleeveless · ✕ heavy embroidery` from an earlier saree chat.
- "See all" should list products directly instead of jumping to classic search.

Decisions:
- **Refs stay, numbers go** (`FEATURES.refBadges = false`, `askDrape = false`). Chat products keep internal refs, so compare, "more like" and product questions still resolve. The model writes products as `[short name](#n)` links, which `RichText` renders as clickable names; a stray bare `#n` renders as the product's name. Card buttons send `refs` with the message instead of typed "#n".
- **Cross-chat memory is off** (`FEATURES.memory = false`, the user's choice): nothing is sent, stored or shown. This removed the leak above. It was reproduced by replaying "gift for papa" with the saree chat's saved facts.
- **Taste follows intent, not recipient** (product owner's framing). The planner outputs `tasteWhy` + `useTaste` first in the plan, deciding from the message alone. It **does not see the taste data**: when it did, it copied the learned budget into the plan even when it decided against taste. When `useTaste` is on, taste is applied deterministically (preferred budget, soft avoids, tie-breaks) and the badge says "Used your taste (…)". Two pure guards back the model: `forSomeoneElse` (gifts, "for my mom", "papa ke liye"; possessives like "my friend's wedding" don't count) and `wantsChange` ("bolder than usual", "new look", "kuch alag"). gpt-4.1-mini alone got "saree for my mom" and "bolder than usual" wrong.
- **The chat remembers only what the user said.** `chat_state.intent` and the "This chat remembers" chips are the pre-taste base; taste is layered on per turn. Otherwise a learned ₹1,500–2,100 became a strict budget on a later "cheaper" (caught by the eval).
- **Guidance-first answers.** The planner intro is now guidance: a direct answer plus 2–4 bold-point bullets on styles, colours that pair, fabric, embellishment and what to avoid, built on what the chat knows. Single-item asks split into 2–3 style-option sections, and each section's line is a tip for choosing. The picks write-up is ≤ 70 words with no question. `plan.ask` (replaces `clarify`) closes the turn: one question that unlocks new information or moves the look forward, with 2–4 tappable answers, rendered after the products. Follow-up chips show only when there's no question. It's still one planner call plus one write-up per turn, so latency is unchanged (median first text 1.3s, full turn ~9.7s).
- **No repeated questions.** The asked question is stored in the history text ("I asked: …", kept at the end and never truncated), so answers like "black" are understood. A question identical to the last one is dropped in code (`sameQuestion`), because the prompt rule alone didn't hold.
- **See all = same filters, no LLM.** Each chat section carries its final, post-relaxation intent. `POST /api/chat/section` re-runs only retrieval with it (strict, bigger page, ~1s, up to ~150 products, no taste). The panel (`SeeAllPanel`) opens over the chat, leads with the chat's picks in the same order, shows 24 per page with Load more, and opens product details inside the panel. Older chats without stored filters don't show See all.
- **Eval.** `eval:chat` now has 12 conversations, and every turn sends the same learned taste to catch leaks. New checks: guidance bullets, closing question, no repeated question, no unknown `#n` in visible text, no taste on gifts, learned budget never strict. Result: 34/34.
- **Known gaps.** The model still sometimes asks the user to pick between the sections it just showed. Retrieval can let an off-category item into a budget section (a gym bag among potlis), which is an existing semantic-leg issue.

### Round 2 feedback (2026-09-29): explain products, Style it, gender picker

- **Explained picks instead of a one-line write-up.** The picks call is structured and streamed (`chat-picks`): 3–4 favourites across the sections, each with a headline, 2–3 sentences on what the product is (fabric, work, cut, colour; the catalog description is fetched for the candidates) and why it suits this user, plus a style tip and a one-line wrap. Picks are emitted as each one completes and rendered as "My picks for you" with images. This isn't the per-card reason line management turned off: it's a few products explained in depth, like a stylist in a store. The guidance intro also gets 3–5 bullets. Cost: ~+0.7s per turn (median full turn 10.4s), ~750 output tokens.
- **Style it replaces "Ask Drape".** `lib/styleIt.ts` makes one cached LLM plan per product: 3 occasions × 3 complementary items with canonical categories, colours and a semantic query. The look for the selected occasion is retrieved on demand with the piece's audience, never its own category, and a hard price cap of ~1.5× the piece (relaxable). A ₹5k kurta was getting a ₹59k necklace with a "prefer" cap. Men's looks prefer watches, belts and stoles over necklaces. First load is ~6–7s; switching occasions is ~1s. It lives under the Shop button, so buying stays at the top.
- **"Shopping for" picker.** It's chosen on the new-chat screen, remembered for the next new chat, stored on the chat and sent every turn as the *default* audience. A recipient named in the message wins, via the prompt plus a `recipientAudience` guard. Without the guard, "saree as a gift for my mom" with Men picked searched men's sarees, relaxed repeatedly and timed out.
- **Eval:** 14 conversations, 2 of them with the picker set. New checks: at least 2 explained picks per turn with sections, picks must come from the shown products, and each explanation is 15+ words. Result: 38/38.

## Blend search: exact matches only (2026-10-06)

Problem: in `/blend`, "chaniya choli" showed Typesense lehenga cholis ahead of Shopify's real chaniya cholis. Typesense does have 3 in-stock chaniya cholis (plus 32 "navratri lehengas"), but the taxonomy maps the term to `lehenga` and the weak MiniLM semantic leg ranks generic lehenga cholis first. On top of that, the old `blend()` placed 2 catalog items then 1 Shopify item no matter what. The user decided: **exact matches only** ("no products found" otherwise), **term tiers + embeddings** as one yardstick, **pure relevance with catalog winning ties**.

- **Anchor per section** (planner output, no extra call): `terms` = the item's name plus spellings of the same item; `categoryLevel` = the name is a whole canonical category. Named types stay in (bandhani saree, kolhapuri chappal, potli bag); plain attributes stay out (fabric, colour, print), because "linen kurta" as an anchor rejected Shopify's "Linen Short Kurta".
- **`lib/relevance.ts`** (no Shopify imports):
  - `isExact`: a word-boundary match of an anchor term in the title, or in Shopify highlights/options (`extraText`). For category-level anchors, catalog items filed under that category (or a child category) also count. Shopify cards have no category, so they need the word.
  - `rankBlend`: exact gate → one embedding scale (`text-embedding-3-small`, `OPENAI_MODEL_EMBED`, cached per text) → scores bucketed by 0.02 with catalog first inside a bucket (transitive, unlike a pairwise ε compare) → at most 3 per brand. If the embedding call fails, it falls back to each source's own order.
- **Recall:** `retrieveAnchor` searches titles for the item in any category, e.g. the chaniya cholis filed elsewhere. Shopify is queried with the section's own angle plus the item name (`shopifyQuery`), 20 results.
- **No repeats across sections:** the sections of one answer take fresh items first. Without this, all three chaniya choli sections showed the same 3 catalog items.
- **Where it applies (Blend search only):**
  - chat sections;
  - "more like this", which ranks by similarity with no exact gate;
  - the results grid's longer list (`POST /api/blend/section`, replacing the client-side interleave).

  The home feed keeps the interleave, since it has no query. Drape home and Typesense search are unchanged (`eval:chat` 38/38).
- **Empty state:** a section with no exact match carries `emptyNote` ("No products found for "x" in either catalog."), shown in the chat and the results pane.
- **Eval:** `npm run eval:blend` runs 8 queries and passes 8/8, with every shown product exact. Results:
  - chaniya choli: 2 catalog + 14 Shopify, no lehengas;
  - linen kurta (men): all catalog in the chat, since catalog titles score slightly higher and win ties; Shopify's linen kurtas appear in the longer list;
  - nonsense item: "no products found".

  Search step: 0.8–8.6s, with Shopify the slowest part.

## Guidance agent: ask before showing when the request is vague (2026-10-06)

Feedback (screenshots vs Plush's AI stylist): "men" jumped straight to shirts and trousers. A guidance agent should ask first, then show sections and products once it understands. The user chose: all chat surfaces, as many questions as needed, plus a "View new results" pill.

- **Clarify turns are question-only.** Vague means the agent knows neither the item type nor an occasion or purpose ("men", "women", "apparel", "show me something nice", "gift ideas"). A gender, budget, colour or vibe alone isn't enough. The turn returns one short sentence plus one question with 3–5 tappable options, and no sections (`hasSections` excludes clarify). It keeps asking one new thing per turn, and recommends as soon as the need is clear. A reply of "just show me / anything / surprise me" to its question gives a best guess. If a clarify turn comes back with no (new) question, there's a fallback question (`CLARIFY_FALLBACK`).
- **Prompt placement matters.** With the long clarify rule inside the turn-type list, gpt-4.1-mini started writing one-sentence intros for *recommend* turns too (the eval's guidance check fell to 30/43). Moved to a separate "VAGUE REQUESTS" block at the end of the prompt, it scored 41/43, and the 2 remaining failures passed on reruns.
- **Results side (Typesense and Blend search):**
  - Sending a message no longer jumps phones to the Results tab; the tab switches when a turn actually brings new results, so a question stays in the chat.
  - When you're viewing an older result set and a newer one exists, a "View new results" pill appears at the top of the results pane.
- **Evals:**
  - `eval:chat` adds two conversations ("men" → "office wear"; "women" → "apparel" → "birthday party"). The vague turns must be clarify, and clarify turns must show no products.
  - `eval:blend` accepts a clarifying question for an unknown item.

### Follow-up (2026-10-06): Typesense first, questions without pills

- **Blend order is now catalog first.** Product owner's call: exact Typesense matches come first, then exact Shopify matches, each ordered by embedding similarity (`catalogFirst` in `lib/relevance.ts`). This replaces "pure relevance, catalog wins ties". The exact-only gate is unchanged. When our catalog has 8+ exact matches, the chat section shows only catalog items, and Shopify follows in the results grid (e.g. linen kurta, potli bag, nehru jacket). Chaniya choli shows 3 catalog, then Shopify.
- **No answer or follow-up pills** (`FEATURES.answerPills = false`), to match Plush's stylist. The agent's question is a natural chat sentence that names a few choices inline ("Are you shopping for everyday wear, office wear, something festive, or footwear and accessories?"). `ask.options` is still generated, but it isn't shown.
- **Sellers from the buyer's country** (2026-10-06). Blend search shows Shopify products only from sellers in the buyer's country (India). Shopify's catalog has no seller country (its seller record holds only id, name and links), so we use its closest filter, `ships_from`. It applies to:
  - chat sections, the results grid and "more like" (`LOCAL_SELLERS` in `lib/blendServer.ts`);
  - the Blend home feed (optional `local` on `/api/shopify/feed`);
  - the Similar / More-from-brand rails in the product view (optional `localSellers` on the Shopify `ProductDetail`).

  The Shopify tab itself is unchanged. Measured cost: none. Every probe query still returned a full 20 results, all from India-based stores. Stores that ship from India but price in USD still appear (converted, "≈ ₹").

## Blend search renamed to Scout (2026-10-06)

User-facing name, header tab (telescope icon), page titles and route are now **Scout** at `/scout`. `/blend` and `/blend/c/:id` redirect there (307, in `next.config.ts`), so shared links keep working. Internal names stay as they were (`surface: "blend"` keeps chats saved before the rename, plus the `blend` flag, `lib/blend*.ts`, `rankBlend` and `/api/blend/section`), because renaming them changes nothing for users.

## Scout: one segment first, the rest as pills (2026-10-06)

CEO feedback: when the intent is clear, Scout showed three result sets at once (e.g. Jewellery Gifts, Fashionable Bags, Cozy Accessories). Now it shows only the first, most important one, and offers the others as pills in the chat. Tapping a pill fetches that segment and adds its result card to the conversation. Scope: Scout only. Typesense search and Drape home still show every section.

- **Server:** the planner still plans every segment, and the Scout prompt asks for the most important one first. Only the first is retrieved. The others are sent as a `segments` event carrying the exact filters the agent planned (`SegmentOffer`: intent, anchor, categories), so a tap needs no AI call.
- **Tap:** an instant fetch through `POST /api/blend/section` (the same exact-match ranking; ~1.7s), with no extra agent reply (product owner's choice). Products already shown in that answer are skipped. The new result card gets refs in the store (`openSegment`), so "more like this" and product questions work on it. The results pane opens on it. A segment with no exact match shows the route's "No products found" note. If a fetch fails, the pill stays and tapping it again retries.
- **History:** the planner sees "[Can also show: …]", so typing "show the bags" also works. 
- **Fix found while testing:** a broad segment ("Accessories") expands to 16 categories, and the endpoint's limit of 10 rejected it, so the limit is now 40.
- **Effect:** the search step dropped from 1–9s to 1–2s, because one segment is searched instead of three. `eval:blend` passes 8/8.
- **Fix: Shopify never appeared when scrolling** (2026-10-06). The results list was capped at 120, and with "ours first", popular items filled every slot with our catalog: 182 linen kurtas and 250 sling bags against Shopify's 40 and 27. Per the product owner, the rule stays the same (all of ours, then all of Shopify's), so the cap is now a 400-item safety net and nothing gets cut. A full-width "More from other stores" divider marks where Shopify's products start in the grid. The list is ~150 KB and takes ~2s.

## Scout becomes a shopping agent; off-topic, names, chips, sorting (2026-10-07)

Feedback from testing (the product owner asked for general rules, not fixes tuned to the test messages):

- **Shopping, not just fashion.** Scout's planner swaps Drape's stylist persona for a shopping-assistant one (`scoutPrompt`; it throws if the persona line ever changes). Shopify searches from Scout cover every category (`allCategories`); the Shopify tab stays fashion-only. Our catalog is fashion-only, so a section with no fashion category (headphones, cookware) uses partner stores only.
- **No general questions.** New turn types:
  - `off_topic` (maths, general knowledge, news, coding, "how were you built / can you be copied"). It is decided first in the plan, so nothing is streamed, and the reply is always the fixed `OFF_TOPIC_NOTE` with no question or follow-ups. The chat keeps what it already knew.
  - `advice` ("what should I avoid…"). It gets its own answer step with concrete dos and don'ts and no product sections, so there are no sections "of things to avoid".
- **"No results for Virat Kohli t-shirts".** Shopify had plenty. The exact gate wanted the whole phrase in order. Now:
  - a term matches when all its words appear anywhere (any order, plurals, joined or split spellings like "tshirt" / "t shirt", whole tokens only);
  - anchors can carry `mustInclude` names (person, team, brand, character) that must also appear;
  - both catalogs are queried with those names.
- **Exact by words, not by meaning.** "Tee with Headphones Artwork" passed for headphones. Among exact matches, items scoring more than 0.30 below the best embedding similarity are dropped (`dropOffMeaning`). Measured: real matches sit within 0.22 of the best, while that tee was 0.37 below.
- **Shopify variant duplicates** (same title and price) collapse to one.
- **Product mentions as image chips.** A `[name](#n)` link renders as a small rounded card with the product's thumbnail (`RichText` `refCard`, in Drape and Scout). `tidyLinks` repairs the model's "[Name ([Name](#3))]" and "1. Name (#8): …" forms. The answer prompts list products already written as links, so the model copies the format.
- **Sorting when asked.** The chat base has `sort` (relevance / price_asc / price_desc), carried forward. Section results, the Scout list and the Typesense list are sorted by price when asked; in Scout a price sort overrides "ours first". "Which is best among these" (any language) answers with a numbered list, best first, rendered as chips.
- **Guidance bullets became a structured field.** Every new prompt rule made gpt-4.1-mini shorten Drape's recommend intros (eval 35–38/43). The bullets are now a separate `tips` array that the server joins under the intro and streams as each completes (`eval:chat` 41/43, and the 2 misses pass on rerun). Scout and Typesense search never show tips.
- **Evals:** `eval:blend` has 11 queries, adding a name-specific item, a non-fashion item and an off-topic question, and passes 11/11. There are 119 unit tests.
- **Off-topic replies steer back to shopping** (2026-10-07, at the CEO's request). The fixed note is shorter ("I can only help with shopping, so I can't answer that one.") and is followed by a closing question. A small dedicated call (`offTopicBridge`, ~1s) writes the question, bridging the topic to shopping where there's a natural link (a celebrity → their style, a team → jerseys and gear, a place's weather → what to pack, a company → its products), never stating a fact about the topic. In the planner itself, gpt-4.1-mini wrote the same generic "What are you looking to shop for today?" every time, whatever the rules said. Without a link, or if the question is missing or repeated, `OFF_TOPIC_FALLBACK` asks whether they want a product, a category or something for an occasion. The off-topic question itself is still never answered.

## Comparisons open on the right (2026-10-09)

In Scout and Typesense search, which share the same screen, a comparison now opens in the right-hand pane where results are listed, instead of inside the chat bubble. The chat shows a compact "Comparison" card (the products' thumbnails + "View comparison →"). The pane works with "views" (a result set or a comparison, one per message): a new comparison opens automatically, and when you're looking at an older one the "View new results" pill appears as for results. The engine sends compared products as minimal cards, and the screen fills in their images and links from the chat's cards by ref (`withCards`).

Comparisons now also work with partner-store (Shopify) products. Before, any Shopify product turned a comparison into a plain-text answer. `compareProducts` takes them as `extra` (card + live facts from `shopifyFacts`, fetched by the chat engine, so `compare.ts` still never imports Shopify code). The compare prompt is product-agnostic: occasions for clothing, use cases for everything else (e.g. headphones: commute, work calls, travel, gaming).

## Scout's purpose: a shopping agent for anything (2026-10-09)

The product owner asked for a full pass over Scout so nothing still assumes fashion. Decisions:
- Shopify's catalog is allowed in full: no blocked categories.
- Non-fashion products get "Goes well with" instead of Style it.
- The home page mixes categories.
- Scope is Scout only; Drape home and Typesense search stay fashion-focused, since their catalog is fashion.

What changed:
- **Compare:** in Scout mode (`compareProducts({ general })`) the model picks the 4–6 spec rows that matter for that kind of product (a tumbler: Capacity, Material, Insulation, Lid type…; headphones: Battery life, Noise cancelling…) and fills them only from the data given, with "—" when a value isn't stated. These replace the fixed Fabric / Fit / Pattern / Colour rows, and the heading becomes "Best for" (use cases for non-fashion). Images are square.
- **Style it → "Goes well with":** in Scout (`anyProduct` → `general` on the Shopify style-it route), the plan first decides whether the product is fashion. Fashion keeps occasions + complete the look; anything else gets 3–4 complementary items (a tumbler → sleeve, straw lid, cleaning brush, car cup holder; headphones → case, cleaning kit), searched across all categories from local sellers. Complements that are really the same product, i.e. relistings or variants with title word overlap of 50% or more (`sameProduct`), are skipped; headphones "cables" and a kurta's "bottoms" were the product again.
- **Home page:** Scout-specific headline ("Find anything, the smart way"), subtitle and placeholder (`PlusMode` wording). The example cards span categories, with covers from local-seller Shopify products (`scoutExamples`). The feed's Shopify side rotates a mixed query list (`feedQueries`, sent as `curated` + `allCategories` to `/api/shopify/feed`) and is mixed 1:1 with our catalog.
- **Card menus:** quick questions "Is it worth the price? / What goes well with it? / Cheaper alternatives?"; "Not for me" reasons "Too pricey / Not what I need / Other".
- **Agent voice:** a personal shopper (what matters when choosing: specs, materials, features), closing questions about what matters for that product type, and vague openers asked across every category. `SCOUT_CLARIFY_FALLBACK` replaces the clothing-only fallback.
- **Eval:** the nonsense query became "zorblax quantum fluxomatic". "…moonboots" correctly found Moon Boot (a real brand) once Scout searched every category. `eval:blend` passes 11/11, with 121 unit tests.

## Scout: image + text search, accessories, store requests, discounts (2026-10-09)

From testing:
- **Image search (Scout).** A photo button in the home search box and the chat. A photo is never sent on its own: the message text is required (the product owner's rule; the API also requires `message`). The browser shrinks the photo (768px JPEG for the agent, 160px thumb kept on the chat message). The engine reads it first (`describePhoto`, vision model, low detail, "Looking at your photo") into a shopper's description. The planner gets that plus the words ("something like this but in black" → black ceramic cups from a white-cup photo). The description is stored on the user message (`photo` event → `setPhoto`), so later turns know what the photo showed.
- **"Leather straps for watch from DailyObjects" showed watches.** Three general fixes:
  1. A category-level anchor only accepts the category its name *is* (`namesCategory`): "watch strap" filed under "watch" no longer lets every watch through.
  2. Accessories: anchors carry `forItem` (the item it's for: "watch" for straps, "iphone 15" for cases). A product must mention that item and must not *be* it: it can't be filed under that category, and its title's head noun can't be that item (`isTheItemItself`, which looks at the head noun before "with …" / "for …"). This removes "Leather Strap Analog Watch", "Black Watch with Leather Strap" and "Leather Strap Clogs", and keeps "Apple Watch Leather Strap (Brown)".
  3. Store requests: anchors carry `store`. Only that store's products show when it has any; otherwise everyone's, with "Couldn't find X in our stores, so these are from other sellers." Matching ignores spacing and case, by brand or domain. The store is removed from mustInclude (`namesWithoutStore`), where the planner sometimes also put it. DailyObjects isn't in either catalog: Typesense has 0, and Shopify has no DailyObjects seller shipping in India.
- **Two prices.** Shopify variants carry `list_price` (the original price) when discounted. It's kept only when above the selling price, for the variant whose price is shown, and converted from USD at the same rate. Scout tiles, the compare table, the Shopify product view and Shopify cards show "₹1,499 ~~₹2,500~~ 40% off". Our Typesense catalog has no original-price field.
- **Checks:** `eval:blend` has 12 queries, adding the strap/store case, and passes 12/12. `eval:chat` passes 43/43, and there are 127 unit tests.
- **Bold key words in Scout replies** (2026-10-09). The Scout prompt asks the model to bold the 2–3 phrases that matter most. When a recommend or refine intro arrives without any bold, the server bolds the item's name where it appears (`boldItem`) and resends the intro with `chat_text { replace: true }`, which swaps the streamed text in place. The Shopify product view's instant preview now also carries the original price.
- **Seller-country filter removed** (2026-10-09). The product owner wants stores from anywhere, as long as they deliver to India. `LOCAL_SELLERS = false` (search, more-like, examples), and the Scout feed, product-view rails and "Goes well with" no longer send `ships_from: IN`. Every search still sends `ships_to: IN`, so products are deliverable and priced in ₹; USD-priced stores are converted and shown as "≈ ₹". This reverses the 2026-10-06 "sellers from the buyer's country" rule.

## Scout: relevance mixing and Shopify image search (2026-10-09)

- **Mixing by relevance** (product owner's choice, all Scout searches). This replaces "all of ours, then all of Shopify's", which hid better Shopify matches, especially on photo searches. `mixByRelevance` ranks both sources on one embedding score, plus `CATALOG_NUDGE` (+0.03) for our catalog, so ours wins near-ties while a clearly better Shopify product comes first. On photo searches Shopify's visual-similarity order adds up to `VISUAL_BONUS` (+0.05). Ties are bucketed, with ours first, and there are at most 3 per brand. A requested price sort still overrides. Applies to chat sections and the longer list (`/api/blend/section`).
- **Shopify supports image search.** `search_catalog`'s `like` accepts an inline image ("visual similarity search") as well as product ids, combinable with a text query. Measured on a tennis-shorts photo:
  - text only (our description) → generic black athletic shorts;
  - image only → tennis items, but noisy (skirts, socks);
  - image + "navy blue" → navy tennis shorts (New Balance Tournament, Lacoste, Court Dri-Fit).

  So for the photographed item's section, Scout sends Shopify the photo plus the item and the shopper's own words (`likeImage`, `shopifyQuery(anchor, message)`; the planner's long query diluted the image). Our catalog keeps searching by the photo's description, since it has no image vectors. The exact-match gate still filters the noise. The longer list behind "View Results" is text-based (the image isn't stored).
- **Checks:** `eval:blend` passes 12/12, with 130 unit tests. In one live photo run the first section came back empty once and didn't reproduce in two reruns, so it's noted as a possible transient (Shopify rate limit or planner variance).
