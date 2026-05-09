// GET /api/card?u=<userId>&r=<roastId>&n=<name>&a=<avatarUrl>
// Returns a 1080x1920 PNG roast card rendered by @vercel/og.
//
// Edge Runtime — globally distributed, ~50ms cold start.
// Everything is inlined into this one file because Vercel's Edge bundler
// cannot follow relative imports that lead to .tsx modules.

import { ImageResponse } from '@vercel/og';
import React from 'react';

export const config = { runtime: 'edge' };

// ── Stats generator (inlined — Edge Runtime cannot import from _shared/) ──

interface DegenStats {
  paperhandIndex: number; liquidationRisk: string; mentalState: string;
  lastBoughtTheTop: string; favoriteCope: string; netWorthDelta: string;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
const LIQ  = ['TERMINAL','CRITICAL','SEVERE','DIRE','CATASTROPHIC','EXTREME','MODERATE','ELEVATED'];
const MEN  = ['COPING','DELUSIONAL','ROPING','DISSOCIATING','PRAYING','BLAMING WHALES','CONSIDERING THERAPY','SURPRISINGLY OKAY'];
const TOPS = ['yesterday','2 days ago','3 days ago','last week','2 weeks ago','last month','3 months ago','6 months ago','during the last bull run','when Mario said it was "guaranteed"','the exact moment it peaked'];
const COPE = ['"wagmi"','"zoom out"','"this is the accumulation zone"','"the whales are suppressing it"','"down 90% is just up 1000% inverted"','"my cost basis is basically zero"','"the fundamentals haven\'t changed"','"just gotta wait for the next cycle"','"this is actually bullish"','"technically not a loss if I don\'t sell"'];
const DELT = ['-73% YTD','-87% YTD','-91% YTD','-64% YTD','-99.2% from ATH','-82% since "going all in"','-68% this cycle','+0.3% (gas fees not included)','-100% (margin call, RIP)'];

function generateStats(userId: number): DegenStats {
  const seed = (((userId * 2654435761) >>> 0) + isoWeek(new Date()) * 1234567891) >>> 0;
  const rand = mulberry32(seed);
  const bh = (r: number, b = 2.5) => 1 - Math.pow(1 - r, b);
  return {
    paperhandIndex:   Math.round(bh(rand()) * 100),
    liquidationRisk:  LIQ[Math.min(Math.floor(bh(rand(), 3) * LIQ.length), LIQ.length - 1)],
    mentalState:      MEN[Math.min(Math.floor(bh(rand(), 3) * MEN.length), MEN.length - 1)],
    lastBoughtTheTop: TOPS[Math.floor(rand() * TOPS.length)],
    favoriteCope:     COPE[Math.floor(rand() * COPE.length)],
    netWorthDelta:    DELT[Math.min(Math.floor(bh(rand(), 2) * DELT.length), DELT.length - 1)],
  };
}

// ── Roast lookup (inlined subset — same reason) ───────────────────────────
const ROAST_MAP: Record<string, string> = {
  r001:'welcome to the degen asylum, {name} — check your wallet at the door',r002:'mario saw you join and immediately went back to snorting mushroom dust, {name}',r003:'pikachu shorted you the second you walked in, {name} — and he\'s already in profit',r004:'DK called it — {name} joins exactly when the chart looks worst',r005:'peach saw your portfolio and quietly left the room, {name}',r006:'luigi was about to roast you, {name}, but he\'s too busy crying about his own bags',r007:'bowser sent {name} a welcome gift — a copy of \'How to Lose Money in 30 Days\'',r008:'yoshi ate your entry price, {name} — it wasn\'t worth digesting',r009:'link checked the ancient scrolls for {name}\'s financial future. the scrolls just said \'lol\'',r010:'the red flag count for {name} is already above the candle wick',r011:'oh great, another one — {name} has arrived to help us all feel better about our decisions',r012:'mario paused mid-snort to say \'{name} is built different\' — he says that about everyone',r013:'mate, you really replied to me — {name} out here testing fate with both hands',r014:'mario looked at your reply, {name}, and went back to counting imaginary coins',r015:'pikachu watched you type that, {name}, and discharged 50,000 volts of secondhand embarrassment',r016:'DK benched 300kg this morning. your reply still weighs less than his IQ, {name}',r017:'peach read that, {name}, sighed, and updated her \'people to avoid\' spreadsheet',r018:'luigi facepalmed so hard he knocked over his own sadness jar, {name}',r019:'bowser had you flagged for \'terminally online\' behaviour, {name}',r020:'yoshi swallowed your take whole, {name}, then immediately spat it back out',r021:'link pulled the master sword just to cut through the nonsense you just typed, {name}',r022:'not a single braincell was harmed typing that because there were none involved, {name}',r023:'the audacity of {name} to reply to me like I haven\'t seen their chart',r024:'mario paused mid-snort to say \'{name} is cooked\' — that\'s a certified fact now',r025:'{name} got caught buying the absolute peak — mario\'s still pointing and laughing',r026:'pikachu\'s leverage is lower than {name}\'s chances of breaking even this cycle',r027:'DK hasn\'t lost this badly at anything since {name} started \'trading\'',r028:'peach blocked {name} after seeing the portfolio — even she has standards',r029:'luigi cried seeing {name}\'s PnL — and luigi cries at everything',r030:'{name} is so bearish they\'re actually bullish on failure — bowser is impressed',r031:'even yoshi won\'t give {name} a ride after what they did to their stop-loss',r032:'link completed every dungeon in hyrule faster than {name} broke even once',r033:'still holding bags from the last cycle, {name}? genuinely impressive dedication to suffering',r034:'your entry price is a war crime, {name} — someone call the financial authorities',r035:'the chart went up just to dump on {name} specifically — it\'s personal',r036:'{name}\'s trading strategy: buy high, panic sell low, blame market manipulation',r037:'mario reviewed {name}\'s wallet and called it \'a cry for help rendered in transactions\'',r038:'pikachu\'s entire net worth is still more than {name}\'s unrealised gains',r039:'DK\'s banana hoard has outperformed {name}\'s portfolio by 4,700% YTD',r040:'{name}: certified proof that financial literacy should be a prerequisite for crypto access',r041:'wario caught wind of {name} joining and immediately started plotting — he smells easy money',r042:'toad ran to warn {name} first — the princess is in another wallet and so is the profit',r043:'the degen gods have been notified — {name} has entered the chat and they are already rubbing their hands',r044:'kirby inhaled {name}\'s entire net worth in one breath and still felt empty',r045:'samus scanned {name}\'s wallet and flagged it as a hostile environment',r046:'fox told {name} to do a barrel roll — straight into a long position at the top',r047:'ganondorf cancelled his evil plan when {name} arrived — this is better entertainment',r048:'captain falcon pointed at {name} and screamed SHOW ME YOUR TRADES — then immediately looked away',r049:'{name} has arrived with the energy of someone who discovered crypto last week and already has opinions',r050:'mario put down the mushrooms when {name} showed up — he doesn\'t need them to hallucinate this hard',r051:'{name} just walked into the most financially dangerous group chat they\'ve ever been in — welcome',r052:'pikachu sent {name} a welcome shock — 50,000 volts and still couldn\'t jumpstart that portfolio',r053:'DK beat his chest when {name} arrived — he\'s been waiting for fresh competition to embarrass',r054:'luigi waved at {name} from the sidelines — he knows another suffering soul when he sees one',r055:'peach sent {name} a polite welcome note and then immediately blocked them on everything financial',r056:'bowser added {name} to the list of people he\'ll defeat without even trying',r057:'yoshi gave {name} a ride in — dropped them at the worst possible entry point and ran',r058:'link checked the triforce for {name}\'s destiny — it said financial calamity, strength optional',r059:'{name} walked in like they had a plan — the market spotted this immediately',r060:'wario smelled {name}\'s wallet from across the room — described it as light',r061:'nobody asked {name} but here we are — reading it anyway and wishing we hadn\'t',r062:'wario read {name}\'s reply and tried to charge them for the audacity',r063:'toad processed {name}\'s message faster than their stop-loss — which is to say, not at all',r064:'kirby inhaled {name}\'s take and immediately spat it back out — too much cope, not enough substance',r065:'samus locked onto {name}\'s reply and filed it under confirmed hostiles',r066:'fox mccloud told {name} to trust the mission — then quietly reconsidered everything',r067:'ganondorf has conquered kingdoms — {name} still can\'t conquer a single breakeven',r068:'captain falcon showed {name} what FALCON PUNCH looks like — it\'s their PnL chart',r069:'{name} typed that with the confidence of someone who has never once looked at their own transaction history',r070:'mario counted his coins after reading {name}\'s reply — still more than {name}\'s whole portfolio',r071:'pikachu discharged every stored volt reading {name}\'s take — all completely wasted',r072:'DK stopped mid-climb to stare at {name}\'s reply — then kept climbing without a single word',r073:'luigi was going to respond to {name} but he\'s already dealing with too much emotionally right now',r074:'bowser issued {name} an official summons for crimes against coherent market analysis',r075:'yoshi laid an egg after reading that, {name} — he only does this when truly disappointed',r076:'{name} bought the dip that turned out to be a cliff — a classic move, truly',r077:'wario invested alongside {name} once — he sold before them and still made it out fine',r078:'kirby has absorbed better trading strategies than {name}\'s by complete accident',r079:'samus hunts the most dangerous bounties in the galaxy — {name}\'s entry price is somehow worse',r080:'{name} has held through three separate 80% drawdowns and describes this as patience',r081:'ganondorf built an entire dark kingdom faster than {name} has built a positive balance',r082:'captain falcon checked {name}\'s speed — 0% gains, 100% delusion, somehow still racing',r083:'{name}\'s portfolio looks like the final level of a game nobody wanted to finish',r084:'DK threw a barrel at the market and it landed better than {name}\'s limit order',r085:'link has rescued a princess more times than {name} has made a profitable trade',r086:'{name} has called the bottom four separate times — wrong four times — is calling it again',r087:'peach has been kidnapped seventeen times and still has better exit planning than {name}',r088:'luigi saw {name}\'s PnL and said at least I have company now — he meant it as comfort',r089:'{name} has more red candles in their history than a mario kart track has shells',r090:'mario checked the 1D chart for {name} — closed the tab, returned to the mushroom kingdom, said nothing',r091:'buying high and selling low is not a strategy, {name} — it is a lifestyle and a cry for help',r092:'the only thing more predictable than the market dumping is {name} being completely surprised by it',r093:'{name}\'s portfolio has seen more red than bowser\'s castle at sunset',r094:'{name} calls it long-term investing — the market calls it trapped with no exit',r095:'{name} went all in because someone in a server said this is the one — it was not the one',r096:'mario wants {name} to know that even toad houses have better odds than their entries',r097:'pikachu has never rage-quit anything — watching {name}\'s portfolio nearly broke a 30-year streak',r098:'yoshi carried {name} through two entire bull markets and they still ended up down — yoshi has retired',r099:'{name} has more conviction than evidence — bowser respects the commitment to self-destruction',r100:'link found {name} wandering the lost woods — they\'ve been going in circles since the last cycle',r101:'the only dungeon harder than hyrule castle is {name}\'s tax situation',r102:'DK threw a barrel at the market — it landed better than {name}\'s dollar cost average',r103:'{name}\'s favourite indicator is vibes — and the vibes have been wrong since Q1',r104:'luigi looked at {name}\'s unrealised losses and said at least I\'m not alone — his version of a compliment',r105:'peach has been kidnapped fewer times than {name} has been rugged',r106:'{name} put it in crypto instead of a savings account — and here we all stand witnessing it',r107:'the blockchain never forgets, {name} — and neither does anyone who saw that entry price',r108:'{name} called it diamond hands — the market called it trapped — both were technically correct',r109:'mario checked the 1W chart on {name}\'s behalf — he couldn\'t finish looking at it',r110:'wario would steal {name}\'s bags but there is genuinely nothing left worth taking',r111:'{name} read number go up technology and took it as a binding legal contract',r112:'samus cleared entire planets more efficiently than {name} has cleared a single red position',r113:'fox mccloud said never give up — he had not seen {name}\'s trade history at the time',r114:'{name}: living proof that conviction and competence are two completely separate skills',r115:'kirby absorbed {name}\'s entire trading strategy and deleted it from memory — not worth keeping',r116:'ganondorf has a longer time horizon than {name} and he\'s been losing for thirty years straight',r117:'captain falcon checked {name}\'s numbers — filed them under FALCON STOP',r118:'toad tried to warn {name} eleven separate times — he has taken up a new hobby instead',r119:'{name} has survived every correction by simply not checking the price — valid, but not actually a strategy',r120:'the market is patient and {name} is persistent — unfortunately these are not the same thing',
};

// ── Default avatar ────────────────────────────────────────────────────────
// Embedded as a data URI so the Edge function never touches the filesystem.
const DEFAULT_AVATAR_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231e1b4b'/%3E%3Ccircle cx='50' cy='36' r='18' fill='%236b7280'/%3E%3Cellipse cx='50' cy='85' rx='26' ry='20' fill='%236b7280'/%3E%3C/svg%3E";

// ── Card template ─────────────────────────────────────────────────────────
// Satori supports a subset of CSS flex. No grid, no transforms, no external
// class names — everything must be inline styles.

interface StatRowProps {
  label: string;
  value: string;
  accent?: boolean;
}

function StatRow({ label, value, accent = false }: StatRowProps) {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        marginBottom: 10,
        fontSize: 26,
        fontFamily: 'monospace',
      },
    },
    React.createElement('span', { style: { color: '#94a3b8' } }, label),
    React.createElement(
      'span',
      { style: { color: accent ? '#f87171' : '#e2e8f0', fontWeight: 'bold' } },
      value,
    ),
  );
}

interface CardProps {
  name: string;
  roastText: string;
  stats: DegenStats;
  avatarSrc: string;
}

function CardTemplate({ name, roastText, stats, avatarSrc }: CardProps) {
  return React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 40%, #0f0a1e 100%)',
        padding: '72px 60px 48px',
        fontFamily: 'sans-serif',
        position: 'relative' as const,
      },
    },
    // Top accent bar
    React.createElement('div', {
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
      },
    }),

    // Avatar ring
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '6px solid #a855f7',
          overflow: 'hidden',
          marginBottom: 24,
        },
      },
      React.createElement('img', {
        src: avatarSrc,
        width: 280,
        height: 280,
        style: { objectFit: 'cover' as const },
      }),
    ),

    // Name
    React.createElement(
      'div',
      {
        style: {
          color: '#e2e8f0',
          fontSize: 52,
          fontWeight: 'bold',
          marginBottom: 40,
          letterSpacing: '-0.5px',
        },
      },
      name,
    ),

    // Roast text
    React.createElement(
      'div',
      {
        style: {
          color: '#f8fafc',
          fontSize: 54,
          fontWeight: 'bold',
          textAlign: 'center' as const,
          lineHeight: 1.25,
          maxWidth: 900,
          marginBottom: 'auto',
          padding: '0 20px',
        },
      },
      `"${roastText}"`,
    ),

    // Stats block
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column' as const,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid #4c1d95',
          borderRadius: 20,
          padding: '28px 40px',
          width: '100%',
          marginTop: 40,
          marginBottom: 28,
        },
      },
      React.createElement(
        'div',
        {
          style: {
            color: '#a855f7',
            fontSize: 28,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            marginBottom: 18,
            textAlign: 'center' as const,
          },
        },
        '\u2554\u2550\u2550 DEGEN PROFILE \u2550\u2550\u2557',
      ),
      React.createElement(StatRow, {
        label: 'Paperhand Index:',
        value: `${stats.paperhandIndex}%`,
        accent: stats.paperhandIndex >= 85,
      }),
      React.createElement(StatRow, { label: 'Liquidation Risk:', value: stats.liquidationRisk, accent: true }),
      React.createElement(StatRow, { label: 'Mental State:', value: stats.mentalState, accent: true }),
      React.createElement(StatRow, { label: 'Last Bought Top:', value: stats.lastBoughtTheTop }),
      React.createElement(StatRow, { label: 'Cope Of Choice:', value: stats.favoriteCope }),
      React.createElement(StatRow, { label: 'Net Worth Delta:', value: stats.netWorthDelta, accent: true }),
      React.createElement(
        'div',
        {
          style: {
            color: '#a855f7',
            fontSize: 28,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            marginTop: 18,
            textAlign: 'center' as const,
          },
        },
        '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
      ),
    ),

    // Footer
    React.createElement(
      'div',
      { style: { color: '#475569', fontSize: 26, marginTop: 8 } },
      'via @nintondobot \u00b7 $NINTONDO on TON',
    ),

    // Bottom accent bar
    React.createElement('div', {
      style: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
      },
    }),
  );
}

// ── Handler ───────────────────────────────────────────────────────────────

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get('u') ?? '0');
  const roastId = url.searchParams.get('r') ?? '';
  const name = url.searchParams.get('n') ?? 'anon';
  const avatarUrlParam = url.searchParams.get('a');

  const rawText = ROAST_MAP[roastId] ?? 'the market already roasted you harder than anything I could say';
  const roastText = rawText.replace(/\{name\}/g, name);

  const stats = generateStats(userId);
  const avatarSrc = avatarUrlParam ?? DEFAULT_AVATAR_URI;

  const image = new ImageResponse(
    React.createElement(CardTemplate, { name, roastText, stats, avatarSrc }),
    { width: 1080, height: 1920 },
  );

  return new Response(image.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
