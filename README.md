# Drape: agentic fashion discovery (internal POC)

An AI shopping stylist for the Indian fashion market. You describe what you want in English, Hinglish or Hindi, and Drape:

1. works out hard needs, soft preferences and exclusions, and shows them as editable chips;
2. plans category rails for occasions, vibes and gifts;
3. returns products from the ~5.5-lakh catalog in Typesense, each with a one-line reason.

Buying redirects to the brand's own product page. The spec is [docs/BRIEF.md](docs/BRIEF.md); every deviation from it is logged in [docs/DECISIONS.md](docs/DECISIONS.md).

## Setup

Requirements: Node 20+ (developed on Node 24), npm, and network access to the Typesense server and to OpenAI.

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run check                # validates env; pings Typesense and OpenAI; checks the models exist
npm run dev                  # http://localhost:3000
```

### Environment (`.env.local`, git-ignored)

| Variable | Purpose |
|---|---|
| `TYPESENSE_HOST` | e.g. `http://10.0.0.5:8108` (parsed into protocol/host/port) |
| `TYPESENSE_SEARCH_KEY` | Search-only key. Used **server-side only**. |
| `TYPESENSE_COLLECTION` | Default `products` |
| `OPENAI_API_KEY` | Server-side only |
| `OPENAI_MODEL_FAST` | Default `gpt-4.1-mini`: intent, rerank, planner, refine agent, compare, surprise |
| `OPENAI_MODEL_VISION` | Default `gpt-4.1-mini`: image search (must accept images) |
| `OPENAI_MODEL_OFFLINE` | Default `gpt-4.1`: taxonomy build script |
| `NEXT_PUBLIC_APP_NAME` | Brand name (default `Drape`; also in `src/lib/config.ts`) |

In dev, the server checks at boot that the configured models exist, and warns with the closest available model if one doesn't. Reasoning models are called with the lowest reasoning effort.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm run lint` | ESLint (Next + React compiler rules) |
| `npm test` | Vitest: query builder, relaxation ladder, post-filter, chips, taste, taxonomy, filters, env |
| `npm run check` | Validates env and checks Typesense and OpenAI are reachable |
| `npm run discover` | M0 catalog discovery → `data/raw-facets/`, `data/discovery/` (summary in `docs/catalog-notes.md`) |
| `npm run build:taxonomy [-- --repropose]` | M1 taxonomy → `data/taxonomy.json` + `data/taxonomy.review.md`. LLM calls are cached in `.cache/llm`. |
| `npm run eval [-- --only 1,4] [-- --no-rerank]` | Runs the 25 brief queries headless → `docs/eval-report.md`, with automatic FAIL checks |

## Architecture

```
Browser
  ├─ zustand session store (profile, likes/dislikes/clicks, saved, compare) → localStorage "drape.session.v1"
  ├─ useAgentStream ── SSE ──► /api/search · /api/refine · /api/image-search
  └─ fetch ─► /api/similar · /api/for-you · /api/compare · /api/surprise · /api/products · /api/style-tiles

Server (route handlers, Node runtime) — src/lib/agent/
  intent.ts        query → Intent (structured output; static prompt so OpenAI prompt caching applies)
  taxonomy.ts      canonical ids ⇄ raw facet values (data/taxonomy.json)
  queryBuilder.ts  Intent → Typesense params (pure)
  retrieve.ts      two-leg retrieval per rail (see below), post-filter, dedupe, diversity, relaxation ladder
  relax.ts         relaxation steps (pure)
  rerank.ts        LLM scores + reasons in parallel chunks; 5s timeout → deterministic reasons
  plan.ts          occasion/vibe/gift → stylist note + 3–5 rails; adapt-step query rewrite
  pipeline.ts      understand → clarify → plan → search → relax → curate → adapt → explain, emitting SSE events
  refineAgent.ts   chat tool loop (update_search, find_similar, compare, ask_user)
  personalize.ts   the only ways taste touches a search (fill audience/budget/size, soft avoids, tie-breaks)
```

**Two-leg retrieval.** On this Typesense server, vector search combined with a restrictive filter is pathologically slow: 8s to over 60s. So every rail sends two searches in one `multi_search`:
- **exact:** keyword on title, with all filters;
- **semantic:** title+embedding hybrid, with only base + audience filters.

Must-requirements and exclusions for semantic hits are enforced in code with the taxonomy, then the two legs are fused with reciprocal-rank fusion. Exclusions are applied as filters *and* re-checked in code, so they can't leak. Details are in `docs/DECISIONS.md`.

**Base filter** (from M0): `in_stock:true && is_active:!=false && gender:!=[other,unidentified] && category:!=[non-fashion deny-list] && price:>=50`.

## Budgets (measured)

Measured from a dev machine in India. A trivial gpt-4.1-mini call has ~1.3s network round trip from here, and the Typesense server's baseline for a trivial query was ~370 ms during testing (normally ~70 ms).

| Metric | Target | Measured | Status |
|---|---|---|---|
| Intent extraction | ≤ 1.2s p50 | 2.5–4s (≈1.3s network + ~200 output tokens) | **Gap** |
| Typesense multi_search (all rails) | ≤ 400 ms | ~0.8–1.6s product, ~4s for 4–5 rails | **Gap** (server baseline) |
| Rerank (parallel) | ≤ 2.5s p50, 5s timeout | ~3.6–4.2s; 9 of 44 rail reranks hit the timeout in the eval → fallback | **Gap**; fallback works |
| First results (product query) | ≤ 4s p50 | ~8–9s (eval p50 8.7s total) | **Gap** |
| First rail (occasion query) | ≤ 5s p50 | ~15s (intent + planner + 4–5 rails) | **Gap** |
| Tokens per search | ≤ ~8k in / 1.5k out | ~13.8k in / 2.5k out avg (~$0.008/query) | **Gap** |
| Cache hit (repeat query) | served from cache | intent + plan cached (LRU 500, 30 min) | ✓ |

Most of the latency is network distance to OpenAI plus output tokens, not prompt size: 15.7k of 16.4k input tokens were prompt-cached in tests. Levers, in rough order of impact:
1. Deploy next to OpenAI and Typesense (≈1s less per LLM call).
2. Merge the intent and plan calls for occasion queries.
3. Use gpt-4.1-nano for rerank, or rerank only the top 12 shown.
4. Stream preliminary results (fused order + deterministic reasons) before the rerank finishes.
5. Shorten rerank output (reasons only for shown items).
6. Check the Typesense server's load and resources.

## Quality

- `docs/eval-report.md`: **25/25 queries pass** the automatic checks (no exclusion violations, no audience mismatches, no price violations without relaxation). Each query has its intent, filters, relaxation, top 10 with reasons, latency and tokens.
- End-to-end smoke test against a production build: 22/22 checks, covering every API route, the refine criteria ("cheaper", "like #3 but in blue", "no polyester", "show men's instead") and image search.
- `npm test`: 62 unit tests.

## Known limits

- **Latency and token budgets are missed** from this network (see above).
- **Not clicked through in a real browser in this session.** Pages render server-side, the build passes and the APIs are smoke-tested, but interactive UI (drawers, chip editing, mobile bottom sheet) should get a manual pass.
- **Catalog data quality:** descriptions are generated from facets, so details like necklines, slits and sleeves come from titles only. Some titles have unrecoverable broken characters, and facet values are machine-extracted. Taxonomy mappings flagged medium/low confidence are listed in `data/taxonomy.review.md`.
- **The live catalog drifts:** re-run `npm run discover` and `npm run build:taxonomy` occasionally. Families stay stable (`data/taxonomy.families.json`); only raw-value assignments are recomputed.
- **Size filters:** size strings mix formats (`M`, `38/M`, `5-6Y`, `US 8`). "Only my size" matches the profile string exactly; there's no size normalisation yet.
- **Images:** there are no image vectors, so image search is "matched by description, not pixels".
- **Anonymous and per device:** no auth or database. Taste lives in localStorage and is sent with each request.
- **Security:** the Typesense key could read `/debug` and the collection schema. Check that it really is search-only. Keys never reach the client bundle (checked by grepping `.next/static`).
