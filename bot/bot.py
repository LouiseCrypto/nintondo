"""
bot.py — Nintondo Bot: the aggressive, degenerate host for an 18+ meme coin community.

Commands:
  /roast [@user] [character] — roast someone (character optional: mario/pikachu/dk/peach/luigi/bowser/yoshi/link)
  /roastme                   — volunteer yourself for a roast
  /battle @user1 @user2      — roast battle between two users
  /leaderboard               — most roasted victims in this chat
  /roaststreak               — how many consecutive days this chat has been active
  /help | /start             — info

Admin only:
  /stats                     — roast counts and DB info
  /addroast <category> <text>— add a new roast to the DB live
  /unroast @user             — toggle a user on/off the welcome-roast blacklist
  /setcooldown <seconds>     — change the /roast rate limit (default 30s)
  /dailyroast <on|off> [hour]— enable/disable scheduled daily roast (hour = UTC, default 12)

Passive:
  React to any bot message with 🔥 to get a bonus roast.
"""

import datetime
import html
import logging
import os
import random
import sqlite3
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, InlineQueryResultArticle, InlineQueryResultCachedPhoto, InlineQueryResultPhoto, InputTextMessageContent, Update, WebAppInfo
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    ChatMemberHandler,
    CommandHandler,
    ContextTypes,
    InlineQueryHandler,
    MessageHandler,
    MessageReactionHandler,
    filters,
)

from seed_roasts import init_db

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("nintondo")

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_USER_ID_RAW = os.getenv("ADMIN_USER_ID", "")
DB_PATH = os.getenv("DB_PATH", "data/nintondo.db")
CARD_API_URL = os.getenv("CARD_API_URL", "").rstrip("/")
ADMIN_USER_ID: int | None = (
    int(ADMIN_USER_ID_RAW) if ADMIN_USER_ID_RAW.strip().isdigit() else None
)

# In-memory rate-limit: {user_id: last_use_timestamp} — resets on restart
_roast_cooldown: dict[int, float] = {}

# In-memory reaction rate-limit per chat: {chat_id: last_fire_timestamp}
_reaction_cooldown: dict[int, float] = {}
REACTION_COOLDOWN_SECONDS = 60

# Character name aliases → canonical tag
CHARACTER_ALIASES: dict[str, str] = {
    "mario": "mario",
    "pikachu": "pikachu",
    "pika": "pikachu",
    "dk": "dk",
    "donkeykong": "dk",
    "donkey": "dk",
    "kong": "dk",
    "peach": "peach",
    "princess": "peach",
    "luigi": "luigi",
    "bowser": "bowser",
    "yoshi": "yoshi",
    "link": "link",
    "zelda": "link",
    "wario": "wario",
    "toad": "toad",
    "kirby": "kirby",
    "samus": "samus",
    "fox": "fox",
    "ganondorf": "ganondorf",
    "ganon": "ganondorf",
    "falcon": "captain_falcon",
    "captainfalcon": "captain_falcon",
    "captain": "captain_falcon",
}

# Battle win-declaration templates (no {name} here — we inject manually)
BATTLE_WINNER_LINES = [
    "{winner} wins. {loser} loses. Same outcome as their portfolio this quarter.",
    "By unanimous decision of absolutely nobody who asked: {winner} takes the dub. {loser} is invited to process this privately.",
    "{winner} squeaks the W. {loser} should probably log off and touch grass. We'll still be here when they return, slightly worse.",
    "The judges scored this {winner} by TKO in round one. {loser} fought bravely and lost embarrassingly. As is tradition.",
    "{winner} wins, which is more than can be said for their trading record, but a W is a W. {loser} copes.",
    "Scorecards read: {winner}. {loser} is statistically more likely to sell the bottom next dip. Science.",
    "{winner} takes it. {loser} has been roasted harder than their entry price. Thoughts and prayers.",
]

# ──────────────────────────────────────────────────────────────────────────────
# Database helpers
# ──────────────────────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def pick_roast(
    chat_id: int,
    category: str,
    character_tag: str | None = None,
) -> tuple[int, str, str]:
    """Return (roast_id, roast_text, character_tag). Excludes last 50 used per chat."""
    with get_conn() as conn:
        recent = conn.execute(
            "SELECT roast_id FROM recently_used WHERE chat_id = ? ORDER BY used_at DESC LIMIT 50",
            (chat_id,),
        ).fetchall()
        recent_ids = [r["roast_id"] for r in recent]

        def _query(exclude: list[int]) -> sqlite3.Row | None:
            char_clause = "AND character_tag = ?" if character_tag else ""
            excl_clause = (
                f"AND id NOT IN ({','.join('?' * len(exclude))})" if exclude else ""
            )
            params: list = [category]
            if character_tag:
                params.append(character_tag)
            params.extend(exclude)
            return conn.execute(
                f"SELECT id, text, character_tag FROM roasts WHERE category = ? {char_clause} {excl_clause} ORDER BY RANDOM() LIMIT 1",
                params,
            ).fetchone()

        row = _query(recent_ids) or _query([])
        if row is None:
            row = conn.execute("SELECT id, text, character_tag FROM roasts ORDER BY RANDOM() LIMIT 1").fetchone()

        roast_id: int = row["id"]
        roast_text: str = row["text"]
        char_tag: str = row["character_tag"] or "general"

        conn.execute(
            "INSERT OR REPLACE INTO recently_used (chat_id, roast_id, used_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            (chat_id, roast_id),
        )
        conn.execute(
            """DELETE FROM recently_used WHERE chat_id = ?
               AND roast_id NOT IN (
                   SELECT roast_id FROM recently_used WHERE chat_id = ?
                   ORDER BY used_at DESC LIMIT 50
               )""",
            (chat_id, chat_id),
        )
        conn.commit()

    logger.info("Roast sent — chat=%s category=%s roast_id=%s char=%s", chat_id, category, roast_id, char_tag)
    return roast_id, roast_text, char_tag


def log_roast(chat_id: int, target_user_id: int, target_name: str, category: str) -> None:
    """Record a targeted roast for leaderboard tracking."""
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO roast_log (chat_id, target_user_id, target_name, category) VALUES (?, ?, ?, ?)",
            (chat_id, target_user_id, target_name, category),
        )
        conn.commit()


def update_streak(chat_id: int) -> int:
    """Update the daily activity streak for a chat. Returns the current streak."""
    today = datetime.date.today().isoformat()
    with get_conn() as conn:
        conn.execute("INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)", (chat_id,))
        row = conn.execute(
            "SELECT streak, last_active_date FROM chat_settings WHERE chat_id = ?", (chat_id,)
        ).fetchone()
        streak = row["streak"] or 0
        last_date = row["last_active_date"]

        if last_date == today:
            return streak  # Already counted today

        yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        if last_date == yesterday:
            streak += 1
        else:
            streak = 1

        conn.execute(
            "UPDATE chat_settings SET streak = ?, last_active_date = ? WHERE chat_id = ?",
            (streak, today, chat_id),
        )
        conn.commit()
    return streak


def is_blacklisted(chat_id: int, user_id: int) -> bool:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM blacklist WHERE chat_id = ? AND user_id = ?", (chat_id, user_id)
        ).fetchone()
        return row is not None


def get_cooldown(chat_id: int) -> int:
    with get_conn() as conn:
        conn.execute("INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)", (chat_id,))
        row = conn.execute(
            "SELECT cooldown_seconds FROM chat_settings WHERE chat_id = ?", (chat_id,)
        ).fetchone()
        conn.commit()
        return row["cooldown_seconds"] if row else 30


def get_chat_settings(chat_id: int) -> dict:
    with get_conn() as conn:
        conn.execute("INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)", (chat_id,))
        row = conn.execute("SELECT * FROM chat_settings WHERE chat_id = ?", (chat_id,)).fetchone()
        conn.commit()
        return dict(row) if row else {}


def inject_name(text: str, user_id: int, first_name: str) -> str:
    """Replace {name} with an HTML Telegram mention."""
    if "{name}" not in text:
        return text
    safe = html.escape(first_name)
    return text.replace("{name}", f'<a href="tg://user?id={user_id}">{safe}</a>')


def mention(user_id: int, first_name: str) -> str:
    safe = html.escape(first_name)
    return f'<a href="tg://user?id={user_id}">{safe}</a>'


# ──────────────────────────────────────────────────────────────────────────────
# Card helpers
# ──────────────────────────────────────────────────────────────────────────────

import urllib.parse

async def get_avatar_url(bot, user_id: int) -> str | None:
    """Return the full Telegram CDN URL for the user's profile photo, or None."""
    try:
        photos = await bot.get_user_profile_photos(user_id, limit=1)
        if photos.photos:
            file = await bot.get_file(photos.photos[0][-1].file_id)
            # file.file_path may be a relative path — build the full URL explicitly
            fp = file.file_path or ""
            if fp.startswith("http"):
                return fp
            return f"https://api.telegram.org/file/bot{BOT_TOKEN}/{fp}"
    except Exception as e:
        logger.debug("get_avatar_url failed for %s: %s", user_id, e)
    return None


def build_card_url(
    user_id: int,
    roast_id: int,
    display_name: str,
    text: str,
    char_tag: str,
    avatar_url: str | None,
) -> str | None:
    """Build the Vercel card image URL. Returns None if CARD_API_URL is not set."""
    if not CARD_API_URL:
        return None
    params: dict[str, str] = {
        "u": str(user_id),
        "r": str(roast_id),
        "n": display_name,
        "t": text,
        "c": char_tag,
    }
    if avatar_url:
        params["a"] = avatar_url
    return f"{CARD_API_URL}/api/card?{urllib.parse.urlencode(params)}"


async def send_roast_card(
    msg,
    bot,
    user_id: int,
    first_name: str,
    username: str | None,
    roast_id: int,
    roast_text: str,
    char_tag: str,
    caption: str,
) -> None:
    """Send the roast as a card image with caption, falling back to plain text."""
    # Use @handle for the card display name, fall back to first name
    display_name = username or first_name
    avatar_url = await get_avatar_url(bot, user_id)

    logger.info("Card build — user_id=%s first_name=%r username=%r display_name=%r avatar_url=%r",
                user_id, first_name, username, display_name, avatar_url)

    card_url = build_card_url(user_id, roast_id, display_name, roast_text, char_tag, avatar_url)
    logger.info("Card URL: %s", card_url)

    if card_url:
        try:
            await msg.reply_photo(photo=card_url, caption=caption, parse_mode=ParseMode.HTML)
            return
        except Exception as e:
            logger.warning("Card send failed, falling back to text: %s", e)

    await msg.reply_text(caption, parse_mode=ParseMode.HTML)


# ──────────────────────────────────────────────────────────────────────────────
# Daily roast job helpers
# ──────────────────────────────────────────────────────────────────────────────

def schedule_daily_roast(app: Application, chat_id: int, hour: int) -> None:
    job_name = f"daily_{chat_id}"
    for job in app.job_queue.get_jobs_by_name(job_name):
        job.schedule_removal()
    app.job_queue.run_daily(
        daily_roast_callback,
        time=datetime.time(hour=hour, minute=0, tzinfo=datetime.timezone.utc),
        chat_id=chat_id,
        name=job_name,
        data={"chat_id": chat_id},
    )
    logger.info("Daily roast scheduled — chat=%s hour=%s UTC", chat_id, hour)


async def daily_roast_callback(context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = context.job.chat_id
    try:
        _, roast_text, _char = pick_roast(chat_id, "universal")
        update_streak(chat_id)
        intros = [
            "☀️ <b>Good morning, degenerates.</b> Today's complimentary roast:\n\n",
            "⚡ <b>Daily degen check-in.</b> You're welcome:\n\n",
            "🌙 <b>End of day reminder</b> that the chart is not your friend:\n\n",
            "🔔 <b>Nintondo Bot daily drop.</b> Unprompted. As it should be:\n\n",
            "📢 <b>Nobody asked, everybody needed it:</b>\n\n",
        ]
        text = random.choice(intros) + roast_text
        await context.bot.send_message(chat_id=chat_id, text=text, parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Error in daily_roast_callback for chat %s", chat_id)


# ──────────────────────────────────────────────────────────────────────────────
# Handlers
# ──────────────────────────────────────────────────────────────────────────────

async def on_member_join(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Welcome roast on join."""
    try:
        result = update.chat_member
        if result is None:
            return

        old_status = result.old_chat_member.status
        new_status = result.new_chat_member.status
        joining = {"member", "restricted", "administrator"}
        leaving = {"left", "kicked", "banned"}

        if old_status not in leaving or new_status not in joining:
            return

        user = result.new_chat_member.user
        if user.is_bot:
            return

        chat_id = result.chat.id

        if is_blacklisted(chat_id, user.id):
            logger.info("Skipping welcome roast — user %s is blacklisted in chat %s", user.id, chat_id)
            return

        _, roast_text, _char = pick_roast(chat_id, "welcome")
        message = inject_name(roast_text, user.id, user.first_name)
        log_roast(chat_id, user.id, user.first_name, "welcome")
        update_streak(chat_id)
        await context.bot.send_message(chat_id=chat_id, text=message, parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Error in on_member_join")


async def on_reply_to_bot(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Reply roast when someone replies to the bot."""
    try:
        msg = update.effective_message
        if msg is None or msg.reply_to_message is None:
            return
        replied_to = msg.reply_to_message.from_user
        if replied_to is None or replied_to.id != context.bot.id:
            return

        user = update.effective_user
        chat_id = update.effective_chat.id
        _, roast_text, _char = pick_roast(chat_id, "reply")
        message = inject_name(roast_text, user.id, user.first_name)
        update_streak(chat_id)
        await msg.reply_text(message, parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Error in on_reply_to_bot")


async def on_reaction(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fire a roast when anyone reacts with 🔥 to any message."""
    try:
        reaction = update.message_reaction
        if not reaction:
            return

        # Detect 🔥 being newly added (not already there before)
        old_emojis = {r.emoji for r in reaction.old_reaction if hasattr(r, "emoji")}
        new_emojis = {r.emoji for r in reaction.new_reaction if hasattr(r, "emoji")}
        if "🔥" not in (new_emojis - old_emojis):
            return

        user = reaction.user
        if not user or user.is_bot:
            return

        chat_id = reaction.chat.id

        # Per-chat rate limit — don't let 🔥 spam the group
        now = time.monotonic()
        if now - _reaction_cooldown.get(chat_id, 0.0) < REACTION_COOLDOWN_SECONDS:
            return
        _reaction_cooldown[chat_id] = now

        _, roast_text, _char = pick_roast(chat_id, "reply")
        message = inject_name(roast_text, user.id, user.first_name)
        update_streak(chat_id)
        await context.bot.send_message(
            chat_id=chat_id,
            text=f"🔥 Ohh someone's feeling brave:\n\n{message}",
            parse_mode=ParseMode.HTML,
        )
    except Exception:
        logger.exception("Error in on_reaction")


async def cmd_roast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /roast [@user] [character]
    Character is optional: mario/pikachu/dk/peach/luigi/bowser/yoshi/link
    """
    try:
        user = update.effective_user
        chat_id = update.effective_chat.id
        msg = update.effective_message
        cooldown = get_cooldown(chat_id)

        # Rate limit
        now = time.monotonic()
        if now - _roast_cooldown.get(user.id, 0.0) < cooldown:
            remaining = int(cooldown - (now - _roast_cooldown[user.id]))
            await msg.reply_text(
                f"Easy tiger. You can /roast again in <b>{remaining}s</b>. "
                f"Use the time to reflect on your life choices.",
                parse_mode=ParseMode.HTML,
            )
            return
        _roast_cooldown[user.id] = now

        # Parse optional character from args
        args = context.args or []
        character_tag: str | None = None
        for arg in args:
            tag = CHARACTER_ALIASES.get(arg.lower().lstrip("@"))
            if tag:
                character_tag = tag
                break

        # Determine target
        target_user = None

        if msg.reply_to_message and msg.reply_to_message.from_user:
            replied = msg.reply_to_message.from_user
            if not replied.is_bot:
                target_user = replied

        if target_user is None and msg.entities:
            for entity in msg.entities:
                if entity.type == "text_mention" and entity.user and not entity.user.is_bot:
                    target_user = entity.user
                    break

        if target_user is not None:
            if is_blacklisted(chat_id, target_user.id):
                await msg.reply_text(
                    f"{mention(target_user.id, target_user.first_name)} has a get-out-of-roast-free card. "
                    f"Respect. Try someone else.",
                    parse_mode=ParseMode.HTML,
                )
                return
            roast_id, roast_text, char_tag = pick_roast(chat_id, "targeted", character_tag)
            plain_text = roast_text.replace("{name}", target_user.first_name)
            message = inject_name(roast_text, target_user.id, target_user.first_name)
            log_roast(chat_id, target_user.id, target_user.first_name, "targeted")
            update_streak(chat_id)
            await send_roast_card(msg, context.bot, target_user.id, target_user.first_name, target_user.username, roast_id, plain_text, char_tag, message)
        else:
            # No target — roast the caller
            roast_id, roast_text, char_tag = pick_roast(chat_id, "universal", character_tag)
            plain_text = roast_text.replace("{name}", user.first_name)
            message = inject_name(roast_text, user.id, user.first_name)
            update_streak(chat_id)
            await send_roast_card(msg, context.bot, user.id, user.first_name, user.username, roast_id, plain_text, char_tag, message)
    except Exception:
        logger.exception("Error in cmd_roast")


async def cmd_roastme(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/roastme — user volunteers themselves."""
    try:
        user = update.effective_user
        chat_id = update.effective_chat.id
        msg = update.effective_message

        # Parse optional character
        args = context.args or []
        character_tag: str | None = None
        for arg in args:
            tag = CHARACTER_ALIASES.get(arg.lower())
            if tag:
                character_tag = tag
                break

        intros = [
            "Someone actually asked for this. Respect the self-awareness:",
            "Voluntary submission received. Processing:",
            "The audacity. The bravery. The terrible financial decisions. Here we go:",
            "You asked. I will deliver. The court is in session:",
            "Sir/ma'am, you typed this yourself. That's on you:",
        ]

        roast_id, roast_text, char_tag = pick_roast(chat_id, "targeted", character_tag)
        plain_text = roast_text.replace("{name}", user.first_name)
        roast = inject_name(roast_text, user.id, user.first_name)
        intro = random.choice(intros)
        log_roast(chat_id, user.id, user.first_name, "roastme")
        update_streak(chat_id)
        await send_roast_card(msg, context.bot, user.id, user.first_name, user.username, roast_id, plain_text, char_tag, f"{intro}\n\n{roast}")
    except Exception:
        logger.exception("Error in cmd_roastme")


async def cmd_battle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /battle @user1 @user2
    Also works with reply (caller vs replied-to user).
    """
    try:
        msg = update.effective_message
        chat_id = update.effective_chat.id
        caller = update.effective_user

        # Collect candidates from mentions and reply
        candidates = []

        if msg.reply_to_message and msg.reply_to_message.from_user:
            u = msg.reply_to_message.from_user
            if not u.is_bot and u.id != caller.id:
                candidates.append(u)

        if msg.entities:
            for entity in msg.entities:
                if entity.type == "text_mention" and entity.user and not entity.user.is_bot:
                    if entity.user.id not in {c.id for c in candidates}:
                        candidates.append(entity.user)

        # If only one target found, battle caller vs target
        if len(candidates) == 0:
            await msg.reply_text(
                "You need to mention two users or reply to someone. "
                "Try: <code>/battle @user1 @user2</code>",
                parse_mode=ParseMode.HTML,
            )
            return

        if len(candidates) == 1:
            fighters = [caller, candidates[0]]
        else:
            fighters = candidates[:2]

        f1, f2 = fighters[0], fighters[1]

        # Pick two different roasts
        _, roast1_text, _char1 = pick_roast(chat_id, "targeted")
        _, roast2_text, _char2 = pick_roast(chat_id, "targeted")

        r1 = inject_name(roast1_text, f1.id, f1.first_name)
        r2 = inject_name(roast2_text, f2.id, f2.first_name)

        winner, loser = random.sample([f1, f2], 2)
        verdict_template = random.choice(BATTLE_WINNER_LINES)
        verdict = verdict_template.format(
            winner=mention(winner.id, winner.first_name),
            loser=mention(loser.id, loser.first_name),
        )

        log_roast(chat_id, f1.id, f1.first_name, "battle")
        log_roast(chat_id, f2.id, f2.first_name, "battle")
        update_streak(chat_id)

        text = (
            f"⚔️ <b>ROAST BATTLE</b> ⚔️\n\n"
            f"🔴 {mention(f1.id, f1.first_name)}: {r1}\n\n"
            f"🔵 {mention(f2.id, f2.first_name)}: {r2}\n\n"
            f"━━━━━━━━━━━━━━\n"
            f"🏆 {verdict}"
        )
        await msg.reply_text(text, parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Error in cmd_battle")


async def cmd_leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/leaderboard — most roasted users in this chat."""
    try:
        chat_id = update.effective_chat.id
        with get_conn() as conn:
            rows = conn.execute(
                """SELECT target_user_id, target_name, COUNT(*) as cnt
                   FROM roast_log WHERE chat_id = ?
                   GROUP BY target_user_id ORDER BY cnt DESC LIMIT 10""",
                (chat_id,),
            ).fetchall()

        if not rows:
            await update.effective_message.reply_text(
                "No one has been roasted yet. Type /roast @someone and fix that.",
                parse_mode=ParseMode.HTML,
            )
            return

        medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
        lines = ["🏆 <b>HALL OF SHAME — Most Roasted</b> 🏆\n"]
        for i, row in enumerate(rows):
            name = html.escape(row["target_name"] or "Unknown")
            lines.append(f"{medals[i]}  {name} — <b>{row['cnt']}</b> roast{'s' if row['cnt'] != 1 else ''}")

        lines.append("\n<i>A prestigious list. Truly something to tell your grandchildren.</i>")
        await update.effective_message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Error in cmd_leaderboard")


async def cmd_roaststreak(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/roaststreak — consecutive active days."""
    try:
        chat_id = update.effective_chat.id
        settings = get_chat_settings(chat_id)
        streak = settings.get("streak", 0)
        last = settings.get("last_active_date", "never")

        if streak == 0:
            msg = "This chat has zero roast streak. Truly dire. Someone do something."
        elif streak == 1:
            msg = "🔥 <b>1 day streak.</b> You started. Now don't stop. Yesterday you had nothing. You still basically have nothing but it's a start."
        elif streak < 7:
            msg = f"🔥 <b>{streak} day streak.</b> We're building something here. Something stupid, but something."
        elif streak < 30:
            msg = f"🔥🔥 <b>{streak} day streak.</b> This community roasts with commitment. The portfolio may be red but the streak is alive."
        else:
            msg = f"🔥🔥🔥 <b>{streak} day streak.</b> Absolutely unhinged levels of dedication. Someone call Guinness. Or a therapist. Either works."

        await update.effective_message.reply_text(
            f"{msg}\n\n<i>Last active: {last}</i>",
            parse_mode=ParseMode.HTML,
        )
    except Exception:
        logger.exception("Error in cmd_roaststreak")


# ──────────────────────────────────────────────────────────────────────────────
# Inline mode
# ──────────────────────────────────────────────────────────────────────────────

async def handle_inline_query(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Inline query handler — users type @nintondobot [character] in any chat.
    If the query is a card URL (from the Mini App share button), returns an
    InlineQueryResultPhoto so the card image is sent to the selected chat.
    Otherwise returns 5 roast text options.
    """
    try:
        query = update.inline_query
        if query is None:
            return

        user = query.from_user
        query_text = (query.query or '').strip()

        # ── Card share (from Mini App "Send to Chat" button) ──────────────────
        # Format: "card:userId:roastId:name:charTag"
        # Bot reconstructs the card URL and answers instantly with
        # InlineQueryResultPhoto — no slow pre-upload needed.
        if query_text.startswith('card:'):
            parts = query_text.split(':', 4)
            if len(parts) == 5:
                _, uid, rid, name, char = parts
            else:
                uid, rid, name, char = '0', 'r000', 'anon', 'general'

            card_url = f"{CARD_API_URL}/api/card?{urllib.parse.urlencode({'u': uid, 'r': rid, 'n': name, 'c': char})}"
            logger.info(">>> INLINE CARD SHARE — user=%s card_url=%s", user.id, card_url)

            result = InlineQueryResultPhoto(
                id=str(uuid.uuid4()),
                photo_url=card_url,
                thumbnail_url=f"{CARD_API_URL}/characters/{char}.png",
                photo_width=540,
                photo_height=960,
                title='🎮 Your Nintondo Roast Card',
                caption='🎮 My Nintondo Roast Card\n\n$NINTONDO on TON | via @nintondobot',
            )
            await query.answer([result], cache_time=0, is_personal=True)
            logger.info(">>> Inline answer sent instantly")
            return

        # ── Standard inline roast results ─────────────────────────────────────
        query_lower = query_text.lower()

        # Parse optional character from the query text
        character_tag: str | None = None
        for alias, tag in CHARACTER_ALIASES.items():
            if alias in query_lower.split():
                character_tag = tag
                break

        # Use a negative user-id namespace so recently_used doesn't clash with real chats
        pseudo_chat_id = -(user.id)

        results: list[InlineQueryResultArticle] = []
        seen_ids: set[int] = set()

        for i in range(5):
            category = 'universal' if i % 2 == 0 else 'targeted'
            roast_id, roast_text, _char = pick_roast(pseudo_chat_id, category, character_tag)
            if roast_id in seen_ids:
                continue
            seen_ids.add(roast_id)

            text = inject_name(roast_text, user.id, user.first_name)
            full_text = f"{text}\n\n<i>via @nintondobot · $NINTONDO on TON</i>"

            # Plain-text preview for the result tile
            preview = roast_text.replace('{name}', user.first_name)
            title = (preview[:72] + '…') if len(preview) > 72 else preview

            results.append(
                InlineQueryResultArticle(
                    id=str(uuid.uuid4()),
                    title=title,
                    input_message_content=InputTextMessageContent(
                        message_text=full_text,
                        parse_mode=ParseMode.HTML,
                    ),
                    description='🔥 Tap to drop this roast in chat',
                )
            )

        await query.answer(results, cache_time=30, is_personal=True)
    except Exception:
        logger.exception("Error in handle_inline_query")


# ──────────────────────────────────────────────────────────────────────────────
# Admin commands
# ──────────────────────────────────────────────────────────────────────────────

def admin_only(func):
    """Decorator: reject non-admins."""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        user = update.effective_user
        if ADMIN_USER_ID is None or user.id != ADMIN_USER_ID:
            await update.effective_message.reply_text(
                "Admin only, ser. Nice try though."
            )
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper


@admin_only
async def cmd_addroast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /addroast <category> <text>
    Category: welcome | reply | targeted | universal
    Optionally prefix text with [character] e.g. /addroast reply [mario] Some roast text
    """
    try:
        msg = update.effective_message
        args = context.args or []
        if len(args) < 2:
            await msg.reply_text(
                "Usage: <code>/addroast &lt;category&gt; your roast text here</code>\n"
                "Optional: <code>/addroast reply [mario] text here</code>",
                parse_mode=ParseMode.HTML,
            )
            return

        valid_categories = {"welcome", "reply", "targeted", "universal"}
        category = args[0].lower()
        if category not in valid_categories:
            await msg.reply_text(
                f"Invalid category. Use: {', '.join(valid_categories)}"
            )
            return

        remaining = " ".join(args[1:])
        character_tag = "general"
        if remaining.startswith("["):
            end = remaining.find("]")
            if end != -1:
                tag_candidate = remaining[1:end].lower()
                canonical = CHARACTER_ALIASES.get(tag_candidate)
                if canonical:
                    character_tag = canonical
                    remaining = remaining[end + 1:].strip()

        if not remaining:
            await msg.reply_text("Roast text can't be empty, ser.")
            return

        with get_conn() as conn:
            cur = conn.execute(
                "INSERT OR IGNORE INTO roasts (text, category, character_tag) VALUES (?, ?, ?)",
                (remaining, category, character_tag),
            )
            conn.commit()
            if cur.rowcount:
                total = conn.execute("SELECT COUNT(*) FROM roasts").fetchone()[0]
                await msg.reply_text(
                    f"✅ Roast added.\n"
                    f"Category: <code>{category}</code>  Character: <code>{character_tag}</code>\n"
                    f"Total roasts in DB: <b>{total}</b>\n\n"
                    f"<i>{html.escape(remaining)}</i>",
                    parse_mode=ParseMode.HTML,
                )
            else:
                await msg.reply_text("That roast already exists (duplicate text). Try a different one.")
    except Exception:
        logger.exception("Error in cmd_addroast")


@admin_only
async def cmd_unroast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/unroast @user — toggle welcome-roast blacklist for a user."""
    try:
        msg = update.effective_message
        chat_id = update.effective_chat.id
        target_user = None

        if msg.reply_to_message and msg.reply_to_message.from_user:
            target_user = msg.reply_to_message.from_user
        elif msg.entities:
            for entity in msg.entities:
                if entity.type == "text_mention" and entity.user:
                    target_user = entity.user
                    break

        if target_user is None:
            await msg.reply_text(
                "Reply to a user's message or mention them: <code>/unroast @user</code>",
                parse_mode=ParseMode.HTML,
            )
            return

        with get_conn() as conn:
            exists = conn.execute(
                "SELECT 1 FROM blacklist WHERE chat_id = ? AND user_id = ?",
                (chat_id, target_user.id),
            ).fetchone()

            if exists:
                conn.execute(
                    "DELETE FROM blacklist WHERE chat_id = ? AND user_id = ?",
                    (chat_id, target_user.id),
                )
                conn.commit()
                await msg.reply_text(
                    f"{mention(target_user.id, target_user.first_name)} is back on the roast list. "
                    f"No more immunity. Welcome back to the suffering.",
                    parse_mode=ParseMode.HTML,
                )
            else:
                conn.execute(
                    "INSERT OR IGNORE INTO blacklist (chat_id, user_id) VALUES (?, ?)",
                    (chat_id, target_user.id),
                )
                conn.commit()
                await msg.reply_text(
                    f"{mention(target_user.id, target_user.first_name)} has been given roast immunity. "
                    f"They will no longer receive welcome roasts. Lucky them.",
                    parse_mode=ParseMode.HTML,
                )
    except Exception:
        logger.exception("Error in cmd_unroast")


@admin_only
async def cmd_setcooldown(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/setcooldown <seconds> — set the /roast rate limit for this chat."""
    try:
        msg = update.effective_message
        chat_id = update.effective_chat.id
        args = context.args or []

        if not args or not args[0].isdigit():
            await msg.reply_text(
                "Usage: <code>/setcooldown 30</code> (seconds between /roast uses per user)",
                parse_mode=ParseMode.HTML,
            )
            return

        seconds = max(5, min(int(args[0]), 3600))  # clamp 5s–1hr
        with get_conn() as conn:
            conn.execute("INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)", (chat_id,))
            conn.execute(
                "UPDATE chat_settings SET cooldown_seconds = ? WHERE chat_id = ?",
                (seconds, chat_id),
            )
            conn.commit()

        await msg.reply_text(
            f"✅ /roast cooldown set to <b>{seconds}s</b> per user.\n"
            f"{'That is dangerously fast. Godspeed.' if seconds < 15 else 'Sensible.' if seconds < 60 else 'Very patient. Very mature.'}",
            parse_mode=ParseMode.HTML,
        )
    except Exception:
        logger.exception("Error in cmd_setcooldown")


@admin_only
async def cmd_dailyroast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /dailyroast on [hour] — enable daily roast at HH:00 UTC (default 12)
    /dailyroast off        — disable
    """
    try:
        msg = update.effective_message
        chat_id = update.effective_chat.id
        args = context.args or []

        if not args:
            await msg.reply_text(
                "Usage:\n"
                "<code>/dailyroast on 12</code> — enable at 12:00 UTC\n"
                "<code>/dailyroast off</code> — disable",
                parse_mode=ParseMode.HTML,
            )
            return

        action = args[0].lower()
        if action not in ("on", "off"):
            await msg.reply_text("Use <code>on</code> or <code>off</code>.", parse_mode=ParseMode.HTML)
            return

        with get_conn() as conn:
            conn.execute("INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)", (chat_id,))

            if action == "off":
                conn.execute(
                    "UPDATE chat_settings SET daily_roast_enabled = 0 WHERE chat_id = ?",
                    (chat_id,),
                )
                conn.commit()
                job_name = f"daily_{chat_id}"
                for job in context.application.job_queue.get_jobs_by_name(job_name):
                    job.schedule_removal()
                await msg.reply_text(
                    "✅ Daily roast disabled. The chat will have to survive on its own cringe.",
                )
            else:
                hour = 12
                if len(args) > 1 and args[1].isdigit():
                    hour = max(0, min(int(args[1]), 23))
                conn.execute(
                    "UPDATE chat_settings SET daily_roast_enabled = 1, daily_roast_hour = ? WHERE chat_id = ?",
                    (hour, chat_id),
                )
                conn.commit()
                schedule_daily_roast(context.application, chat_id, hour)
                await msg.reply_text(
                    f"✅ Daily roast enabled at <b>{hour:02d}:00 UTC</b> every day.\n"
                    f"Nobody asked. Everyone will receive it anyway.",
                    parse_mode=ParseMode.HTML,
                )
    except Exception:
        logger.exception("Error in cmd_dailyroast")


@admin_only
async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Admin-only stats."""
    try:
        chat_id = update.effective_chat.id
        with get_conn() as conn:
            total_roasts = conn.execute("SELECT COUNT(*) FROM roasts").fetchone()[0]
            cat_rows = conn.execute(
                "SELECT category, COUNT(*) as cnt FROM roasts GROUP BY category ORDER BY category"
            ).fetchall()
            used_chat = conn.execute(
                "SELECT COUNT(*) FROM recently_used WHERE chat_id = ?", (chat_id,)
            ).fetchone()[0]
            total_fired = conn.execute(
                "SELECT COUNT(*) FROM roast_log WHERE chat_id = ?", (chat_id,)
            ).fetchone()[0]
            settings = get_chat_settings(chat_id)

        lines = [
            "<b>📊 Nintondo Bot Stats</b>\n",
            f"Total roasts in DB: <code>{total_roasts}</code>",
        ]
        for row in cat_rows:
            lines.append(f"  {row['category']}: {row['cnt']}")
        lines.append(f"\nThis chat:")
        lines.append(f"  Roasts tracked (last 50): <code>{used_chat}</code>")
        lines.append(f"  Total roasts fired (logged): <code>{total_fired}</code>")
        lines.append(f"  Cooldown: <code>{settings.get('cooldown_seconds', 30)}s</code>")
        lines.append(f"  Daily roast: <code>{'on' if settings.get('daily_roast_enabled') else 'off'}</code> @ <code>{settings.get('daily_roast_hour', 12):02d}:00 UTC</code>")
        lines.append(f"  Streak: <code>{settings.get('streak', 0)} days</code>")

        await update.effective_message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Error in cmd_stats")


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "🎮 <b>Nintondo Bot</b> — the community's self-appointed roast machine.\n\n"
        "<b>Commands:</b>\n"
        "  /roast @user [character] — roast someone by name\n"
        "  /roast (reply to a message) — roast whoever you replied to\n"
        "  /roastme — volunteer yourself. brave.\n"
        "  /battle @user1 @user2 — pit two people against each other\n"
        "  /leaderboard — hall of shame: most roasted members\n"
        "  /roaststreak — see the chat's daily roast streak\n"
        "  /help — this message\n\n"
        "<b>Inline mode:</b>\n"
        "  Type <code>@nintondobot</code> in any chat to drop a roast anywhere.\n"
        "  Add a character name to filter: <code>@nintondobot mario</code>\n\n"
        "<b>Characters:</b>\n"
        "  mario · pikachu · dk · peach · luigi · bowser · yoshi · link\n"
        "  wario · toad · kirby · samus · fox · ganondorf · falcon\n\n"
        "<b>Passive:</b>\n"
        "  React to any bot message with 🔥 for a bonus roast.\n"
        "  New members get automatically welcomed. Loudly.\n\n"
        "<i>18+. All roasts are parody. Thick skin recommended. Not financial advice. "
        "Not any kind of advice actually.</i>"
    )
    user = update.effective_user
    base = CARD_API_URL or "https://nintondo-59r8.vercel.app"
    p: dict[str, str] = {"uid": str(user.id), "fn": user.first_name or ""}
    if user.username:
        p["un"] = user.username
    webapp_url = f"{base}?{urllib.parse.urlencode(p)}"
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("🔥 Get Your Roast Card", web_app=WebAppInfo(url=webapp_url)),
    ]])
    await update.effective_message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await cmd_start(update, context)


async def cmd_app(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/app — open the roast card miniapp."""
    user = update.effective_user
    base = CARD_API_URL or "https://nintondo-59r8.vercel.app"
    p: dict[str, str] = {"uid": str(user.id), "fn": user.first_name or ""}
    if user.username:
        p["un"] = user.username
    webapp_url = f"{base}?{urllib.parse.urlencode(p)}"
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("🔥 Get Your Roast Card", web_app=WebAppInfo(url=webapp_url)),
    ]])
    await update.effective_message.reply_text(
        "Tap below to get your personalised degen card 👇",
        reply_markup=keyboard,
    )


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error("Unhandled exception", exc_info=context.error)


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN is not set. Copy .env.example to .env and fill in your token from @BotFather."
        )

    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        init_db(conn)

    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM roasts").fetchone()[0]
    logger.info("Nintondo Bot starting — %s roasts loaded from %s", total, DB_PATH)
    if total == 0:
        logger.warning("No roasts found! Run: python seed_roasts.py")

    app = Application.builder().token(BOT_TOKEN).build()

    # Passive handlers
    app.add_handler(ChatMemberHandler(on_member_join, ChatMemberHandler.CHAT_MEMBER))
    app.add_handler(MessageHandler(filters.REPLY & ~filters.COMMAND, on_reply_to_bot))
    app.add_handler(MessageReactionHandler(on_reaction))

    # User commands
    app.add_handler(CommandHandler("roast", cmd_roast))
    app.add_handler(CommandHandler("roastme", cmd_roastme))
    app.add_handler(CommandHandler("battle", cmd_battle))
    app.add_handler(CommandHandler("leaderboard", cmd_leaderboard))
    app.add_handler(CommandHandler("roaststreak", cmd_roaststreak))
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("app", cmd_app))

    # Admin commands
    app.add_handler(CommandHandler("stats", cmd_stats))
    app.add_handler(CommandHandler("addroast", cmd_addroast))
    app.add_handler(CommandHandler("unroast", cmd_unroast))
    app.add_handler(CommandHandler("setcooldown", cmd_setcooldown))
    app.add_handler(CommandHandler("dailyroast", cmd_dailyroast))

    app.add_handler(InlineQueryHandler(handle_inline_query))
    app.add_error_handler(error_handler)

    # Restore daily roast jobs for any chats that had it enabled
    with get_conn() as conn:
        enabled_chats = conn.execute(
            "SELECT chat_id, daily_roast_hour FROM chat_settings WHERE daily_roast_enabled = 1"
        ).fetchall()
    for row in enabled_chats:
        schedule_daily_roast(app, row["chat_id"], row["daily_roast_hour"])
        logger.info("Restored daily roast job for chat %s at %02d:00 UTC", row["chat_id"], row["daily_roast_hour"])

    logger.info("Polling started. Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
