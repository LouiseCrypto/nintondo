# Nintondo

An 18+ parody memecoin community project on TON blockchain.

## Repo structure

- `bot/` — Python Telegram bot (python-telegram-bot v21.6, SQLite,
  deployed on Render as a long-poll worker). See `bot/README.md`.
- `web/` — TypeScript Mini App + serverless API (Svelte, @vercel/og,
  deployed on Vercel). See `web/README.md`.

The two halves are independent runtimes that communicate over HTTPS.

## Development

Each subfolder has its own setup instructions. Read the relevant
README before working in that folder.
