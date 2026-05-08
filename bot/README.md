# Nintondo Bot

Nintondo Bot is an 18+ Telegram roast bot built for degenerate meme coin communities on the TON chain. It parodies Nintendo characters as washed-up crypto addicts — Mario as a coke-addled plumber with IRS problems, Pikachu as a leveraged electric rat fresh out of rehab, DK as a roided gym bro who lost his rent on a 100x long — and uses them to roast your community at every opportunity: when new members join, when anyone talks back to the bot, and on-demand via `/roast`. It ships with 220+ handcrafted roasts, an anti-repetition system so the same line doesn't hit twice in a row, and a character-tag system for future themed expansions.

---

## Features

- **Welcome roast** — fires automatically when a new member joins the group, targeting them by name
- **Reply roast** — any message that replies to the bot gets a fresh roast back
- **`/roast @user`** — publicly roast a named target; reply-to a message to target that person
- **Anti-repetition** — tracks the last 50 roasts per chat, never repeats within that window
- **Character-themed** — 220+ roasts tagged across Mario, Pikachu, DK, Peach, Luigi, Bowser, Yoshi, Link, and general categories
- **Admin `/stats`** — shows roast counts and usage per chat
- **Rate limiting** — `/roast` capped at once per 30 seconds per user (in-memory, resets on restart)

---

## Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd nintondo-bot

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and fill in BOT_TOKEN and ADMIN_USER_ID

# 5. Seed the database
python seed_roasts.py

# 6. Run the bot
python bot.py
```

---

## Getting a Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Follow the prompts: choose a name and username (must end in `bot`)
4. BotFather will give you a token like `123456789:ABCdef...` — paste that into `.env` as `BOT_TOKEN`
5. To find your numeric Telegram ID: message **@userinfobot** and it'll reply with your ID

---

## **CRITICAL Telegram Configuration**

These steps are required. Skip any of them and core features will silently not work.

**1. Add the bot to your group**
Invite `@YourBotUsername` to the group the same way you'd add any member.

**2. Promote the bot to admin**
Go to group settings → Administrators → Add Administrator → select the bot.
Grant at least "Read Messages" and leave the rest as default.
This is required for `ChatMemberHandler` to receive join events.

**3. Disable Group Privacy in BotFather**
- Open **@BotFather**
- Send `/mybots`
- Select your bot
- → **Bot Settings** → **Group Privacy** → **Turn off**

Without this, the bot only sees messages that start with `/` — reply detection and welcome messages will silently fail.

**4. Enable group access in BotFather**
- **@BotFather** → `/mybots` → your bot
- → **Bot Settings** → **Allow Groups** → **Turn on**

---

## Deployment — Render (Recommended)

Render runs background workers for free on the starter plan.

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Background Worker** (NOT a web service — this bot has no HTTP port)
3. Connect your GitHub repo
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `python bot.py`
6. Under **Environment**, add:
   - `BOT_TOKEN` = your token
   - `ADMIN_USER_ID` = your numeric Telegram ID
   - `DB_PATH` = `/opt/render/project/src/data/nintondo.db`
7. Under **Disks**, add a persistent disk:
   - Mount path: `/opt/render/project/src/data`
   - Size: 1 GB (SQLite at this scale is a few MB)

The persistent disk ensures the SQLite database survives redeploys. Without it, the DB resets on every deploy (you'd lose the anti-repetition state, not the roasts themselves — re-run `seed_roasts.py` in the build command if needed).

**Build command with auto-seed:**
```
pip install -r requirements.txt && python seed_roasts.py
```

---

## Deployment — VPS (systemd)

```ini
# /etc/systemd/system/nintondo-bot.service
[Unit]
Description=Nintondo Telegram Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/nintondo-bot
EnvironmentFile=/home/ubuntu/nintondo-bot/.env
ExecStart=/home/ubuntu/nintondo-bot/venv/bin/python bot.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nintondo-bot
sudo systemctl start nintondo-bot
sudo journalctl -u nintondo-bot -f   # live logs
```

---

## Adding More Roasts

1. Open `seed_roasts.py`
2. Append new tuples to the `ROASTS` list: `("roast text", "category", "character_tag")`
3. Re-run `python seed_roasts.py` — `INSERT OR IGNORE` handles deduplication safely
4. Restart the bot

Categories: `welcome` | `reply` | `targeted` | `universal`
Character tags: `mario` | `pikachu` | `dk` | `peach` | `luigi` | `bowser` | `yoshi` | `link` | `general`

Use `{name}` as a placeholder where you want the target user's Telegram first name to appear.

---

## Content Disclaimer

Nintondo Bot is an 18+ parody bot intended for adult meme coin communities. All roasts are satirical fiction. Characters are reimagined as adult fictional degenerates — no content references their source-material child-friendly framing. The bot does not target users based on race, religion, nationality, gender identity, sexual orientation, disability, or any other protected characteristic. No roast constitutes financial advice. Community administrators are responsible for ensuring the bot is used in appropriate contexts with appropriate audiences.
