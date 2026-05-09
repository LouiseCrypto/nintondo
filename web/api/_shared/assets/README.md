# Static assets for the card renderer

All files here are loaded at runtime by `render.tsx` via `fs.readFileSync`.
They are bundled into the Vercel deployment by the `includeFiles` directive
in `vercel.json`.

## Files

| File | Status | Purpose |
|------|--------|---------|
| `default-avatar.svg` | ✅ committed | Fallback avatar when a user has no Telegram photo |
| `logo-mark.png` | ⚠️ **you provide** | NINTONDO wordmark (red/blue/red) on transparent bg. ~800×200 ideal. If missing, the header renders "NINTONDO" in plain text. |
| `characters/` | ⚠️ **you provide** | Character cameo PNGs — see `characters/README.md` |
