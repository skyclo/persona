<!-- cspell:ignore Vite vite isbot n8n OpenRouter Gemini Wrangler PostCSS TailwindCSS -->

## Persona — Copilot instructions

Purpose: give an AI agent the minimum, high-value context to be productive in this repo.

- Architecture snapshot
    - Frontend: React + React Router v7 (file-based routes) + TailwindCSS + Lucide Icons. See `app/` (root, entry.server.tsx, route modules like `app/routes/home.tsx`, `app/welcome/*`).
    - Bundler / dev: `Vite` with plugins: `@cloudflare/vite-plugin`, `@react-router/dev`, `@tailwindcss/vite` (see `vite.config.ts`).
    - Runtime: Cloudflare Workers (server entry at `workers/app.ts`, configured in `wrangler.jsonc`).

- Key workflows / commands
    - dev: `npm run dev` (starts react-router dev server / `vite`). Use for local iteration.
    - build: `npm run build` (produces server build used by Cloudflare). `npm run preview` builds + previews.
    - deploy: `npm run deploy` (runs build then `wrangler deploy`).
    - typegen: `npm run cf-typegen` (wrangler types). `postinstall` runs this automatically.
    - typecheck: `npm run typecheck` (runs `cf-typegen`, `react-router typegen`, then `tsc -b`).

- Project-specific patterns and conventions
    - Server rendering: uses `virtual:react-router/server-build` inside `workers/app.ts` to create the Cloudflare `fetch` handler. Avoid changing the `createRequestHandler` pattern unless updating SSR behavior across the stack.
    - Loaders and Cloudflare env: route loaders receive `{ context }` and commonly access `context.cloudflare.env`. Example: `app/routes/home.tsx` loader returns `{ message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE }`.
    - Type bindings: the code declares an `AppLoadContext` augmentation so `context.cloudflare.env` is strongly-typed. Keep `Env` shape in sync with `wrangler.jsonc` and any added secrets.
    - Streaming SSR: `app/entry.server.tsx` uses `renderToReadableStream` and waits for `body.allReady` for crawlers / SPA mode using the `isbot` package. Preserve this pattern if editing server render flow.
    - Tailwind/PostCSS: styles are in `app/app.css` using PostCSS/Tailwind directives. The `Vite` plugin `@tailwindcss/vite` is active in `vite.config.ts`.

- Integration points / external dependencies to watch for
    - Cloudflare Worker entry: `workers/app.ts` and `wrangler.jsonc` (main + env vars). Changing env names requires updating wrangler and any runtime references.
    - n8n webhook: `wrangler.jsonc` includes `N8N_WEBHOOK_URL` — used by server/workers or background tasks. Keep secrets out of source; use Wrangler secrets for production values.
    - Agentic AI references: README mentions Gemini, OpenRouter, and n8n. These are conceptual/external (not directly wired here) — search code for any API clients before adding credentials.

- Small editing rules for AI agents
    - When modifying a route loader, keep the signature `loader({ context }: Route.LoaderArgs)` and return JSON-serializable values (the router relies on these shapes).
    - Do not break the `virtual:react-router/server-build` import in `workers/app.ts`; it is required for the deployed SSR bundle.
    - When adding env variables: add them to `wrangler.jsonc` (or secret via `wrangler secret put`), and update any `Env` TypeScript types so `tsc` passes.
    - Keep PostCSS/Tailwind tokens in `app/app.css`; Tailwind plugin runs during the `Vite` build.
    - Don't worry too much about spelling warnings (especially in shader code); focus on functionality first.

- Examples (quick copy-paste patterns)
    - Loader reading Cloudflare env (from `app/routes/home.tsx`):
      const loader = ({ context }) => ({ message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE });

    - Worker fetch export (from `workers/app.ts`):
      const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);
      export default { async fetch(request, env, ctx) { return requestHandler(request, { cloudflare: { env, ctx } }); } } satisfies ExportedHandler<Env>;

- Where to look first (priority files)
    - `workers/app.ts` — Cloudflare fetch handler, SSR glue.
    - `app/entry.server.tsx` — streaming SSR behavior and bot handling.
    - `app/root.tsx` — application layout, error boundary, links (fonts/styles).
    - `vite.config.ts` & `wrangler.jsonc` — build/deploy config and plugins.
    - `package.json` — scripts (dev/build/deploy/typegen).

If anything above is unclear or you'd like more examples (e.g., type shapes for `Env`, common loader return shapes, or how to run `wrangler` locally), tell me which area to expand and I will update this file.
