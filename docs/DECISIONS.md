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
