# nintondo-web

TypeScript Mini App + serverless API for the Nintondo Telegram bot.

## Structure

```
web/
├── api/             Vercel serverless functions
│   ├── roast.ts     POST /api/roast  — pick a roast + generate stats
│   ├── card.ts      GET  /api/card   — render PNG card (@vercel/og)
│   └── _shared/     Shared data + utilities (not directly served)
├── apps/
│   └── miniapp/     Svelte + Vite Mini App (Telegram Web App)
├── vercel.json      Vercel config (Root Directory = web/ in project settings)
└── .env.example     Required environment variables
```

## Prerequisites

- Node ≥ 20
- pnpm ≥ 9  (`npm i -g pnpm`)

## Local development

```bash
cd web
pnpm install
pnpm dev          # starts the Svelte Mini App on http://localhost:5173
```

The API functions (`/api/roast`, `/api/card`) run on Vercel only. For local
testing, use `vercel dev` (requires Vercel CLI) which serves both the frontend
and the serverless functions together.

```bash
npm i -g vercel
vercel dev        # from the web/ directory
```

## Deployment — Vercel

1. Push the repo to GitHub if you haven't already.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **CRITICAL — Root Directory:** in the Vercel project settings, set
   **Root Directory** to `web`. Without this, Vercel reads the wrong
   `package.json` and the build fails.
4. Framework Preset: **Other** (not Next.js).
5. Build command: `pnpm build`  (pre-filled from `vercel.json`)
6. Output directory: `apps/miniapp/dist`  (pre-filled)
7. Add environment variables (see `.env.example`):
   - `PUBLIC_API_BASE` = your Vercel deployment URL, e.g.
     `https://nintondo-web.vercel.app`
8. Click **Deploy**.

## BotFather — register the Mini App

After your first successful Vercel deployment:

1. Open **@BotFather** → `/mybots` → select your bot
2. → **Bot Settings** → **Menu Button** → **Configure menu button**
3. Set the URL to `https://nintondo-web.vercel.app` (your Vercel URL)
4. Set the button text to something like `🃏 Get Roasted`
5. Done — users will see the button in the chat input bar

## Adding your full roast pool

Replace `api/_shared/roasts.json` with your 420+ roasts using the same
schema (id, text, category, character_tag, weight). The `id` field must
be unique across all roasts.

## Inline mode (Python bot integration)

The Python bot calls:
1. `POST /api/roast` with `{ userId, firstName, category: "targeted" }`
2. Receives `cardUrl` in the response
3. Passes `cardUrl` as `photo_url` in an `InlineQueryResultPhoto`

Vercel's edge cache means repeat calls for the same user + roast serve
instantly without re-rendering.
