/**
 * GET /api/card?u=<userId>&t=<roastText>&c=<characterTag>&n=<name>&a=<avatarUrl>
 * Returns a 540×960 PNG roast card.
 *
 * Runtime: Edge — @vercel/og is designed for Edge runtime (WASM bundled
 * automatically). All logic is inlined here; no _shared/ imports needed.
 *
 * Assets are served from /public/ (miniapp static files):
 *   /fonts/BowlbyOne-Regular.ttf
 *   /characters/{tag}.png  (280px, 60–100 KB each)
 *   /logo-mark.png
 */

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// ── Colour palette ──────────────────────────────────────────────────────────
const RED    = '#d4151f';
const BLUE   = '#1d8bd9';
const YELLOW = '#ffcc00';
const CREAM  = '#f5e6c8';
const DARK   = '#0a0a1e';
const PURPLE = '#a855f7';

// ── Seeded PRNG (mulberry32 + cyrb53) ───────────────────────────────────────
function mulberry32(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hashStringToSeed(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
function isoWeek(): number {
  const d = new Date(); d.setUTCHours(0,0,0,0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - y.getTime()) / 86400000) + 1) / 7);
}
function pickFrom<T>(arr: readonly T[], rng: () => number): T { return arr[Math.floor(rng() * arr.length)]; }

// ── Characters ───────────────────────────────────────────────────────────────
const ALL_CHARS = ['mario','luigi','peach','pikachu','ash','dk','mew','charmander','bulbasaur','mewtwo'] as const;
type CharTag = typeof ALL_CHARS[number];
function resolveTag(tag: string, rng: () => number): CharTag {
  return (ALL_CHARS as readonly string[]).includes(tag) ? tag as CharTag : pickFrom(ALL_CHARS, rng);
}

// ── Type badges ──────────────────────────────────────────────────────────────
const TYPES = ['PAPERHAND','BAGHOLDER','RUGPULLED','EXIT-LIQUIDITY','COPED-OUT','TERMINAL-COPER',
  'FOMO-VICTIM','BOUGHT-THE-TOP','CHART-COOKED','LIQUIDATED','OVER-LEVERAGED','EMOTIONAL-TRADER',
  'DIAMOND-HANDED-TRASH','PERPETUALLY-EARLY','DELUSIONAL-BULL','CAPITULATED','NGMI-CERTIFIED',
  'SOLD-AT-BOTTOM','JEET-CONFIRMED','LATE-ADOPTER','TRENCH-DWELLER','IRON-HANDED-NOTHING',
  'SCAMMED-AGAIN','EXIT-LIQUIDITY-SUPREME','HOPIUM-ADDICT','CHART-DENIER','RECOVERY-MODE',
  'TILTED-MAXIMALIST','HARDCORE-COPER','FUTURES-CASUALTY','AIRDROP-FARMER-FAILED',
  'TOKEN-MAXI-RUGGED','ECOSYSTEM-VICTIM','MICROCAP-MARTYR','SLOW-RUGGED'] as const;

// ── Scene captions ────────────────────────────────────────────────────────────
const SCENES = ['PORTFOLIO REVIEW','MORNING AFTER','CHART CHECKING','STILL COPING',
  'REFRESHING DEXSCREENER','EXPLAINING TO SPOUSE','CHECKING LOSSES','ANOTHER L LOADING',
  'LATE NIGHT TRADING','BAGHOLD ERA','PAPERHANDING IN 4K','GETTING JEETED ON','FOMO-IN PHASE',
  'CONFIRMATION BIAS HOUR','HOPIUM SESSION','DEEP COPE TERRITORY','EMOTIONAL DAMAGE',
  'CHART POSTING THERAPY','RECOVERY ARC FAILED','TILTED MAXIMUM'] as const;

// ── Stats ─────────────────────────────────────────────────────────────────────
const RISK_LEVELS  = ['TERMINAL','CRITICAL','SEVERE','EXTREME','CATASTROPHIC','IMMINENT','TRAGIC','CURSED','COOKED','FUCKED','DOOMED','HOSPICE-TIER'];
const MENTAL_STATES = ['COPING','DELUSIONAL','DISSOCIATING','CATATONIC','MANIC','IN-DENIAL','BARGAINING','ROPING','NUMB','BROKEN','HOPIUM-MAX','ACCEPTANCE-PHASE'];
const COPES = ['HODL','ZOOM OUT','ITS FINE','BUYING DIP','WAITING','PRAYING','COPING','DENIAL','STAKING','AVERAGING','TOUCHING GRASS','IGNORING CHARTS',
  'SKILL ISSUE','PAPER HANDS','WEAK HANDS','STRONG HANDS','SLEEPING ON IT','TOUCHING GRASS','VISITING FAMILY','GIVING UP'];
const TOPS = ['JAN 2021','MAY 2021','NOV 2021','Q1 2022','LUNA TOP','FTX EVE','ETH MERGE','BTC ATH','EVERY TOP','THE LAST ONE','THIS ONE PROBABLY'];

function generateStats(userId: number) {
  const week = isoWeek();
  const rng  = mulberry32(hashStringToSeed(`${userId}:stats:${week}`));
  const paperhandIndex = rng() < 0.1 ? Math.floor(40 + rng() * 30) : Math.floor(70 + rng() * 29);
  return {
    paperhandIndex,
    liquidationRisk:  pickFrom(RISK_LEVELS,   rng),
    mentalState:      pickFrom(MENTAL_STATES, rng),
    lastBoughtTheTop: pickFrom(TOPS,          rng),
    favoriteCope:     pickFrom(COPES,         rng),
    netWorthDelta:    `-${Math.floor(50 + rng() * 47)}% YTD`,
  };
}

// ── Roast text lookup (allows short share URLs without the `t` param) ────────
const ROAST_TEXT: Record<string, string> = {
  r001:'{name} just walked in smelling like failure and cheap leverage — congrats on finding us',
  r002:'mario saw {name} join and immediately dumped his bags on them — he\'s done this before',
  r003:'pikachu shorted {name} the second they entered the chat — already up 40x, no remorse',
  r004:'DK could smell {name}\'s entry price from the top of the tower — it smells like a margin call',
  r005:'peach took one look at {name}\'s wallet address and reported it to the authorities as a crime scene',
  r006:'luigi has been down bad for three years and {name} still walked in looking worse — respect the hustle',
  r007:'bowser conquered the entire mushroom kingdom in less time than {name} will take to break even',
  r008:'yoshi took one bite of {name}\'s portfolio and immediately laid an egg in pure disgust',
  r009:'link pulled out the ocarina of time specifically to go back and warn {name} not to ape in — they didn\'t listen',
  r010:'the market opened a position against {name} before they even finished typing their username',
  r011:'{name} joined this chat and immediately made every other degen feel significantly better about their choices',
  r012:'mario paused mid-shroom to welcome {name} — took one look at the portfolio and went back to snorting',
  r013:'{name} really replied to me with that energy — brave move for someone whose last trade was a hate crime against their own savings',
  r014:'mario read {name}\'s reply, counted his coins, confirmed he has more, and went back to not caring',
  r015:'pikachu took {name}\'s reply personally and used thunder on their router — now neither of you can check the chart',
  r016:'DK benched your entire net worth this morning, {name} — it was the lightest lift of his week',
  r017:'peach read {name}\'s reply, added them to a spreadsheet titled DO NOT LEND MONEY TO, and said nothing',
  r018:'luigi was already crying when {name} sent that — somehow it made things worse',
  r019:'bowser has enslaved entire civilisations — {name}\'s reply is somehow more oppressive than any of that',
  r020:'yoshi swallowed {name}\'s take whole, ran to the toilet immediately, and has not been seen since',
  r021:'link unsheathed the master sword just to slash {name}\'s reply in half — it still wasn\'t enough to kill it',
  r022:'{name} typed that with the confidence of someone who has never once been right about anything financial',
  r023:'the audacity of {name} replying to me like I haven\'t already seen their on-chain history — it\'s documented',
  r024:'mario coughed so hard reading {name}\'s reply that he blew an entire mushroom stash — total loss, still funnier than the message',
  r025:'{name} bought the exact top — mario watched it happen in real time, pointed, and never stopped pointing',
  r026:'pikachu\'s leverage position is more responsible than anything {name} has ever done with money',
  r027:'DK has thrown barrels more precisely than {name} has ever placed a limit order in their life',
  r028:'peach blocked {name} on every platform after seeing the wallet — not out of spite, out of self-preservation',
  r029:'luigi sobbed looking at {name}\'s PnL — and luigi once cried at a loading screen so that\'s really saying something',
  r030:'{name} is so committed to losing money that bowser has offered them a job doing it professionally',
  r031:'yoshi refused to carry {name} after what they did to their own stop-loss — he has boundaries now',
  r032:'link finished every dungeon in hyrule, defeated ganon, and saved the timeline faster than {name} has broken even once',
  r033:'{name} is still holding bags from the last cycle, calling it a long-term investment while crying into a cold dinner',
  r034:'your entry price is not just bad, {name} — it\'s an insult to the concept of arithmetic',
  r035:'the chart went up specifically to dump on {name} — the market has developed a personal vendetta and it is winning',
  r036:'{name}\'s strategy: buy the rumour, sell the news, cry about the rug, repeat until broke',
  r037:'mario looked at {name}\'s wallet history and called it the saddest piece of performance art he\'d ever seen',
  r038:'pikachu\'s entire net worth — in Pokédollars — still outperforms {name}\'s unrealised gains',
  r039:'DK\'s banana hoard has delivered a 4,700% return YTD while {name} is still explaining why the thesis is valid',
  r040:'{name} is living proof that access to leverage should require a psychiatric evaluation first',
  r041:'wario entered the chat the moment {name} did — he can smell a mark from three blockchains away',
  r042:'toad sprinted to warn the whole chat that {name} was coming — nobody believed it could be this bad',
  r043:'the degen gods saw {name} join, looked at each other, and said "this one\'s going to be fun to watch implode"',
  r044:'kirby inhaled {name}\'s entire financial future in one breath — tasted like gas fees and regret',
  r045:'samus scanned {name}\'s wallet on arrival and marked it as a biohazard — do not touch without protection',
  r046:'fox told {name} to do a barrel roll — right into a 50x long at the absolute top of the market',
  r047:'ganondorf cancelled his world domination plan when {name} arrived — this required zero effort to destroy',
  r048:'captain falcon pointed at {name}\'s portfolio and screamed SHOW ME YOUR TRADES — then immediately filed for therapy',
  r049:'{name} rolled in with the energy of someone who found crypto three weeks ago and is already correcting others',
  r050:'mario put the mushrooms down when {name} showed up — reality is already more unhinged than anything he could hallucinate',
  r051:'{name} just walked into the most financially dangerous group chat in their life — and they look excited about it',
  r052:'pikachu zapped {name} on arrival as a welcome gift — 50,000 volts and still couldn\'t shock them into making better decisions',
  r053:'DK beat his chest when {name} joined — he\'s been waiting for someone new to financially humiliate',
  r054:'luigi spotted {name} and waved them over immediately — misery loves company and he has a lot of both',
  r055:'peach sent a polite welcome note, then quietly moved {name}\'s address to her blocked-for-financial-crimes list',
  r056:'bowser added {name} to his list of planned conquests — ranked last because there\'s nothing left to take',
  r057:'yoshi gave {name} a lift in, dropped them at the worst entry point imaginable, bolted, and has filed a restraining order',
  r058:'link checked all three pieces of the triforce for {name}\'s financial destiny — wisdom said no, courage said no, power said absolutely not',
  r059:'{name} entered this chat like they had a plan — the market was notified and immediately adjusted accordingly',
  r060:'wario smelled {name}\'s wallet from the other side of the chain — described the aroma as "fresh rekt"',
  r061:'nobody asked for {name}\'s opinion but here it is anyway, and here we all are, worse off for having read it',
  r062:'wario read {name}\'s reply and immediately tried to charge a stupidity fee — said it\'s the only tax he supports',
  r063:'toad processed {name}\'s message faster than their stop-loss ever triggered — which means it didn\'t trigger at all',
  r064:'kirby inhaled {name}\'s take, gained the ability to make terrible financial decisions, and immediately spat it back out',
  r065:'samus locked onto {name}\'s reply, classified it as a hostile life form, and is considering orbital bombardment',
  r066:'fox told {name} to trust the mission — then read their reply, cancelled the mission, and went home',
  r067:'ganondorf has destroyed entire kingdoms with less effort than {name} is putting into being wrong about this',
  r068:'captain falcon showed {name} what a FALCON PUNCH looks like — it\'s just a screenshot of their PnL',
  r069:'{name} sent that reply with the energy of someone who has never once audited their own transaction history and never will',
  r070:'mario counted all his coins after reading {name}\'s message — still more than {name}\'s entire portfolio, by a lot',
  r071:'pikachu discharged every stored volt reacting to {name}\'s take — wasted electricity, accomplished nothing, just like the trade',
  r072:'DK stopped mid-climb, stared at {name}\'s reply for a long time, and then kept climbing without making a single sound',
  r073:'luigi wanted to respond to {name} but he\'s already at emotional capacity and cannot take on more suffering right now',
  r074:'bowser issued {name} a formal summons for crimes against coherent market analysis — sentencing is set for next red candle',
  r075:'yoshi laid an egg reading {name}\'s reply — his fourth today — only {name} can make him do that twice in a row',
  r076:'{name} bought what they thought was a dip — it was not a dip, it was a cliff, and they are still falling',
  r077:'wario invested one position alongside {name}, sensed the energy, exited immediately, and tripled — {name} is still in',
  r078:'kirby accidentally absorbed {name}\'s trading strategy, immediately developed financial anxiety, and had to see a therapist',
  r079:'samus has hunted the most dangerous creatures in the galaxy — {name}\'s entry price is somehow the scariest thing she\'s seen',
  r080:'{name} has survived three separate 80% drawdowns purely by refusing to check the price — calling this a "strategy"',
  r081:'ganondorf built a dark empire in less time than {name} has spent explaining why they haven\'t sold yet',
  r082:'captain falcon timed {name}\'s entry — 0 km/h, 100% delusion, somehow still in the race',
  r083:'{name}\'s portfolio looks like the final boss of a game that was designed to be impossible — and unwinnable',
  r084:'DK randomly threw a barrel and it outperformed every limit order {name} has ever placed — it was an accident',
  r085:'link has rescued the same princess seventeen times — still more successful exits than {name} has managed all cycle',
  r086:'{name} has called the bottom five times — wrong five times — is currently calling it again with full confidence',
  r087:'peach has been kidnapped more times than she can count and still has a better exit strategy than {name}',
  r088:'luigi saw {name}\'s PnL and said "at least I\'m not alone" — the saddest compliment ever given in financial history',
  r089:'{name}\'s transaction history has more red candles than a satan-themed birthday party',
  r090:'mario opened {name}\'s chart, immediately closed the laptop, walked outside, and has not spoken since',
  r091:'buying high and selling low isn\'t a strategy, {name} — it\'s a disorder and there\'s no medication approved for it yet',
  r092:'the only thing more reliable than the market dumping is {name} being completely blindsided every single time it does',
  r093:'{name}\'s portfolio has seen more red than bowser\'s castle, his army, and every Koopa shell combined',
  r094:'{name} calls it long-term investing — financial regulators call it being trapped with no viable exit and no hope',
  r095:'{name} went all in because someone in a Telegram group said "this is the one" — it was not the one, it never was',
  r096:'mario wants {name} to know that a toad house minigame has better expected value than every trade they\'ve ever made',
  r097:'pikachu has never rage-quit a single match in thirty years — {name}\'s portfolio nearly ended that streak permanently',
  r098:'yoshi carried {name} through two bull markets and they still finished down — yoshi has retired and gone to therapy',
  r099:'{name} has more conviction than braincells, and bowser respects the sheer commitment to financial self-destruction',
  r100:'link found {name} wandering the lost woods, going in circles for three years, calling it "accumulation phase"',
  r101:'the only thing more painful than hyrule castle on master mode is {name}\'s tax situation after this year',
  r102:'DK threw a barrel blindfolded at a random chart and outperformed {name}\'s carefully considered DCA strategy',
  r103:'{name}\'s primary trading indicator is vibes — and the vibes have been objectively catastrophic since Q1',
  r104:'luigi stared at {name}\'s unrealised losses for a long time, then hugged them, then started crying again — no one knows whose losses triggered it',
  r105:'peach has been rugged by ganondorf seventeen times — still fewer times than {name} has been rugged this cycle alone',
  r106:'{name} put their savings into a shitcoin instead of a high-yield account and we are all bearing witness to the consequences',
  r107:'the blockchain is immutable, {name} — your entry price is permanently on-chain for all of history to see and judge',
  r108:'{name} said diamond hands — the market said liquidated — both statements were correct simultaneously',
  r109:'mario looked at {name}\'s 1W chart, made the sign of the cross even though he\'s a plumber, and walked away',
  r110:'wario showed up to steal {name}\'s bags and left empty-handed — said there was genuinely nothing worth taking',
  r111:'{name} read "number go up technology" and signed over their entire savings on the spot — no hesitation',
  r112:'samus has cleared planets of hostile life more efficiently than {name} has closed a single position in the green',
  r113:'fox said never give up — he later clarified he had not reviewed {name}\'s trade history before making that statement',
  r114:'{name} is conclusive proof that high conviction and actual competence are two completely unrelated traits',
  r115:'kirby absorbed {name}\'s entire trading strategy, immediately developed a gambling addiction, purged it, and filed a complaint',
  r116:'ganondorf has been losing for thirty years straight and still has a better ROI than {name} does this cycle',
  r117:'captain falcon looked at {name}\'s numbers, said FALCON NO, and has been in fetal position since',
  r118:'toad tried to warn {name} eleven times — he has since given up, started a farm, and never looked at a chart again',
  r119:'{name}\'s risk management strategy is to simply not open the app — medically valid, financially still a disaster',
  r120:'the market is ruthless and {name} is enthusiastic — these two things are incompatible and the results are well-documented',
};

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(request: Request): Promise<Response> {
  const url      = new URL(request.url);
  const origin   = url.origin;
  const userId   = Number(url.searchParams.get('u') ?? '0') || 0;
  const roastId  = url.searchParams.get('r') ?? 'r000';
  const charTag  = url.searchParams.get('c') ?? 'general';
  const username = url.searchParams.get('n') ?? 'anon';
  const avatarUrl = url.searchParams.get('a') ?? '';

  // `t` is optional — fall back to the lookup table so short share URLs work
  const tParam = url.searchParams.get('t');
  const roastText = tParam
    ? decodeURIComponent(tParam)
    : (ROAST_TEXT[roastId] ?? 'the market already roasted you harder than anything I could say');

  // Avatar: use `a` if provided, otherwise proxy via /api/avatar (uses BOT_TOKEN server-side)
  const effectiveAvatarUrl = avatarUrl || (userId ? `${origin}/api/avatar?uid=${userId}` : '');

  const week = isoWeek();
  const rng  = mulberry32(hashStringToSeed(`${userId}:render:${week}`));

  const tag      = resolveTag(charTag, rng);
  const stats    = generateStats(userId);
  const typeTag  = pickFrom(TYPES,  mulberry32(hashStringToSeed(`${userId}:type:${week}`)));
  const scene    = pickFrom(SCENES, mulberry32(hashStringToSeed(`${userId}:scene:${roastId}`)));
  const cardNum  = roastId.replace(/\D/g, '').padStart(3, '0');
  const text     = roastText.replace(/\{name\}/g, username);

  // ── Parallel asset fetch ───────────────────────────────────────────────────
  const [fontData, charData, logoData, avatarData] = await Promise.allSettled([
    fetch(`${origin}/fonts/BowlbyOne-Regular.ttf`).then(r => r.ok ? r.arrayBuffer() : null),
    fetch(`${origin}/characters/${tag}.png`).then(r => r.ok ? r.arrayBuffer() : null),
    fetch(`${origin}/logo-mark.png`).then(r => r.ok ? r.arrayBuffer() : null),
    effectiveAvatarUrl ? fetch(effectiveAvatarUrl).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null) : Promise.resolve(null),
  ]);

  const font   = fontData.status   === 'fulfilled' && fontData.value   ? fontData.value   : null;
  const char   = charData.status   === 'fulfilled' && charData.value   ? charData.value   : null;
  const logo   = logoData.status   === 'fulfilled' && logoData.value   ? logoData.value   : null;
  const avatar = avatarData.status === 'fulfilled' && avatarData.value ? avatarData.value : null;

  const toDataUri = (buf: ArrayBuffer | null, mime: string): string | null => {
    if (!buf) return null;
    const bytes = new Uint8Array(buf);
    let binary = '';
    // Loop avoids call-stack overflow from spreading large Uint8Arrays
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${mime};base64,${btoa(binary)}`;
  };

  const charUri   = toDataUri(char,   'image/png');
  const logoUri   = toDataUri(logo,   'image/png');
  const avatarUri = avatar ? toDataUri(avatar, 'image/jpeg') : null;

  const fonts = font ? [{ name: 'BowlbyOne', data: font, style: 'normal' as const, weight: 400 as const }] : [];

  // ── StatRow helper ─────────────────────────────────────────────────────────
  const StatRow = ({ label, v, red = false }: { label: string; v: string; red?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
      <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>{label}</span>
      <span style={{ color: red ? '#f87171' : '#e2e8f0', fontSize: 12, fontFamily: 'BowlbyOne, sans-serif' }}>{v}</span>
    </div>
  );

  // ── Card JSX (540 × 960) — section heights: 80+36+55+424+170+130+65 = 960
  const card = (
    <div style={{ width: 540, height: 960, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #2d1a4e 0%, #1a0f2e 100%)',
      border: '3px solid #1a0a2e', fontFamily: 'BowlbyOne, sans-serif', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

        {/* Top logo bar — full width red, wordmark as styled text */}
        <div style={{ display: 'flex', height: 80, width: '100%', background: RED, alignItems: 'center', justifyContent: 'center', borderBottom: `4px solid ${YELLOW}` }}>
          <span style={{ color: '#fff', fontSize: 54, letterSpacing: -1, fontFamily: 'BowlbyOne, sans-serif', lineHeight: 1 }}>NIN</span>
          <span style={{ color: BLUE,  fontSize: 54, letterSpacing: -1, fontFamily: 'BowlbyOne, sans-serif', lineHeight: 1 }}>TON</span>
          <span style={{ color: '#fff', fontSize: 54, letterSpacing: -1, fontFamily: 'BowlbyOne, sans-serif', lineHeight: 1 }}>DO</span>
        </div>

        {/* Sub-bar: CERTIFIED DEGEN | TYPE */}
        <div style={{ display: 'flex', height: 36, width: '100%' }}>
          <div style={{ display: 'flex', flex: 1, background: BLUE, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ color: YELLOW, fontSize: 11, letterSpacing: 3 }}>CERTIFIED</span>
            <span style={{ color: '#fff', fontSize: 13, letterSpacing: 2 }}>DEGEN</span>
          </div>
          <div style={{ display: 'flex', width: 200, background: '#1a0a2e', alignItems: 'center', justifyContent: 'center', gap: 6, borderLeft: `2px solid ${YELLOW}` }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 2 }}>TYPE</span>
            <span style={{ color: YELLOW, fontSize: typeTag.length > 16 ? 9 : 11, letterSpacing: 1 }}>{typeTag}</span>
          </div>
        </div>

      </div>

      {/* USERNAME ROW */}
      <div style={{ display: 'flex', height: 55, background: DARK, alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `2px solid ${RED}` }}>
        <span style={{ color: '#fff', fontSize: 25, maxWidth: 270, overflow: 'hidden' }}>@{username}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#888', fontSize: 12, marginRight: 2 }}>HP</span>
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} style={{ width: 8, height: 8, background: i < 2 ? '#ef4444' : '#1f1f3a', border: '1px solid #333' }} />
          ))}
          <span style={{ color: '#ef4444', fontSize: 12, marginLeft: 3 }}>2/10</span>
        </div>
      </div>

      {/* ILLUSTRATION */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 424,
        background: 'linear-gradient(180deg, #3d1a6e 0%, #2d0a4e 55%, #1a0a2e 100%)', padding: '16px 24px 10px' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', width: 160, height: 160, borderRadius: '50%',
            border: `3px solid ${YELLOW}`, overflow: 'hidden', flexShrink: 0, background: '#1e1b4b', alignItems: 'center', justifyContent: 'center' }}>
            {avatarUri
              ? <img src={avatarUri} width={160} height={160} style={{ objectFit: 'cover' }} />
              : <span style={{ color: '#6b7280', fontSize: 60 }}>?</span>}
          </div>
          {/* Character cameo */}
          {charUri && (
            <img src={charUri} style={{ height: 210, width: 200, objectFit: 'contain', transform: 'rotate(7deg)', flexShrink: 0 }} />
          )}
        </div>
        {/* Scene pill */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.58)', borderRadius: 20, padding: '5px 14px', border: '1px solid rgba(255,204,0,0.25)' }}>
            <span style={{ color: YELLOW, fontSize: 11, letterSpacing: 2, fontFamily: 'monospace' }}>SCENE: {scene}</span>
          </div>
        </div>
      </div>

      {/* ROAST PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 170, background: CREAM, padding: '11px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <span style={{ color: RED, fontSize: 19 }}>★</span>
          <span style={{ color: RED, fontSize: 17, letterSpacing: 1 }}>ROAST ATTACK</span>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <span style={{ color: '#2d1a4e', fontSize: text.length > 140 ? 14 : text.length > 100 ? 16 : 18,
            fontStyle: 'italic', fontFamily: 'serif', lineHeight: 1.4, wordBreak: 'break-word' }}>
            "{text}"
          </span>
        </div>
      </div>

      {/* STATS PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 130, background: DARK, padding: '9px 24px 7px', borderTop: `2px solid #4c1d95` }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 7 }}>
          <span style={{ color: PURPLE, fontSize: 12, fontFamily: 'monospace', letterSpacing: 2 }}>— DEGEN PROFILE —</span>
        </div>
        <div style={{ display: 'flex', flex: 1, gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <StatRow label="PAPERHAND IDX" v={`${stats.paperhandIndex}%`} red={stats.paperhandIndex >= 85} />
            <StatRow label="LIQ RISK"      v={stats.liquidationRisk} red />
            <StatRow label="MENTAL STATE"  v={stats.mentalState} red />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <StatRow label="LAST TOP"   v={stats.lastBoughtTheTop} />
            <StatRow label="COPE"       v={stats.favoriteCope} />
            <StatRow label="NET WORTH Δ" v={stats.netWorthDelta} red />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 65,
        background: `linear-gradient(90deg, ${RED} 0%, ${BLUE} 50%, ${RED} 100%)`,
        alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <span style={{ color: '#fff', fontSize: 15 }}>CARD #{cardNum} · $NINTONDO on TON</span>
        <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 9 }}>unofficial parody · not affiliated with any video game company</span>
      </div>

    </div>
  );

  const image = new ImageResponse(card, { width: 540, height: 960, fonts });

  return new Response(image.body, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
