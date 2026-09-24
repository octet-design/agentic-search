# Decisions & deviations from the brief

Newest last. Each entry: what, why, and where it applies.

## M0 — Scaffold

- **Next.js 16.3 (App Router), React 19.2, Tailwind v4, ESLint 9 flat config.** Latest stable at scaffold time, from `create-next-app`. Tailwind v4 has no `tailwind.config.js`; theme tokens go in CSS (`@theme`) when the UI is built in M4.
- **UI dependencies deferred.** shadcn/ui, lucide-react, framer-motion and zustand get added in M4/M6, when the first component that needs them is written. M0 ships only what discovery and env validation need: `typesense`, `openai`, `zod` (+ `tsx`, `vitest`).
- **Scripts run with `node --env-file-if-exists=.env.local --import tsx`.** This uses Node 24's built-in env loading, so no `dotenv` dependency is needed.
- **`npm run typecheck` = `next typegen && tsc --noEmit`.** Next 16 generates global route types (`LayoutProps`, etc.), and plain `tsc` fails without them.
- **Boot-time model check lives in `src/instrumentation.ts`** (dev only, non-blocking). It warns when a configured model is missing and names the closest available model. `npm run check` runs the same check plus a Typesense ping, and exits non-zero on failure.
- **Env access is centralised** in `src/lib/env.ts` (zod-validated, blank values treated as unset). The Typesense and OpenAI clients are lazily created singletons in `src/lib/typesense.ts` and `src/lib/openai.ts`.
