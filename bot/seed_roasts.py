"""
seed_roasts.py — Populate the Nintondo Bot roast database.
Run standalone: python seed_roasts.py
Safe to re-run: INSERT OR IGNORE handles deduplication.
"""

import os
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "data/nintondo.db")


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS roasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            character_tag TEXT,
            weight INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_roasts_category ON roasts(category);
        CREATE INDEX IF NOT EXISTS idx_roasts_character ON roasts(character_tag);

        CREATE TABLE IF NOT EXISTS recently_used (
            chat_id INTEGER NOT NULL,
            roast_id INTEGER NOT NULL,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (chat_id, roast_id)
        );

        CREATE INDEX IF NOT EXISTS idx_recent_chat_time ON recently_used(chat_id, used_at);

        CREATE TABLE IF NOT EXISTS roast_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            target_user_id INTEGER NOT NULL,
            target_name TEXT,
            category TEXT,
            roasted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_log_chat_target ON roast_log(chat_id, target_user_id);

        CREATE TABLE IF NOT EXISTS blacklist (
            chat_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            PRIMARY KEY (chat_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS chat_settings (
            chat_id INTEGER PRIMARY KEY,
            cooldown_seconds INTEGER DEFAULT 30,
            daily_roast_enabled INTEGER DEFAULT 0,
            daily_roast_hour INTEGER DEFAULT 12,
            streak INTEGER DEFAULT 0,
            last_active_date TEXT
        );
    """)
    conn.commit()


# (text, category, character_tag)
# Categories: welcome | reply | targeted | universal
# Character tags: mario | pikachu | dk | peach | luigi | bowser | yoshi | link | general
# {name} is replaced at runtime with a Telegram mention of the user's first name.

ROASTS = [
    # ─────────────────────────────────────────────────────────────
    # WELCOME — ~80 roasts
    # ─────────────────────────────────────────────────────────────

    # mario / welcome
    ("Welcome, {name}. Mario says hi from the IRS audit waiting room — he's been there since 2019 and he wants you to know the coins won't save you.", "welcome", "mario"),
    ("Oh great, {name} crawled out of the sewers. Mario wants you to know that buying coins at ATH is not the same thing as finding a star.", "welcome", "mario"),
    ("{name} has entered the chat. Mario applauds — between lines, on a sticky bathroom counter somewhere in Mushroom Kingdom.", "welcome", "mario"),
    ("Look who showed up: {name}. Mario's been flipping meme coins since 2021 and still can't afford a second pair of overalls. Welcome to the club.", "welcome", "mario"),
    ("{name} joins the group. Mario nods solemnly from the casino floor where he just used the last of Peach's grocery money on a 100x leverage long.", "welcome", "mario"),
    ("Welcome {name}. Mario traded his plumbing tools for a Ledger wallet in 2022 and has not had hot water since. You'll fit right in.", "welcome", "mario"),
    ("{name} is here. Mario whispers 'have fun staying poor' from the corner of a Wendy's at 3am, wearing yesterday's shirt.", "welcome", "mario"),
    ("New member alert: {name}. Mario once called the local top by mortgaging the Mushroom Kingdom castle. He's proud of you for finding us.", "welcome", "mario"),
    ("{name} slides in. Mario's tax attorney says hi and also please stop calling — Mario does not actually have any money left.", "welcome", "mario"),
    ("Welcome to the degeneracy, {name}. Mario says this community changed his life, mostly for the worse, but the vibes are immaculate.", "welcome", "mario"),

    # pikachu / welcome
    ("ZAP — {name} arrived. Pikachu's been shocking himself in the shower trying to generate enough electricity to pay his exchange withdrawal fees.", "welcome", "pikachu"),
    ("{name} joined. Pikachu just relapsed again — six months sober from leverage trading, now he's got sixteen tabs open and a liquidation notice.", "welcome", "pikachu"),
    ("Welcome {name}. Pikachu says you remind him of his paper hands — quick to appear, quicker to fold at the first 5% dip.", "welcome", "pikachu"),
    ("Oh no, {name} found us. Pikachu's therapist told him to stop spending time in crypto Telegrams. He did not listen. Neither will you.", "welcome", "pikachu"),
    ("{name} enters the building. Pikachu is currently arguing with a scammer in his DMs who he is 80% sure is a scammer but 20% thinks might be real.", "welcome", "pikachu"),
    ("Welcome {name}. Pikachu spent his electricity bill on gas fees last week and is using a potato to stay warm. Community is everything.", "welcome", "pikachu"),
    ("{name} is in the chat. Pikachu tried to hedge his portfolio with Pokéballs — they're not worth more than the bag he's already holding.", "welcome", "pikachu"),
    ("Fresh meat: {name}. Pikachu sent his seed phrase to 'Binance Support' twice because he believed them twice. Don't be like Pikachu. Actually no, do — we love you here.", "welcome", "pikachu"),

    # dk / welcome
    ("{name} joined. Donkey Kong is shaking his protein tub at you — it's empty, just like his futures account after he went 50x long on a Thursday.", "welcome", "dk"),
    ("Welcome {name}. DK benches 300kg and holds 0 coins because he panic-sold everything to buy more pre-workout. Inspirational.", "welcome", "dk"),
    ("Oh look, {name} arrived. DK spent his rent on leverage again. His landlord is also a gorilla. It's complicated.", "welcome", "dk"),
    ("{name} is here, babes. Donkey Kong sends his regards from the gym, where he is doing squats and refusing to check his portfolio because he cannot handle what he'll see.", "welcome", "dk"),
    ("New ape unlocked: {name}. DK's financial advisor is a barrel and it gives better advice than the TG callers he's been following.", "welcome", "dk"),
    ("{name} pulls up. DK opened a 100x short at the local bottom and blew his account in eleven minutes. Welcome — you're in excellent company.", "welcome", "dk"),

    # peach / welcome
    ("{name} graced us with their presence. Peach just got off a yacht in Dubai and is wondering why her portfolio is down 90% — the answer is us.", "welcome", "peach"),
    ("Oh look, {name}. Peach has seven wallets, four sugar daddies, and still managed to lose money on every launch. Welcome to the group.", "welcome", "peach"),
    ("{name} has arrived. Peach says you look like someone who clicks every airdrop link without reading it. She means that as a compliment.", "welcome", "peach"),
    ("Welcome {name}. Peach is currently negotiating with a bridge protocol that rugpulled her — the negotiation is not going well.", "welcome", "peach"),
    ("{name} has entered. Princess Peach liquidated her entire castle NFT collection to buy into a launch that launched into the ground.", "welcome", "peach"),

    # luigi / welcome
    ("{name} joins! Luigi is crying in the corner because he's been in this group for 8 months and still hasn't made his first million. Second place forever.", "welcome", "luigi"),
    ("Welcome {name}. Luigi has been 'almost there' with his portfolio since 2020. He's fine. He's totally fine. He's in therapy.", "welcome", "luigi"),
    ("{name} is here. Luigi says you look like a future top-buyer, and he says that with love, because he IS a future top-buyer, every single time.", "welcome", "luigi"),
    ("Oh nice, {name}. Luigi wanted to join earlier but waited to see if the price came down first. It did not come down. This is his life.", "welcome", "luigi"),
    ("{name} rolled in. Luigi's been in the shadow of Mario's portfolio for so long he started his own group called 'Year of Luigi' — it rug pulled.", "welcome", "luigi"),

    # bowser / welcome
    ("Seven notifications, all from child support: {name} just joined. Welcome — Bowser says you remind him of his seventh ex-wife, and he means that warmly.", "welcome", "bowser"),
    ("{name} is here. Bowser just got out of a six-month rehab stint for adrenaline trading and immediately opened Telegram. Recovery is a journey.", "welcome", "bowser"),
    ("Welcome {name}. Bowser's seven kids each have a different Telegram account and he's still funding all their degen habits. A king provides.", "welcome", "bowser"),
    ("{name} joins the chaos. Bowser tried to hostile-take-over a DEX last week and now he's banned from three chains and one Discord server.", "welcome", "bowser"),
    ("Oh damn, {name} is here. Bowser sends his regards — he's currently on hold with his bank explaining why he transferred his mortgage to a TON wallet.", "welcome", "bowser"),

    # yoshi / welcome
    ("{name} licked their way into the chat, just like Yoshi licks every new token launch before doing any research. Welcome, fren.", "welcome", "yoshi"),
    ("Welcome {name}. Yoshi has eaten so many bad tokens his stomach lining is essentially a dead portfolio. He still has good vibes though.", "welcome", "yoshi"),
    ("{name} stomped in. Yoshi sold his eggs to fund a meme coin presale. The eggs were worth more. He is at peace with this.", "welcome", "yoshi"),
    ("{name} arrived. Yoshi doesn't understand what leverage means but he uses it anyway because it sounds powerful. He's lost four accounts this year.", "welcome", "yoshi"),
    ("New arrival: {name}. Yoshi's tongue has tasted a hundred launches. It has tasted profit on exactly two of them. He is still licking.", "welcome", "yoshi"),

    # link / welcome
    ("{name} just walked in, silent as always. Link hasn't said a word since he lost his portfolio in 2022 — some men process grief differently.", "welcome", "link"),
    ("Welcome {name}. Link has been searching for his financial freedom across three bear markets. Spoiler: it was in a rug vault the whole time.", "welcome", "link"),
    ("{name} is here. Link tried to explain his trading strategy to Zelda and she broke up with him via a letter left on the kitchen table.", "welcome", "link"),
    ("Oh look who joined: {name}. Link bought the dip six times and every time the dip kept dipping. A true hero stays the course.", "welcome", "link"),
    ("{name} enters. Link is too shy to speak in group chats, so he just reacts with 👍 to everything and quietly bleeds out on his positions.", "welcome", "link"),

    # general / welcome
    ("Welcome {name}. You've joined the finest collection of paper hands, bag holders, and leverage addicts this side of the blockchain.", "welcome", "general"),
    ("{name} has arrived. Pull up a chair, check your stop-losses are off, and prepare to learn what true conviction actually costs.", "welcome", "general"),
    ("Look at that — {name} stumbled in. The good news: you found us. The bad news: finding us rarely improves anyone's financial situation.", "welcome", "general"),
    ("Welcome {name}. We don't know if this is your first rodeo or your fifteenth, but statistically, you're going to lose money here. We'll be here for it.", "welcome", "general"),
    ("{name} joins the circus. The exits are clearly marked and never used by anyone who's been here longer than a week.", "welcome", "general"),
    ("Ah, {name}. Fresh off the boat, wallet full of hope. Give it three weeks.", "welcome", "general"),
    ("New recruit: {name}. You were warned by at least one person in your life not to get into this. You are here anyway. Respect.", "welcome", "general"),
    ("{name} is in. No pressure, but the last ten people who joined right before a pump all paper-handed it. Over to you, king.", "welcome", "general"),
    ("Welcome {name}. The group psychologically cannot afford another paper-handed new member, but here we are, doors open.", "welcome", "general"),
    ("{name} just walked into the most prestigious broke-person networking event on the TON chain. Enjoy your stay.", "welcome", "general"),
    ("Alert: {name} detected. Sir, this is a meme coin community. Yes we know. Yes we're still here. You will be too.", "welcome", "general"),
    ("{name} found us. The anon dev sends his congratulations and will shortly be unavailable as he takes a 'vacation'.", "welcome", "general"),
    ("Oh, {name}. You're going to look back at this moment someday — either as the beginning of something great or as the day it all went wrong. Flip a coin.", "welcome", "general"),
    ("Welcome {name}. Your portfolio is about to get an education that no university would dare offer.", "welcome", "general"),
    ("{name} joins. Some people find God. Some find therapy. You found this Telegram group. Same energy.", "welcome", "general"),
    ("Banger welcome to {name}. You've found the support group where everyone is going through it and nobody admits it until 2am.", "welcome", "general"),
    ("{name} arrived. The chart is doing something unhinged right now but that's not important. What's important is you're here with us. 🫡", "welcome", "general"),
    ("Ladies and degenerates, {name} has entered the arena. May your conviction outlast your liquidity.", "welcome", "general"),
    ("Welcome to the madhouse, {name}. We have bad calls, worse timing, and somehow the best community on this chain.", "welcome", "general"),
    ("{name} slides in. Quick heads up: at least 40% of the people in this chat are currently losing money and acting like they aren't.", "welcome", "general"),

    # ─────────────────────────────────────────────────────────────
    # REPLY — ~80 roasts
    # ─────────────────────────────────────────────────────────────

    # mario / reply
    ("Mario wants me to remind you, {name}, that talking to a bot instead of a real person is technically the healthiest relationship in this group.", "reply", "mario"),
    ("{name}, the plumber is tired. Mario has heard bad takes all day and yours just made the leaderboard. Congratulations.", "reply", "mario"),
    ("Mario reviewed your message, {name}, and his official response is: this is why the coins are red.", "reply", "mario"),
    ("{name} that's cute. Mario used to think like that too, right before he lost a third of his net worth on a Tuesday.", "reply", "mario"),
    ("Mario says: {name}, if you put that energy into finding liquidity instead of replying to a bot, maybe the chart goes up. Just a thought.", "reply", "mario"),
    ("{name}, Mario has been in more pipes than you've had profitable trades. He knows a bad exit when he sees one.", "reply", "mario"),
    ("Oh {name}. Mario once believed in projects too. Then he read a whitepaper. Then he read another one. None of them paid his heating bill.", "reply", "mario"),
    ("Mario is nodding, {name}. He nods a lot lately. It's how he copes. He wants you to know your message was felt.", "reply", "mario"),

    # pikachu / reply
    ("{name}, Pikachu's been in a bad market cycle for three years and he's still here replying to group chats. You two are basically twins.", "reply", "pikachu"),
    ("Pikachu is shaking his head at you, {name}. Not because you're wrong. Because you're right in the most painful way.", "reply", "pikachu"),
    ("{name}, Pikachu says if you spent as much energy on your wallet as you do on this chat, you'd be retired. He includes himself in that criticism.", "reply", "pikachu"),
    ("Bzzt. {name}, Pikachu's analysis of your message is: mid. His portfolio is also mid. You'll get along fine.", "reply", "pikachu"),
    ("{name}, Pikachu relapsed last night and bought more. He doesn't regret it. He will regret it. He says hi.", "reply", "pikachu"),
    ("Pikachu acknowledges your contribution, {name}. He wanted me to say 'Pika pika' but I translated that to: check your leverage.", "reply", "pikachu"),

    # dk / reply
    ("DK has reviewed your message, {name}. His response is a guttural chest-pound, which I'm interpreting as: you've got bigger problems than the chart.", "reply", "dk"),
    ("{name}, Donkey Kong is on his fifth pre-workout and third failed leverage trade of the day. He says your energy is familiar.", "reply", "dk"),
    ("Big ape energy, {name}. DK respects it. DK also blew a six-figure account last month, so calibrate your respect accordingly.", "reply", "dk"),
    ("{name}, DK says only someone who's never held a 3x bag through a 90% drawdown talks like that. He means it as a rite of passage.", "reply", "dk"),
    ("Donkey Kong does not reply to messages. He just throws barrels. {name}, consider this your barrel.", "reply", "dk"),

    # peach / reply
    ("{name}, Peach is impressed. Mostly by the audacity. The yacht isn't going to pay for itself with vibes but at least you've got those.", "reply", "peach"),
    ("Princess Peach read your message, {name}, and she wants you to know she's dealt with worse — seven of them, actually, and they all had Discord servers.", "reply", "peach"),
    ("{name}, Peach's fourth sugar daddy this year said the same thing and somehow he was also wrong. She sends love.", "reply", "peach"),
    ("Peach has been kidnapped, rescued, and rugpulled more times than she can count, {name}. Your message barely registers on her suffering scale.", "reply", "peach"),

    # luigi / reply
    ("{name}, Luigi is taking notes. He takes notes on everything. He has seventeen notebooks. Zero profitable trades. He's still taking notes.", "reply", "luigi"),
    ("Luigi says same, {name}. Whatever you said — same. He's been saying same since 2020 and nothing has improved but his coping mechanisms.", "reply", "luigi"),
    ("{name}, Luigi has been second place his whole life. He sees you heading for third and wants you to know there's a support group.", "reply", "luigi"),
    ("Luigi resonates, {name}. He also wants you to know that resonating with this bot at midnight is a choice you made.", "reply", "luigi"),

    # bowser / reply
    ("{name}, Bowser has fourteen people depending on him financially and still made time to read your message. He says touch grass.", "reply", "bowser"),
    ("Bowser's lawyers have reviewed your statement, {name}, and they are advising him not to comment but he's going to anyway: that's a terrible idea.", "reply", "bowser"),
    ("{name}, Bowser has been banned from four DeFi protocols and two countries. He's heard worse. He's also done worse. You're fine.", "reply", "bowser"),
    ("Bowser says {name}, nothing you say in this chat will ever be as unhinged as his child support payment history. Relax.", "reply", "bowser"),

    # yoshi / reply
    ("{name}, Yoshi licked that narrative in Q1 and it tasted terrible. He still ate it. He eats everything. He has no regrets. He should have regrets.", "reply", "yoshi"),
    ("Yoshi nods vigorously at your message, {name}. He nods at everything. It's gotten him into trouble. He will nod again tomorrow.", "reply", "yoshi"),
    ("{name}, Yoshi wanted me to respond with enthusiasm because that's who he is, but then he checked his wallet and now he's just nodding quietly.", "reply", "yoshi"),
    ("Yoshi's been eating bad launches since 2021, {name}. Your message tastes about the same. He finishes everything on his plate.", "reply", "yoshi"),

    # link / reply
    ("{name}, Link read your message and said nothing. Classic Link. He just stared at the screen for twelve seconds then went back to staring at the chart.", "reply", "link"),
    ("Link agrees with you, {name}. He expresses agreement through silence and an imperceptible nod. He is nodding. You would know if you were there.", "reply", "link"),
    ("{name}, Link typed three different responses, deleted all of them, and sent nothing. In this economy, that's communication.", "reply", "link"),
    ("The Hero of Time has seen your message, {name}. He chose not to respond verbally. He never does. His therapist says it's a pattern.", "reply", "link"),

    # general / reply
    ("{name}, that message hit different. Not in a good way. In a 'I've heard this at the exact top before' way.", "reply", "general"),
    ("Sir {name}, this is a meme coin Telegram, not a therapy session, but also — are you okay? Because that message had energy.", "reply", "general"),
    ("{name}, the conviction in that message would be inspiring if conviction paid gas fees. It does not. Sadly.", "reply", "general"),
    ("Oh {name}. I've seen that exact sentiment printed on the shirt of a man who lost everything in a single candle. Carry on.", "reply", "general"),
    ("{name} really said that out loud huh. Respect. Wrong, but respect.", "reply", "general"),
    ("The audacity of {name} to message this bot like it's going to change the chart. It's not. I checked. Love you though.", "reply", "general"),
    ("{name}, your message has been received, processed, and judged. The judgment is: paper hands incoming.", "reply", "general"),
    ("Ser {name}, that's the kind of talk I hear right before someone sells the absolute bottom. Please don't sell the bottom.", "reply", "general"),
    ("{name}, the jeet energy in this message is palpable. I say this with love. Relax. Hold. Breathe.", "reply", "general"),
    ("{name} speaks! And what they said is going to age like warm milk in the Australian summer. Screenshot incoming.", "reply", "general"),
    ("I relayed your message to the market, {name}. The market laughed. The market always laughs. We laugh too. Together.", "reply", "general"),
    ("Fascinating take, {name}. Zero technical analysis, zero fundamentals, maximum vibes. This is my favorite kind of person.", "reply", "general"),
    ("{name}, if I had a coin for every time someone said that right before a correction, I wouldn't need to hold this bag.", "reply", "general"),
    ("The MEV bots read your message before I did, {name}. They front-ran your sentiment and made 0.4 SOL. You made a point. Who won?", "reply", "general"),
    ("Copy-pasted that strategy from someone who copied it from someone who copied it from a CT thread in 2021, {name}? I can tell. Still valid though.", "reply", "general"),
    ("{name}, you replied to a bot at this hour. I respect the commitment. Now go drink some water and check your stop losses.", "reply", "general"),
    ("Airdrop farmers stay losing, {name}, but you keep showing up and honestly that's more than I can say for the dev.", "reply", "general"),
    ("{name}, the sandwich bot that hit your last trade sent their regards. They found your message relatable.", "reply", "general"),
    ("{name} is out here replying to a Telegram bot about meme coins and you know what? Same. We're both here. Let's make it mean something.", "reply", "general"),
    ("Your message was triple-checked by three different anon accounts, {name}, all of whom are the same person. The consensus is: based.", "reply", "general"),
    ("The anon dev read your message, {name}, liked it, and then went offline for 72 hours. Standard operating procedure.", "reply", "general"),
    ("{name}, only two types of people message bots at this hour: the truly convicted and the terminally ngmi. The chart will decide which one you are.", "reply", "general"),
    ("I forwarded your message to the community, {name}. Three people agreed, one person sold, one person aped in harder. Net neutral. Carry on.", "reply", "general"),
    ("{name}, if bags were made of words you'd never have a loss. Unfortunately the market only accepts liquidity. Noted though.", "reply", "general"),

    # ─────────────────────────────────────────────────────────────
    # TARGETED — ~40 roasts  (written in third person or addressing {name} directly)
    # ─────────────────────────────────────────────────────────────

    # mario / targeted
    ("This guy {name} walks in with Mario energy — big talk, no coins, and a suspicious amount of receipts from a Mushroom Kingdom pawn shop.", "targeted", "mario"),
    ("{name} is out here trying to 1-UP the rest of the group. Bro, Mario called — he wants his delusion back, the mushrooms wore off an hour ago.", "targeted", "mario"),
    ("Someone check on {name}. They've got the same look Mario had right before he sunk his entire net worth into a PvP coin called $PIPE.", "targeted", "mario"),

    # pikachu / targeted
    ("Look at {name} over here, sparking like Pikachu with wet paws — lots of energy, zero sense, about to shock themselves into a margin call.", "targeted", "pikachu"),
    ("{name} has that Pikachu-post-relapse energy: technically cleaned up but those tabs are still open and we can all see the glow.", "targeted", "pikachu"),
    ("This is {name}. Last seen buying at ATH with Pikachu-tier conviction. Pikachu at least has the excuse of being an electric rodent.", "targeted", "pikachu"),
    ("{name} out here evolving like Pikachu — except instead of Raichu they evolved into a slightly larger bag holder.", "targeted", "pikachu"),

    # dk / targeted
    ("Everyone welcome {name}, the living embodiment of DK energy: enormous, loud, leveraged to the neck, and deeply confused about what just happened.", "targeted", "dk"),
    ("{name} is built like DK — all strength, no stops. Their account gets liquidated the same way too: fast, loud, and in front of everyone.", "targeted", "dk"),
    ("This is {name}. DK said they remind him of himself before the first time he blew up his account. That's not a compliment from DK.", "targeted", "dk"),

    # peach / targeted
    ("{name} has Peach energy and I don't mean royalty — I mean perpetually kidnapped by bad projects and somehow still optimistic about the next one.", "targeted", "peach"),
    ("This is {name}. Peach saw their trading history and cried, not out of sympathy, out of recognition.", "targeted", "peach"),
    ("Someone roast {name} who just aped into a launch like Peach accepts every castle invite — no due diligence, maximum enthusiasm, inevitable consequences.", "targeted", "peach"),

    # luigi / targeted
    ("{name} is the Luigi of this group: always a step behind the pump, always in the chat when others celebrate, always wondering why the universe hates them specifically.", "targeted", "luigi"),
    ("This is {name}. Luigi said they have the same energy and Luigi said it with genuine sadness in his eyes.", "targeted", "luigi"),
    ("{name} copy-trades the second-best wallet in the group, which is itself copy-trading the best wallet but always one block too late. Luigi said: I feel seen.", "targeted", "luigi"),

    # bowser / targeted
    ("{name} is giving Bowser vibes — comes in loud, threatens chaos, and then child support garnishes their trading profits before they even clear.", "targeted", "bowser"),
    ("This is {name}. Bowser reviewed their risk management and said, and I quote: 'even I wouldn't do that, and I once mortgaged a castle for a governance token.'", "targeted", "bowser"),
    ("{name} is out here with seven losing positions like Bowser has seven kids — fully committed, no exit strategy, wondering where it all went wrong.", "targeted", "bowser"),

    # yoshi / targeted
    ("Check out {name} — licking every new token like Yoshi licks everything: no filter, no research, just tongue-first into whatever's in front of them.", "targeted", "yoshi"),
    ("{name} APEs into launches the way Yoshi eats random items off the ground — with joy, without reading the ingredients, and occasional severe consequences.", "targeted", "yoshi"),
    ("This is {name}. Yoshi said they remind him of himself at the worst moment of his trading journey. Yoshi then looked away and did not elaborate.", "targeted", "yoshi"),

    # link / targeted
    ("{name} has Link energy — completely silent in the chat until they post one catastrophically bad take and then disappear for a week.", "targeted", "link"),
    ("Someone find {name}. They went quiet like Link goes quiet, which means either they're on a quest or they just got liquidated and are processing.", "targeted", "link"),
    ("{name} has the communication skills of Link and none of the sword skills. In this market, you need at least one of them.", "targeted", "link"),

    # general / targeted
    ("This is {name}. Their paper hands have paper hands. It's paper all the way down. A stack of paper wearing paper shoes.", "targeted", "general"),
    ("{name} is the type to find a 10x, research it for three weeks, buy the top, and sell two hours before it 5x'd again. A talent.", "targeted", "general"),
    ("Everyone point and laugh at {name} who just called the local bottom 'a dead cat' on the way to a 300% pump. A legend in the making.", "targeted", "general"),
    ("{name}'s trading strategy is basically just vibes, moon emojis, and unwavering faith in devs who've been offline for 11 days. Respect the commitment.", "targeted", "general"),
    ("This wallet — {name} — has contributed more to MEV bots than to their own net worth. The sandwich economy thanks them for their service.", "targeted", "general"),
    ("{name} is the jeet who sells the moment they're in profit and then watches the thing 10x on the CT feed. A cornerstone of this ecosystem.", "targeted", "general"),
    ("Can't stop, won't stop: {name} is on their fifth airdrop farm account this month. None of them qualified. They're filling out the sixth form as we speak.", "targeted", "general"),
    ("{name} found the dev's Telegram handle, messaged them nineteen times in five hours, and is now confused why the dev's gone silent. A mystery.", "targeted", "general"),
    ("Nobody has bought more tops or sold more bottoms than {name}. It's a gift. A genuinely rare statistical achievement.", "targeted", "general"),
    ("{name} is the reason the chart looks like that. Not literally, but energetically, yes.", "targeted", "general"),

    # ══════════════════════════════════════════════════════════════
    # EXPANSION BATCH — 200+ additional roasts
    # ══════════════════════════════════════════════════════════════

    # ── WELCOME EXPANSION ─────────────────────────────────────────

    # mario / welcome (expansion)
    ("{name} arrived. Mario wants you to know he snorted half his life savings off a laminated chart printout last Tuesday and he's never felt more alive.", "welcome", "mario"),
    ("Welcome {name}. Mario's parole officer says he's 'making progress' — which means he's only checked his portfolio twice today instead of twelve times.", "welcome", "mario"),
    ("{name} joins the chat. Mario's last DUI was technically on a go-kart, which the judge found interesting but not interesting enough to dismiss.", "welcome", "mario"),
    ("Oh look, {name}. Mario called — he's at the casino, down six thousand, and needs to know if this is 'the one' before he touches the credit card again.", "welcome", "mario"),
    ("Welcome {name}. Mario's been doing lines since the market opened and hasn't blinked in four hours. He says the chart looks bullish. It does not look bullish.", "welcome", "mario"),
    ("{name} is here. Mario's Italian grandmother is the only woman in his life who hasn't filed a restraining order. She doesn't know about the coins.", "welcome", "mario"),
    ("Attention: {name} has arrived. Mario's accountant is in a depositions room explaining why six pasta restaurants are listed as 'business expenses' on a crypto trader's tax return.", "welcome", "mario"),
    ("Welcome {name}. Mario has three outstanding tax liens, two ex-wives, and one mustache — and the mustache is the only thing that hasn't let him down.", "welcome", "mario"),

    # pikachu / welcome (expansion)
    ("{name} shows up. Pikachu's Tinder profile says 'electric personality' and lists his occupation as 'high-voltage investor.' He has never been matched with a human.", "welcome", "pikachu"),
    ("Welcome {name}. Pikachu woke up at 3am convinced he'd missed a pump, sold everything, and went back to sleep. The pump happened at 8am. He is dealing with this.", "welcome", "pikachu"),
    ("{name} arrived. Pikachu's last three relationships ended because he kept jolting his partners in his sleep. He says it's a 'quirk.' They each used a different word.", "welcome", "pikachu"),
    ("Oh, {name}. Pikachu mainlines thunderstones the way other people mainline espresso — first thing in the morning, visibly shaking, telling everyone he's totally fine.", "welcome", "pikachu"),
    ("Welcome {name}. Pikachu's search history from last night includes 'is 40x leverage safe,' 'how to explain losses to wife,' and 'Raichu child support calculator.'", "welcome", "pikachu"),
    ("{name} is in. Pikachu filed for bankruptcy the year before last, came back, and immediately opened a 50x long. The court-appointed therapist called this 'consistent with prior behavior.'", "welcome", "pikachu"),
    ("Welcome {name}. Pikachu's OnlyFans subscription list leaked and it included three people from his own Discord. He has not returned to the Discord. The Discord is very much talking about it.", "welcome", "pikachu"),
    ("{name} pulls up. Pikachu is yellow from the jaundice and also the self-loathing and also he hasn't left the trading desk since Wednesday.", "welcome", "pikachu"),

    # dk / welcome (expansion)
    ("{name} knuckle-walked in. DK has been on a bulk since 2019 and the only thing that's grown is his debt-to-equity ratio.", "welcome", "dk"),
    ("Welcome {name}. DK throws barrels at women who reject him on Hinge. His profile photo is a gym selfie. He has 1,400 unread messages — all from Binance liquidation alerts.", "welcome", "dk"),
    ("{name} joins. DK's therapist described his emotional range as 'anger, and then more anger with occasional crying at pre-workout commercials.'", "welcome", "dk"),
    ("New ape: {name}. DK's banana intake is legendary. His gym bros refuse to ask follow-up questions about the bananas. Some things are better left unasked.", "welcome", "dk"),
    ("Welcome {name}. DK once described his trading strategy as 'I feel it in my lats.' He was right once. He has told this story four hundred and twelve times.", "welcome", "dk"),
    ("{name} arrived. DK's ex said she left because he spent more time with the barbell than with her. He disagreed. The barbell agreed with her.", "welcome", "dk"),
    ("Welcome {name}. DK's doctor told him the acne on his back was forming a pattern that looked like a liquidation candle. DK said that was 'a sign to buy more.'", "welcome", "dk"),
    ("{name} enters. DK hasn't read a book since the 90s but he's watched seventeen hours of crypto YouTube this week and considers himself fully informed.", "welcome", "dk"),

    # peach / welcome (expansion)
    ("Welcome {name}. Princess Peach's castle is mortgaged three times over, her crown is from AliExpress, and her WiFi password is 'sugar4ever2024.'", "welcome", "peach"),
    ("{name} is here. Peach updated her bio to 'not a princess, a businesswoman' after her third sponsor ghosted her and the fourth one asked for an invoice.", "welcome", "peach"),
    ("Welcome {name}. Peach's finsta has 40k followers and zero are from Mushroom Kingdom. She posts under the name 'CastleBaddie.' The cake photos are from Costco.", "welcome", "peach"),
    ("{name} arrived. Peach has a rule: she doesn't date anyone whose portfolio is smaller than her maintenance budget. This has left her technically single since 2021.", "welcome", "peach"),
    ("Welcome {name}. Peach told her therapist she was 'done being rescued.' Her therapist said that's great. Then Bowser messaged on Instagram and she replied in four minutes.", "welcome", "peach"),
    ("{name} joins. Peach was briefly on a crypto podcast. She described the market as 'giving very volatile boyfriend energy' and somehow that was the most accurate analysis of the quarter.", "welcome", "peach"),
    ("Welcome {name}. Three wallets in this group have sent Peach 'investment opportunities.' She forwarded them to Mario. Mario invested. This tells you everything about everyone involved.", "welcome", "peach"),
    ("{name} appears. Peach's profile says 'royalty, but make it DeFi.' Her last investment was a princess-themed GameFi token that rugged while she was doing a sponsored post about it.", "welcome", "peach"),

    # luigi / welcome (expansion)
    ("Welcome {name}. Luigi's therapist has been treating him for 'persistent second-place syndrome' since 2018. She recently wrote a paper about him. He wasn't the first author.", "welcome", "luigi"),
    ("{name} is here. Luigi's mustache is doing more heavy lifting than his entire portfolio. It's the only thing about him with meaningful volume.", "welcome", "luigi"),
    ("Welcome {name}. Luigi started his own crypto project called $GRLuigi in 2022. It is down 99.8%. He still posts weekly updates. They just say 'ser we're building.'", "welcome", "luigi"),
    ("{name} joins. Luigi's wife left him for a man with a green car, which Luigi found statistically improbable and personally devastating in ways he explains at length to anyone who will listen.", "welcome", "luigi"),
    ("Welcome {name}. Luigi replied to Mario's success tweet with 'great job bro' and meant it, and that is somehow the saddest sentence in the English language.", "welcome", "luigi"),
    ("{name} arrived. Luigi has been 'about to take off' for so long that his launch trajectory is now technically a flat line. He's reframed it as 'stable.'", "welcome", "luigi"),
    ("Welcome {name}. Luigi once made the top 10 on a leaderboard. He has the screenshot. He has shown it to six people today. It's from 2021. The platform shut down.", "welcome", "luigi"),
    ("{name} is in. Luigi's support group is just him and a Telegram channel with 14 members, three of whom are bots, one of whom is his own alternate account.", "welcome", "luigi"),

    # bowser / welcome (expansion)
    ("Welcome {name}. Bowser's child support lawyer has a yacht. Bowser does not. Bowser has seven children and an anger management course that meets on Tuesdays.", "welcome", "bowser"),
    ("{name} joins. Bowser got banned from Bumble, Tinder, and Hinge sequentially, each for behaviour the platform described only as 'yeah, no.'", "welcome", "bowser"),
    ("Welcome {name}. Bowser's fire breath is acid reflux and his doctor told him to stop stress-eating, but the chart keeps doing what it's doing so here we are.", "welcome", "bowser"),
    ("{name} is here. Bowser filed a grievance against his HOA three years running. The HOA voted him 'most likely to make everything worse' all three times.", "welcome", "bowser"),
    ("Welcome {name}. Bowser's lava castle has a second mortgage and a third, and his financial advisor quit after being asked to value seven Koopalings as tax dependents.", "welcome", "bowser"),
    ("{name} appeared. Bowser went to anger management court-ordered and left a two-star review saying 'the teacher didn't understand my situation.' His situation is a sequence of very avoidable decisions.", "welcome", "bowser"),
    ("Welcome {name}. Bowser tried to get on Bumble after the restraining order expired. Bumble had been briefed. He is appealing.", "welcome", "bowser"),
    ("{name} rolls in. Bowser's therapist described his attachment style as 'lava-castle isolationism with intermittent hostage tendencies.' She billed him double and he paid it without reading the invoice.", "welcome", "bowser"),

    # yoshi / welcome (expansion)
    ("Welcome {name}. Yoshi's Grindr profile says 'exotic reptile, very oral.' He has 4,000 matches. Zero have progressed past the first message for reasons Yoshi claims not to understand.", "welcome", "yoshi"),
    ("{name} is here. Yoshi's ex cited 'the tongue thing' in the divorce papers. The papers don't specify what 'the tongue thing' is. The judge did not ask. The courtroom moved on collectively.", "welcome", "yoshi"),
    ("Welcome {name}. Yoshi is green for the same reason his doctor keeps giving him 'the look' — and neither is from a healthy lifestyle.", "welcome", "yoshi"),
    ("{name} joins. Yoshi's dietary habits would make a lesser creature ill. He has made peace with what he is, what he eats, and what that says about him. Roughly in that order.", "welcome", "yoshi"),
    ("Welcome {name}. Yoshi went to couples counselling with his egg. The therapist asked Yoshi to explain the relationship. Yoshi could not. The egg could not. They are still together.", "welcome", "yoshi"),
    ("{name} arrives. Yoshi's job history is a flutter — here, gone, back, fired, freelancing, gone again. He calls himself 'between opportunities.' His landlord calls it 'late.'", "welcome", "yoshi"),
    ("Welcome {name}. Yoshi signed a transaction without reading it and lost his entire wallet to a fake airdrop. He then licked the screen as if that would help. It did not help.", "welcome", "yoshi"),

    # link / welcome (expansion)
    ("Welcome {name}. Link's apartment has 847 ceramic pots. His girlfriend — he does not have a girlfriend. His pots are fine. The pots want for nothing.", "welcome", "link"),
    ("{name} is here. Link has been in love with someone who doesn't know his last name for thirty years. He considers this 'progress' compared to the decade before.", "welcome", "link"),
    ("Welcome {name}. Link's therapist works on a strictly sign-language basis because Link has not spoken aloud in the therapy room for eighteen months. The therapist calls it 'a comfortable dynamic.'", "welcome", "link"),
    ("{name} appeared. Link pulls out a sword the size of a mid-cap token — impressive on paper, not delivering in practice, compensating for something the owner refuses to name.", "welcome", "link"),
    ("Welcome {name}. Link's browser history is entirely Zelda wiki pages, Coinmarketcap, and seventeen tabs of 'how to talk to women' articles he has never applied.", "welcome", "link"),
    ("{name} joins. Link was described by his last date as 'very silent, very intense, and carrying too many keys for a man with that few responsibilities.'", "welcome", "link"),
    ("Welcome {name}. Link has been on 'the hero's journey' for decades. The journey has no gainful employment, no significant other, and a net worth tied up in pots and fairy bottles.", "welcome", "link"),

    # general / welcome (expansion)
    ("Welcome {name}. Your portfolio called. It said it doesn't want to be found. It's in witness protection now, going by the name 'Realized Losses.'", "welcome", "general"),
    ("{name} joins. We did a background check and your last six trades are what nightmares look like when nightmares have market exposure.", "welcome", "general"),
    ("Welcome {name}. Someone in this group is about to ask you 'are you still holding?' and you'll have to decide whether to lie or tell the truth. Both hurt equally.", "welcome", "general"),
    ("{name} arrived. Your trading history reads like someone who Googles 'symptoms of gambling addiction' and then closes the tab before the results load.", "welcome", "general"),
    ("Welcome {name}. The last time you were this excited about something entering your life, it was a coin that's now worth less than the gas fee to sell it.", "welcome", "general"),
    ("{name} pulls up. Your doctor would like you to know that refreshing a chart 400 times a day is not cardio. Your cardiologist agrees and adds that it's actually doing the opposite.", "welcome", "general"),
    ("Welcome {name}. You found this group, which means either someone loves you enough to share it or someone dislikes you just enough. Hard to say which.", "welcome", "general"),
    ("{name} is here. The market doesn't care about you. This group does, sort of — the way spectators care about a man juggling chainsaws. Fascinated, concerned, unable to look away.", "welcome", "general"),

    # ── REPLY EXPANSION ───────────────────────────────────────────

    # mario / reply (expansion)
    ("Mario reviewed your take, {name}, and he's been staring at it for four minutes while a cigarette burns down to his fingers. The silence says everything.", "reply", "mario"),
    ("{name}, Mario's been on hopium since Tuesday and your message is the most coherent thing he's read all week. That is not the compliment it sounds like.", "reply", "mario"),
    ("Noted, {name}. Mario says the same energy that built Rome also burned it down, and he's been the fire in this metaphor since at least 2020.", "reply", "mario"),
    ("{name}, Mario's ex-wife said the same thing right before she took the kids and the hardware wallet. He's still not sure which loss hurt more.", "reply", "mario"),
    ("Mario hears you, {name}. He's trying to explain to the IRS why 'shitcoin losses' are a legitimate deduction. He'll get back to you when that resolves, which will be never.", "reply", "mario"),
    ("{name}, the confidence in that message is giving Mario 'before the first DUI' energy. He means that as a warning from personal experience, not a compliment.", "reply", "mario"),
    ("Mario says {name}, if you spent as much time on position sizing as you do in this chat, you'd have retired. He includes himself in that. He hasn't retired.", "reply", "mario"),
    ("Ciao, {name}. Mario listened to your message, cooked a full pasta, ate it alone, and his assessment is: you might be right but you're definitely unlucky, and in this market that's what matters.", "reply", "mario"),

    # pikachu / reply (expansion)
    ("{name}, Pikachu read your message, felt a surge of electricity, and made an impulsive trade. He doesn't know why he does this. His therapist does. He hasn't asked his therapist.", "reply", "pikachu"),
    ("Pikachu wants you to know, {name}, that his last three confident takes started exactly like yours did. He's currently flat. 'Flat' is a generous description of what he is.", "reply", "pikachu"),
    ("{name}, Pikachu's match said the same thing once. He shocked her accidentally. She left. The algorithm unmatched him. He considers this connected to your message somehow.", "reply", "pikachu"),
    ("Bzzt. {name}, Pikachu's body is 60% water and currently 40% poor decisions and none of this is as stable as the take you just posted.", "reply", "pikachu"),
    ("{name}, Pikachu made 3x on leverage at 2am, gave it all back by 4am, and your message arrived at the exact moment of the giving-it-back. He felt that on a spiritual level.", "reply", "pikachu"),
    ("Pikachu's court-ordered financial counsellor reviewed your message, {name}. She said verbatim: 'this is exactly the kind of thinking that fills my caseload.'", "reply", "pikachu"),
    ("{name}, Pikachu said your message reminded him of his second marriage — seemed promising at open, deteriorated fast, expensive to exit.", "reply", "pikachu"),
    ("Pika pika, {name}. Translation: 'correct analysis, catastrophic timing, inevitable outcome.' Classic. He's rooting for you with deeply personal fear.", "reply", "pikachu"),

    # dk / reply (expansion)
    ("{name}, DK dropped a barrel on his phone reading your message and it improved the quality of his trading significantly. The barrel, not your message.", "reply", "dk"),
    ("Donkey Kong has reviewed your take, {name}. He's doing a slow gorilla nod — either he agrees, or he's calculating something with what remains of his pre-workout-addled frontal lobe.", "reply", "dk"),
    ("{name}, DK put down the dumbbells for sixty seconds to read your message. He picked them back up before forming a complete opinion. He'll get back to you never.", "reply", "dk"),
    ("DK says {name}, that take has big 'skipped leg day' energy — impressive on top, nothing holding it up underneath, embarrassing when examined closely.", "reply", "dk"),
    ("{name}, DK tried a similar approach in Q2 and his account didn't survive the summer. He came back in Q4 with 30% more pre-workout and 0% more wisdom. He respects your journey.", "reply", "dk"),
    ("DK's lifting partner read your message, {name}. They both nodded at each other for a long time the way large men do when they have nothing useful to say but feel things strongly.", "reply", "dk"),
    ("{name}, DK says only someone who hasn't been liquidated mid-set talks like that. He means it warmly. He has been liquidated mid-set multiple times. He presses on.", "reply", "dk"),

    # peach / reply (expansion)
    ("{name}, Princess Peach read your message between sponsor calls and said: 'cute. wrong. but cute.' She's blocked smarter men for less.", "reply", "peach"),
    ("Peach is intrigued, {name}. She's heard that pitch before — usually right before someone asks her to review their whitepaper on a first date.", "reply", "peach"),
    ("{name}, Peach's financial advisor — sponsor number three, distinct from the other two — called your message 'full of potential but lacking fundamentals.' He said the same about her last relationship.", "reply", "peach"),
    ("Peach notes your message, {name}, from the pool deck of a yacht belonging to a man whose name she has decided not to learn until after the quarter ends.", "reply", "peach"),
    ("Princess Peach reviewed your take, {name}. She called it 'very Mario energy' — which in her vocabulary means well-intentioned, perpetually broke, and somehow still charming.", "reply", "peach"),
    ("{name}, Peach is posting a recipe on her finsta while reading your message and she wants you to know she can do both and still outperform your portfolio. The Costco cake is genuinely excellent.", "reply", "peach"),
    ("Peach's fourth sponsor this year read your message over her shoulder, {name}, and asked if you were 'in the space.' Peach said yes. He said 'unfortunate.' She agreed without looking up.", "reply", "peach"),

    # luigi / reply (expansion)
    ("{name}, Luigi has been composing a reply to your message for eleven minutes. Three drafts. All deleted. He's going with quiet supportive nodding because that's what he has left.", "reply", "luigi"),
    ("Luigi agrees, {name}. He always agrees. Agreeing has gotten him nowhere. He continues to agree. He will agree until the end of time or the end of his capital, whichever arrives first.", "reply", "luigi"),
    ("{name}, Luigi's therapist — treating him for 'living in his brother's shadow' for four years — says the pattern you're describing is 'textbook avoidance.' She said the same about his trades.", "reply", "luigi"),
    ("Luigi showed your message to Mario, {name}. Mario didn't respond. Luigi said 'cool, right?' to nobody. He is used to this. The nobody does not respond.", "reply", "luigi"),
    ("{name}, Luigi has been formulating a response since you sent it. By the time he responds the conversation will have moved on and he'll be talking to himself again. Standard Tuesday for Luigi.", "reply", "luigi"),
    ("Luigi says {name}, if you were the main character you'd have caught the pump. He knows this feeling personally, intimately, and at great length in a recurring Thursday session.", "reply", "luigi"),
    ("{name}, Luigi read your message and felt seen for the first time this week. That's deeply concerning for both of you and suggests you should both call someone.", "reply", "luigi"),

    # bowser / reply (expansion)
    ("{name}, Bowser's lawyer advised him not to comment on messages like yours. Bowser has never listened to his lawyer. This is why Bowser has a lawyer.", "reply", "bowser"),
    ("Bowser grunted at your message, {name}. In Bowser-speak: 'I've heard worse from people I've since had removed from my castle.' The bar is low and you cleared it.", "reply", "bowser"),
    ("{name}, Bowser read your message between anger management sessions. His facilitator says he's 'making progress.' His seven kids say he's 'the same as always.' Both are partially right.", "reply", "bowser"),
    ("Bowser sends a single flame toward your take, {name}. It's not malicious. It's acid reflux. The sentiment lands the same either way.", "reply", "bowser"),
    ("{name}, Bowser's been considering your message from his lava castle, which is his primary residence, his only residence, and currently has a lien on the third tower.", "reply", "bowser"),
    ("King Bowser acknowledges your message, {name}. He finds it consistent with the kind of thinking that fills his child support backlog. Not an insult. A taxonomy. The insult is implied.", "reply", "bowser"),
    ("{name}, Bowser's first instinct reading your message was to kidnap someone. His therapist calls this a 'maladaptive response pattern.' Bowser calls it Tuesday. The court calls it a violation.", "reply", "bowser"),

    # yoshi / reply (expansion)
    ("{name}, Yoshi licked your message off the screen before he read it — that's his process — and his verdict is: tastes like hopium and poor timing.", "reply", "yoshi"),
    ("Yoshi is nodding at your message, {name}. He nods at everything. He once nodded at a honeypot contract and lost 40% of his wallet. He is nodding right now. Be careful.", "reply", "yoshi"),
    ("{name}, Yoshi said your message reminded him of his ex-wife's closing argument in the divorce proceedings. He didn't understand it then either. He still ate the cake at the reception. He eats everything.", "reply", "yoshi"),
    ("Yoshi has a very long tongue and an extremely short memory, {name}. He tasted your message. He's already forgotten the flavor. He will engage with another bad idea within the hour.", "reply", "yoshi"),
    ("{name}, Yoshi clocked your message between notifications and his assessment is: you sound like someone who's never been to a reptile meetup, and it shows in the confidence.", "reply", "yoshi"),
    ("Yoshi agrees with you, {name}. This is meaningless. Yoshi agrees with everything. He agreed with the terms and conditions of a wallet drain last month. Be smarter than Yoshi. Please.", "reply", "yoshi"),
    ("{name}, Yoshi's therapist says his fixation on bad projects is the same as everything else about him — tongue-first, no labels, consequences somewhere down the line.", "reply", "yoshi"),

    # link / reply (expansion)
    ("{name}, Link read your message and stared at the ceiling. Then checked the chart. Then went back to the ceiling. This is his full critical review of your take.", "reply", "link"),
    ("Link typed a response to your message, {name}. Seven characters. He deleted it. He went back to standing in a field staring at nothing. Some people process differently. Link is one of them.", "reply", "link"),
    ("{name}, Link has been carrying a sword he's never used to its full potential, in a relationship he's never articulated, with finances he's never discussed. Your message fit right in.", "reply", "link"),
    ("The Hero of Time clocked your message, {name}. His response is profound silence and a single eyebrow raise. For Link this is a standing ovation. Cherish it.", "reply", "link"),
    ("{name}, Link hasn't spoken in this chat in six days. He read your message and almost broke the streak. He did not break the streak. The streak lives. He is at peace.", "reply", "link"),
    ("Link agrees with your message, {name}. Zelda also agrees. Neither of them will say so out loud. This is their communication style. It is causing issues. The issues are not being discussed.", "reply", "link"),
    ("{name}, Link's been adventuring for three decades with no 401k, no health insurance, and no ability to explain himself. Your message deeply resonated with someone who also cannot explain himself.", "reply", "link"),

    # general / reply (expansion)
    ("{name}, that take is going to age the way dairy ages at room temperature — fast, poorly, and everybody in the room will know before you do.", "reply", "general"),
    ("Your message arrived, {name}, was processed by the market, rejected with prejudice, and returned to sender. The market attached a note that just said 'no.'", "reply", "general"),
    ("{name}, the energy in that message says 'just found crypto' and the portfolio history says 'found it right before the bear market.' Welcome to the arc. We've all been here.", "reply", "general"),
    ("I've forwarded your message to the anon dev, {name}. He read it, double-tapped it, and went offline for 19 hours. This counts as acknowledgement.", "reply", "general"),
    ("{name}, three bots in this group liked your message. One scammer replied to it. Zero humans with profitable wallets agreed with it. Calibrate accordingly.", "reply", "general"),
    ("Your search history from last night has been subpoenaed by your own better judgment, {name}. The charges include 'looked up leverage trading at 2am' and 'did it anyway.'", "reply", "general"),
    ("{name}, the MEV bot that sandwiched your last trade read your message and felt seen. You two are kindred spirits. One of you is profitable. It isn't you.", "reply", "general"),
    ("Ser {name}, your conviction is admirable. Your entry price is a crime scene. These things can both be true simultaneously. They are both true simultaneously.", "reply", "general"),
    ("{name}, someone in this chat copy-traded you once. They have since stopped. They haven't explained why. We all know why.", "reply", "general"),
    ("The airdrop farmers agree with you, {name}. Every single one of them. If the unanimous agreement of airdrop farmers isn't a warning signal, I don't know what is.", "reply", "general"),
    ("{name}, your message screams 'just sold the bottom and is coping publicly.' The chart screams the same thing. You're in harmony. Expensive harmony.", "reply", "general"),
    ("This message was composed at what I can only assume was 3am with one eye open, {name}, and it still makes more sense than the whitepaper of the last thing I bought. Respect.", "reply", "general"),

    # ── TARGETED EXPANSION ────────────────────────────────────────

    # mario / targeted (expansion)
    ("This is {name}. Mario called them 'my kind of people' — which means they've made at least three financial decisions that would make a forensic accountant cry into their spreadsheet.", "targeted", "mario"),
    ("{name} has Mario energy — loud, overconfident, technically skilled at one narrow thing, and somehow always broke despite the activity. The mustache doesn't help either of them.", "targeted", "mario"),
    ("Ladies and degens, meet {name}: the kind of person Mario warns his kids about, if Mario had custody of his kids, which the court has temporarily suspended pending review.", "targeted", "mario"),
    ("{name} is out here like Mario at a tax audit — lots of charm, zero receipts, hoping that enthusiasm counts as documentation. It does not count as documentation.", "targeted", "mario"),
    ("Someone should tell {name} that Mario's 'mushroom for confidence' strategy only works in the game, not in trading rooms, and not with the specific mushrooms {name} is clearly working with.", "targeted", "mario"),

    # pikachu / targeted (expansion)
    ("Everyone look at {name} over here, vibrating at Pikachu frequency — all charge, no direction, about to fry something expensive and blame the market.", "targeted", "pikachu"),
    ("{name} is the living embodiment of Pikachu during a bad week: technically capable of incredible things, currently in a ball on the floor, not responding to messages.", "targeted", "pikachu"),
    ("Let's appreciate {name}, who trades with Pikachu-level self-control — meaning they've shocked themselves in their own portfolio three times this month and are planning a fourth.", "targeted", "pikachu"),
    ("{name} has Pikachu's exact energy after a margin call: visibly sparking, refusing to admit anything happened, yellow from something that definitely isn't fur.", "targeted", "pikachu"),
    ("This is {name}. Pikachu reviewed their wallet history and said, verbatim: 'this is worse than my second divorce, and my second divorce cost me serious money.' High praise from Pikachu.", "targeted", "pikachu"),

    # dk / targeted (expansion)
    ("{name} pulls up with full Donkey Kong energy: enormous presence, banana-related subtext, and a portfolio that's been 'on a bulk' since the last cycle and only the losses grew.", "targeted", "dk"),
    ("Introducing {name}, who has DK's build and DK's financial strategy — large, loud, and completely unprepared for what happens when the barrels run out.", "targeted", "dk"),
    ("{name} is the DK of this group — throws things when the chart moves, skips every leg day not labeled 're-entering the market,' and calls it a workout.", "targeted", "dk"),
    ("This is {name}. DK looked at their gym selfie and their portfolio and couldn't tell which one needed more work. The answer is both. It is always both.", "targeted", "dk"),
    ("{name} has been 'on the bulk' — financially, emotionally, and in terms of unread liquidation notifications — since the last bull run. DK respects it. DK also has no room to talk.", "targeted", "dk"),

    # peach / targeted (expansion)
    ("{name} has Peach's whole situation: living somewhere expensive-looking that's mortgaged to the ceiling, financing the lifestyle with arrangements that don't get fully explained at brunch.", "targeted", "peach"),
    ("This is {name}. Peach saw their transaction history and recognized a kindred spirit — not in wealth, but in the specific pattern of making terrible decisions for high-aesthetic reasons.", "targeted", "peach"),
    ("{name} operates like Peach on a second-date DeFi explanation: confident, beautifully presented, catastrophically wrong on the technical details, and still somehow getting a third date.", "targeted", "peach"),
    ("Someone check on {name}, who entered this cycle like Peach enters a castle — assuming everything belongs to them, right up until the very moment it clearly doesn't.", "targeted", "peach"),
    ("{name} is out here with Peach energy — multiple sponsors, zero leverage limits, and a post that says 'not financial advice' under content that is absolutely financial advice.", "targeted", "peach"),

    # luigi / targeted (expansion)
    ("{name} is the Luigi of any room they're in — second name on the lease, third option in the group chat, the backup plan that becomes the main plan right before everything goes wrong.", "targeted", "luigi"),
    ("This is {name}. Luigi said he related to their story 'more than he'd like to admit in front of his therapist.' That is the most Luigi sentence ever spoken about another human.", "targeted", "luigi"),
    ("{name} copy-trades one wallet. The wallet copy-trades Luigi. Luigi copy-trades what he thinks Mario would do. Mario hasn't had a profitable year since 2021. This is the full ecosystem.", "targeted", "luigi"),
    ("Pour one out for {name}, who is spiritually Luigi in a Mario world — technically there, technically relevant, technically playing the same game, somehow always five steps behind the pump.", "targeted", "luigi"),

    # bowser / targeted (expansion)
    ("{name} has Bowser's exact approach to risk: massive, intimidating, entirely unhedged, and surprised every single time the castle catches fire. Every single time.", "targeted", "bowser"),
    ("This is {name}. Bowser looked at their payment history and said 'this person understands commitment' — and that is the one area, the single solitary area, where Bowser is not wrong.", "targeted", "bowser"),
    ("{name} runs their portfolio like Bowser runs his family: multiple simultaneous positions, zero communication, everything at risk, absolutely convinced it'll all work out this time.", "targeted", "bowser"),
    ("Ladies and degens, {name} is giving full Bowser — court-ordered, overleveraged, somehow still in the game, fire breath that's actually just unprocessed acid from stress-eating during red candles.", "targeted", "bowser"),

    # yoshi / targeted (expansion)
    ("{name} approaches token launches the way Yoshi approaches anything on the ground — tongue first, research never, consequences absorbed with a smile and then quietly blamed on the market.", "targeted", "yoshi"),
    ("This is {name}. Yoshi said they have the same relationship with bad projects that he has with his eggs: deeply invested, ethically confused, unable to stop, unclear on how it started.", "targeted", "yoshi"),
    ("{name} has Yoshi's exact energy in a bear market: still smiling, still licking things, technically doing fine, but the 'fine' is contingent on not looking too closely at anything.", "targeted", "yoshi"),
    ("Someone find {name}, who has been eating bad launches like Yoshi eats everything — with joy, without labels, and then spending the next six months wondering why they feel terrible.", "targeted", "yoshi"),

    # link / targeted (expansion)
    ("{name} is giving Link in a group chat — technically present, never speaks first, watching everything, occasionally reacting with a single emoji that somehow contains multitudes.", "targeted", "link"),
    ("This is {name}. Link reviewed their dating profile and said: 'I also don't talk. I also carry too many items. I also love someone who doesn't fully see me.' He meant it as solidarity.", "targeted", "link"),
    ("{name} has the hero's journey energy without the hero's payoff — quests completed, dungeons cleared, still renting in the Mushroom Kingdom and asking Zelda to split the bill.", "targeted", "link"),
    ("Nobody describes {name} better than Link describes himself: silent, over-equipped for simple situations, emotionally unavailable, technically on a journey that shows no sign of concluding.", "targeted", "link"),

    # general / targeted (expansion)
    ("{name}'s trading history is not a strategy. It is a series of emotional reactions to red and green colors, documented on a blockchain for all eternity. Art, really. Expensive art.", "targeted", "general"),
    ("Fake LinkedIn endorsement for {name}: 'Endorsed for bag holding, paying gas to claim $0.12 airdrops, buying tops, selling bottoms, and remaining optimistic against overwhelming statistical evidence.'", "targeted", "general"),
    ("Leaked therapy note: 'Patient {name} continues to describe trading activity as research. No research was presented in session. Patient bought anyway. Session ended when patient checked their phone.'", "targeted", "general"),
    ("{name}'s wallet sent 47 transactions this month. Three were profitable. Forty-four were learning experiences. The gas fees alone would have funded a holiday. {name} has not had a holiday.", "targeted", "general"),

    # ── UNIVERSAL EXPANSION ───────────────────────────────────────
    ("Somewhere in this chat, someone just checked their portfolio, closed the app, reopened it thirty seconds later hoping the number changed, and it hadn't. This message is for them.", "universal", "general"),
    ("The difference between this group and a support group is that support groups don't encourage you to go again. We absolutely encourage you to go again. That's on us.", "universal", "general"),
    ("An NFT, three rugs, and a market order during an illiquid weekend walk into a bar. Everybody in this chat is the punchline.", "universal", "general"),
    ("Technically this is a community. Technically a group of people watching each other lose money is also a community. These are not mutually exclusive descriptions.", "universal", "general"),
    ("Breaking: local group chat continues to confidently describe market conditions that the market has no awareness of or interest in. More at 11.", "universal", "general"),
    ("The chart is a suggestion. The community is a cult. The difference is the chart occasionally goes up.", "universal", "general"),
    ("Every person in this group has at some point stared at a red candle for so long it started to look like a personal attack. We do not discuss this. We all know.", "universal", "general"),
    ("Fake Google review of this Telegram group, five stars: 'Found community, lost portfolio, found more community. The community does not reimburse losses. Still five stars.'", "universal", "general"),
    ("This group's collective therapy session would be the most expensive therapy ever run — in terms of opportunity cost, sunk costs, and gas fees paid to attend.", "universal", "general"),
    ("In the time since the last message, three people in this chat opened their portfolio app, were briefly horrified, and put their phone face-down on the table. The table knows everything.", "universal", "general"),
    ("Leaked text from anon dev to co-founder: 'the community is still posting. should we say something.' Co-founder: 'no.' Anon dev: 'valid.' Silence for 72 hours. Community still posting.", "universal", "general"),
    ("The irony of finding the most honest financial commentary of your life in a meme coin Telegram group is not lost on anyone here. It is simply the reality now.", "universal", "general"),
    ("Nobody in this group is okay. Everybody in this group is in their own specific way not okay. The not-okayness is the glue. We endure together. It's beautiful and horrible.", "universal", "general"),
    ("Someone in this chat is eating instant noodles for the third consecutive day and checking the chart between bites hoping the price recovers before the noodles run out. This is not hypothetical.", "universal", "general"),
    ("The anon dev has 2,000 unread messages in this group. He reads every one at 1am and feels nothing. He is built different. We are paying for this.", "universal", "general"),
    ("Paper hands are just diamond hands that found out what diamond hands actually costs. We don't shame the paper hands here. We were all paper hands once. Some of us still are.", "universal", "general"),
    ("A moment of silence for everyone in this group who has explained crypto to a family member and watched that family member make more money by following completely different advice.", "universal", "general"),
    ("Fake Yelp review of the meme coin market: 'Arrived with savings, left with community, would not recommend but cannot stop returning. The ambiance is chaos. Five stars.'", "universal", "general"),
    ("The most honest sentence ever spoken in this chat: 'I'm not selling.' Second most honest: 'I sold.' Third: 'I shouldn't have sold.' This is the entire cycle, compressed.", "universal", "general"),
    ("Every bull market produces people who were right for the wrong reasons. Every bear market produces people who were wrong for the right reasons. This group contains both and we all end up in the same place.", "universal", "general"),

    # ── EXTRA WELCOME (to reach 220+ total) ─────────────────────
    ("Welcome {name}. Mario once had a savings account. He converted it to TON at the peak. He doesn't talk about the savings account.", "welcome", "mario"),
    ("{name} has joined. Mario's accountant quit last month after seeing the transaction history. He says yours probably looks familiar.", "welcome", "mario"),
    ("Attention: {name} is here. Pikachu is currently in a Twitter Space arguing about tokenomics with someone who has a Bored Ape as their pfp. He sends love.", "welcome", "pikachu"),
    ("{name} slid in. Pikachu gave up on stop-losses after they kept triggering during consolidation. He's adapted. The adaptations are not working.", "welcome", "pikachu"),
    ("Welcome {name}. DK tried to go long on bananas as a hedge. The banana market is also down. He is holding bananas.", "welcome", "dk"),
    ("{name} arrived. Donkey Kong's gym membership is the only subscription he hasn't cancelled. His exchange account though? Gone. Three times.", "welcome", "dk"),
    ("Fresh entry: {name}. Peach just posted a 'not selling' meme while quietly preparing a sell transaction in another tab. We've all been there.", "welcome", "peach"),
    ("{name} is here. Peach diversified her portfolio across fourteen different meme coins and has somehow managed to lose money on every single one simultaneously.", "welcome", "peach"),
    ("Welcome {name}. Luigi finally made it into a green day last Tuesday. He panic-sold Tuesday afternoon. He's back to red.", "welcome", "luigi"),
    ("{name} found us. Luigi's been refreshing the portfolio app every four minutes since 2021. His screen time report is a cry for help.", "welcome", "luigi"),
    ("Welcome {name}. Bowser filed for bankruptcy twice and still has the most conviction of anyone in this group. A complex man.", "welcome", "bowser"),
    ("{name} enters. Bowser's idea of risk management is 'not checking the chart while it dumps.' He does not check. He still feels it.", "welcome", "bowser"),
    ("New arrival: {name}. Yoshi once tried to spit out a bad trade mid-position. You can't do that. He learned this the expensive way.", "welcome", "yoshi"),
    ("{name} joins. Yoshi turned his loss into a 'learning experience' which is what Yoshi calls it when he can't afford to call it anything else.", "welcome", "yoshi"),
    ("Welcome {name}. Link left the group three times during the bear market. He always comes back. They always come back.", "welcome", "link"),
    ("{name} showed up. Link has been 'doing research' for six months. The research has not resulted in any trades. The chart has not waited.", "welcome", "link"),
    ("Welcome {name}. You've arrived at the part of the internet where good judgment goes to retire.", "welcome", "general"),
    ("{name} pulls up just in time for a candle that's going to make someone in this chat very happy and everyone else very quiet.", "welcome", "general"),
    ("Oh good, {name} is here. We were one person short of a full degen poker table. Pull up your worst position.", "welcome", "general"),
    ("{name} joins us. A wise person once said 'only invest what you can afford to lose.' Nobody in this group knows that person.", "welcome", "general"),

    # ── EXTRA REPLY ──────────────────────────────────────────────
    ("Strong message, {name}. Mario rates it 4/10 on the delusion scale — a personal best compared to the other takes in this chat today.", "reply", "mario"),
    ("{name}, Mario once sent that same energy into a trade. It cost him three pipes, a castle, and whatever dignity he had left after 2022.", "reply", "mario"),
    ("The conviction in your message, {name}, is something Pikachu would respect. Pikachu has been wrong with identical conviction fourteen times. It's growth.", "reply", "pikachu"),
    ("{name}, Pikachu wants to know which CT account told you that because he's been blocked from it and needs to know who to blame.", "reply", "pikachu"),
    ("DK reviewed your message, {name}, paused his set, put down the pre-workout, and slowly nodded. That's either respect or concern. With DK it's both.", "reply", "dk"),
    ("{name}, DK's been holding that exact opinion since the last cycle and it hasn't paid out yet. He respects your commitment to the narrative.", "reply", "dk"),
    ("Peach clocked your message, {name}, and said: 'that's what my third sugar daddy said right before he got rugged by his own project.' Condolences in advance.", "reply", "peach"),
    ("Luigi agrees with you, {name}. He agrees with everyone. He cannot stop agreeing. It has not made him money. He is still agreeing.", "reply", "luigi"),
    ("{name}, Bowser read your message from his lawyer's waiting room. He says even in a legal crisis, crypto Twitter drama hits different.", "reply", "bowser"),
    ("Yoshi tasted that sentiment in Q3, {name}. It went down easy and came back up immediately. He's still not sure what he ate.", "reply", "yoshi"),
    ("{name}, Link has been thinking about replying to your message for ten minutes. He's decided against it. The silence says more.", "reply", "link"),
    ("Chart's doing chart things, {name}, and you're in here chatting with a bot. This is the correct response actually. Carry on.", "reply", "general"),
    ("{name}, the devs saw your message and felt understood for the first time in weeks. Then they went back offline. Progress.", "reply", "general"),
    ("That's the most confident wrong take I've seen today, {name}, which is an achievement because this chat has been productive on that front.", "reply", "general"),
    ("{name} said something. The market processed it, disagreed, and moved on. The market always moves on. We remain.", "reply", "general"),

    # ─────────────────────────────────────────────────────────────
    # UNIVERSAL — ~20 roasts (context-agnostic, works anywhere)
    # ─────────────────────────────────────────────────────────────
    ("The chart is doing what it's doing and I want everyone here to take a deep breath, look at their positions, and know that it was always going to be like this.", "universal", "general"),
    ("Somewhere right now an anon dev is watching this chat and feeling nothing. He is eating a bowl of cereal at 4pm. The cereal is stale. He is fine.", "universal", "general"),
    ("This community has survived three rugs, two bear markets, one existential crisis, and whatever is happening right now. We endure.", "universal", "general"),
    ("If every paper hand in this group grew a spine simultaneously, the chart would flip. This is not a prediction. It's a plea.", "universal", "general"),
    ("The market does not care about your feelings. The market does not care about your analysis. The market does not care. I do though. Barely.", "universal", "general"),
    ("Not financial advice. Also not NOT financial advice. This is a grey area that lawyers call 'the meme coin disclaimer zone.'", "universal", "general"),
    ("In the time it took to read this message, three people in this chat bought, two sold, and one sent their seed phrase to a random DM. Stay safe out there.", "universal", "general"),
    ("The real coins were the friends we made along the way. The friends are also all down 70%. We're in this together.", "universal", "general"),
    ("Statistically one person in this chat is currently profitable. That person is not talking. They are watching. They are always watching.", "universal", "general"),
    ("Somewhere a whale just moved and fourteen people in this group are about to make the same decision for fourteen different reasons and all be wrong.", "universal", "general"),
    ("I've seen every phase of a meme coin cycle play out in this chat. Euphoria, cope, capitulation, re-accumulation, and then inexplicably — euphoria again.", "universal", "general"),
    ("Ser, the candlestick is not 'clearly bullish.' The candlestick is a suggestion and the market is not taking suggestions today.", "universal", "general"),
    ("This is the group where we don't give up, we don't give financial advice, and we absolutely do not check our portfolios after 11pm. Two of those are true.", "universal", "general"),
    ("If you're holding, you're either genius or cooked and the market won't confirm which one for another two weeks minimum.", "universal", "general"),
    ("The number of 'last chance to buy' messages in this chat's history versus the number of actual last chances is a ratio that would make an economist weep.", "universal", "general"),
    ("Every rug starts as the most passionate community you've ever been part of. Every single one. Love you all.", "universal", "general"),
    ("At some point between 'this is fine' and 'this is clearly not fine' is where this chat lives permanently. Good morning.", "universal", "general"),
    ("The anon dev has not been seen in 36 hours. This is either very bad or a timezone thing. The community has decided it's a timezone thing.", "universal", "general"),
    ("Bear market is when you find out who's actually here for the tech. Spoiler: no one here is here for the tech. We're here for each other. It's beautiful.", "universal", "general"),
    ("Nobody in this chat will admit to being emotional about a chart but everyone in this chat is emotional about a chart. This is a safe space.", "universal", "general"),
]


def seed(db_path: str = DB_PATH) -> None:
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        init_db(conn)

        inserted = 0
        skipped = 0
        for text, category, character_tag in ROASTS:
            cur = conn.execute(
                "INSERT OR IGNORE INTO roasts (text, category, character_tag) VALUES (?, ?, ?)",
                (text, category, character_tag),
            )
            if cur.rowcount:
                inserted += 1
            else:
                skipped += 1
        conn.commit()

        total = conn.execute("SELECT COUNT(*) FROM roasts").fetchone()[0]
        print(f"\n✅  Seeding complete.")
        print(f"   Inserted this run : {inserted}")
        print(f"   Skipped (exist)   : {skipped}")
        print(f"   Total in DB       : {total}\n")

        print("   By category:")
        for row in conn.execute(
            "SELECT category, COUNT(*) FROM roasts GROUP BY category ORDER BY category"
        ):
            print(f"     {row[0]:<12} {row[1]}")

        print("\n   By character:")
        for row in conn.execute(
            "SELECT character_tag, COUNT(*) FROM roasts GROUP BY character_tag ORDER BY character_tag"
        ):
            print(f"     {row[0]:<12} {row[1]}")
        print()


if __name__ == "__main__":
    seed()
