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
