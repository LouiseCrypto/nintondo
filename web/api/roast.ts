// POST /api/roast — Edge Runtime, fully self-contained, zero relative imports.
// Everything is inlined because Vercel cannot resolve _shared/ at runtime
// in either Edge or Node.js functions when bundled with esbuild.

export const config = { runtime: 'edge' };

// ── Roast pool ────────────────────────────────────────────────────────────

interface Roast {
  id: string; text: string; category: string; character_tag: string; weight: number;
}

const ROASTS: Roast[] = [
  { id:'r001', text:'{name} just walked in smelling like failure and cheap leverage — congrats on finding us', category:'welcome', character_tag:'general', weight:1 },
  { id:'r002', text:'mario saw {name} join and immediately dumped his bags on them — he\'s done this before', category:'welcome', character_tag:'mario', weight:1 },
  { id:'r003', text:'pikachu shorted {name} the second they entered the chat — already up 40x, no remorse', category:'welcome', character_tag:'pikachu', weight:1 },
  { id:'r004', text:'DK could smell {name}\'s entry price from the top of the tower — it smells like a margin call', category:'welcome', character_tag:'dk', weight:1 },
  { id:'r005', text:'peach took one look at {name}\'s wallet address and reported it to the authorities as a crime scene', category:'welcome', character_tag:'peach', weight:1 },
  { id:'r006', text:'luigi has been down bad for three years and {name} still walked in looking worse — respect the hustle', category:'welcome', character_tag:'luigi', weight:1 },
  { id:'r007', text:'bowser conquered the entire mushroom kingdom in less time than {name} will take to break even', category:'welcome', character_tag:'bowser', weight:1 },
  { id:'r008', text:'yoshi took one bite of {name}\'s portfolio and immediately laid an egg in pure disgust', category:'welcome', character_tag:'yoshi', weight:1 },
  { id:'r009', text:'link pulled out the ocarina of time specifically to go back and warn {name} not to ape in — they didn\'t listen', category:'welcome', character_tag:'link', weight:1 },
  { id:'r010', text:'the market opened a position against {name} before they even finished typing their username', category:'welcome', character_tag:'general', weight:1 },
  { id:'r011', text:'{name} joined this chat and immediately made every other degen feel significantly better about their choices', category:'welcome', character_tag:'general', weight:1 },
  { id:'r012', text:'mario paused mid-shroom to welcome {name} — took one look at the portfolio and went back to snorting', category:'welcome', character_tag:'mario', weight:1 },
  { id:'r013', text:'{name} really replied to me with that energy — brave move for someone whose last trade was a hate crime against their own savings', category:'reply', character_tag:'general', weight:1 },
  { id:'r014', text:'mario read {name}\'s reply, counted his coins, confirmed he has more, and went back to not caring', category:'reply', character_tag:'mario', weight:1 },
  { id:'r015', text:'pikachu took {name}\'s reply personally and used thunder on their router — now neither of you can check the chart', category:'reply', character_tag:'pikachu', weight:1 },
  { id:'r016', text:'DK benched your entire net worth this morning, {name} — it was the lightest lift of his week', category:'reply', character_tag:'dk', weight:1 },
  { id:'r017', text:'peach read {name}\'s reply, added them to a spreadsheet titled DO NOT LEND MONEY TO, and said nothing', category:'reply', character_tag:'peach', weight:1 },
  { id:'r018', text:'luigi was already crying when {name} sent that — somehow it made things worse', category:'reply', character_tag:'luigi', weight:1 },
  { id:'r019', text:'bowser has enslaved entire civilisations — {name}\'s reply is somehow more oppressive than any of that', category:'reply', character_tag:'bowser', weight:1 },
  { id:'r020', text:'yoshi swallowed {name}\'s take whole, ran to the toilet immediately, and has not been seen since', category:'reply', character_tag:'yoshi', weight:1 },
  { id:'r021', text:'link unsheathed the master sword just to slash {name}\'s reply in half — it still wasn\'t enough to kill it', category:'reply', character_tag:'link', weight:1 },
  { id:'r022', text:'{name} typed that with the confidence of someone who has never once been right about anything financial', category:'reply', character_tag:'general', weight:1 },
  { id:'r023', text:'the audacity of {name} replying to me like I haven\'t already seen their on-chain history — it\'s documented', category:'reply', character_tag:'general', weight:1 },
  { id:'r024', text:'mario coughed so hard reading {name}\'s reply that he blew an entire mushroom stash — total loss, still funnier than the message', category:'reply', character_tag:'mario', weight:1 },
  { id:'r025', text:'{name} bought the exact top — mario watched it happen in real time, pointed, and never stopped pointing', category:'targeted', character_tag:'mario', weight:1 },
  { id:'r026', text:'pikachu\'s leverage position is more responsible than anything {name} has ever done with money', category:'targeted', character_tag:'pikachu', weight:1 },
  { id:'r027', text:'DK has thrown barrels more precisely than {name} has ever placed a limit order in their life', category:'targeted', character_tag:'dk', weight:1 },
  { id:'r028', text:'peach blocked {name} on every platform after seeing the wallet — not out of spite, out of self-preservation', category:'targeted', character_tag:'peach', weight:1 },
  { id:'r029', text:'luigi sobbed looking at {name}\'s PnL — and luigi once cried at a loading screen so that\'s really saying something', category:'targeted', character_tag:'luigi', weight:1 },
  { id:'r030', text:'{name} is so committed to losing money that bowser has offered them a job doing it professionally', category:'targeted', character_tag:'bowser', weight:1 },
  { id:'r031', text:'yoshi refused to carry {name} after what they did to their own stop-loss — he has boundaries now', category:'targeted', character_tag:'yoshi', weight:1 },
  { id:'r032', text:'link finished every dungeon in hyrule, defeated ganon, and saved the timeline faster than {name} has broken even once', category:'targeted', character_tag:'link', weight:1 },
  { id:'r033', text:'{name} is still holding bags from the last cycle, calling it a long-term investment while crying into a cold dinner', category:'universal', character_tag:'general', weight:1 },
  { id:'r034', text:'your entry price is not just bad, {name} — it\'s an insult to the concept of arithmetic', category:'universal', character_tag:'general', weight:1 },
  { id:'r035', text:'the chart went up specifically to dump on {name} — the market has developed a personal vendetta and it is winning', category:'universal', character_tag:'general', weight:1 },
  { id:'r036', text:'{name}\'s strategy: buy the rumour, sell the news, cry about the rug, repeat until broke', category:'universal', character_tag:'general', weight:1 },
  { id:'r037', text:'mario looked at {name}\'s wallet history and called it the saddest piece of performance art he\'d ever seen', category:'universal', character_tag:'mario', weight:1 },
  { id:'r038', text:'pikachu\'s entire net worth — in Pokédollars — still outperforms {name}\'s unrealised gains', category:'universal', character_tag:'pikachu', weight:1 },
  { id:'r039', text:'DK\'s banana hoard has delivered a 4,700% return YTD while {name} is still explaining why the thesis is valid', category:'universal', character_tag:'dk', weight:1 },
  { id:'r040', text:'{name} is living proof that access to leverage should require a psychiatric evaluation first', category:'universal', character_tag:'general', weight:1 },
  { id:'r041', text:'wario entered the chat the moment {name} did — he can smell a mark from three blockchains away', category:'welcome', character_tag:'wario', weight:1 },
  { id:'r042', text:'toad sprinted to warn the whole chat that {name} was coming — nobody believed it could be this bad', category:'welcome', character_tag:'toad', weight:1 },
  { id:'r043', text:'the degen gods saw {name} join, looked at each other, and said "this one\'s going to be fun to watch implode"', category:'welcome', character_tag:'general', weight:1 },
  { id:'r044', text:'kirby inhaled {name}\'s entire financial future in one breath — tasted like gas fees and regret', category:'welcome', character_tag:'kirby', weight:1 },
  { id:'r045', text:'samus scanned {name}\'s wallet on arrival and marked it as a biohazard — do not touch without protection', category:'welcome', character_tag:'samus', weight:1 },
  { id:'r046', text:'fox told {name} to do a barrel roll — right into a 50x long at the absolute top of the market', category:'welcome', character_tag:'fox', weight:1 },
  { id:'r047', text:'ganondorf cancelled his world domination plan when {name} arrived — this required zero effort to destroy', category:'welcome', character_tag:'ganondorf', weight:1 },
  { id:'r048', text:'captain falcon pointed at {name}\'s portfolio and screamed SHOW ME YOUR TRADES — then immediately filed for therapy', category:'welcome', character_tag:'captain_falcon', weight:1 },
  { id:'r049', text:'{name} rolled in with the energy of someone who found crypto three weeks ago and is already correcting others', category:'welcome', character_tag:'general', weight:1 },
  { id:'r050', text:'mario put the mushrooms down when {name} showed up — reality is already more unhinged than anything he could hallucinate', category:'welcome', character_tag:'mario', weight:1 },
  { id:'r051', text:'{name} just walked into the most financially dangerous group chat in their life — and they look excited about it', category:'welcome', character_tag:'general', weight:1 },
  { id:'r052', text:'pikachu zapped {name} on arrival as a welcome gift — 50,000 volts and still couldn\'t shock them into making better decisions', category:'welcome', character_tag:'pikachu', weight:1 },
  { id:'r053', text:'DK beat his chest when {name} joined — he\'s been waiting for someone new to financially humiliate', category:'welcome', character_tag:'dk', weight:1 },
  { id:'r054', text:'luigi spotted {name} and waved them over immediately — misery loves company and he has a lot of both', category:'welcome', character_tag:'luigi', weight:1 },
  { id:'r055', text:'peach sent a polite welcome note, then quietly moved {name}\'s address to her blocked-for-financial-crimes list', category:'welcome', character_tag:'peach', weight:1 },
  { id:'r056', text:'bowser added {name} to his list of planned conquests — ranked last because there\'s nothing left to take', category:'welcome', character_tag:'bowser', weight:1 },
  { id:'r057', text:'yoshi gave {name} a lift in, dropped them at the worst entry point imaginable, bolted, and has filed a restraining order', category:'welcome', character_tag:'yoshi', weight:1 },
  { id:'r058', text:'link checked all three pieces of the triforce for {name}\'s financial destiny — wisdom said no, courage said no, power said absolutely not', category:'welcome', character_tag:'link', weight:1 },
  { id:'r059', text:'{name} entered this chat like they had a plan — the market was notified and immediately adjusted accordingly', category:'welcome', character_tag:'general', weight:1 },
  { id:'r060', text:'wario smelled {name}\'s wallet from the other side of the chain — described the aroma as "fresh rekt"', category:'welcome', character_tag:'wario', weight:1 },
  { id:'r061', text:'nobody asked for {name}\'s opinion but here it is anyway, and here we all are, worse off for having read it', category:'reply', character_tag:'general', weight:1 },
  { id:'r062', text:'wario read {name}\'s reply and immediately tried to charge a stupidity fee — said it\'s the only tax he supports', category:'reply', character_tag:'wario', weight:1 },
  { id:'r063', text:'toad processed {name}\'s message faster than their stop-loss ever triggered — which means it didn\'t trigger at all', category:'reply', character_tag:'toad', weight:1 },
  { id:'r064', text:'kirby inhaled {name}\'s take, gained the ability to make terrible financial decisions, and immediately spat it back out', category:'reply', character_tag:'kirby', weight:1 },
  { id:'r065', text:'samus locked onto {name}\'s reply, classified it as a hostile life form, and is considering orbital bombardment', category:'reply', character_tag:'samus', weight:1 },
  { id:'r066', text:'fox told {name} to trust the mission — then read their reply, cancelled the mission, and went home', category:'reply', character_tag:'fox', weight:1 },
  { id:'r067', text:'ganondorf has destroyed entire kingdoms with less effort than {name} is putting into being wrong about this', category:'reply', character_tag:'ganondorf', weight:1 },
  { id:'r068', text:'captain falcon showed {name} what a FALCON PUNCH looks like — it\'s just a screenshot of their PnL', category:'reply', character_tag:'captain_falcon', weight:1 },
  { id:'r069', text:'{name} sent that reply with the energy of someone who has never once audited their own transaction history and never will', category:'reply', character_tag:'general', weight:1 },
  { id:'r070', text:'mario counted all his coins after reading {name}\'s message — still more than {name}\'s entire portfolio, by a lot', category:'reply', character_tag:'mario', weight:1 },
  { id:'r071', text:'pikachu discharged every stored volt reacting to {name}\'s take — wasted electricity, accomplished nothing, just like the trade', category:'reply', character_tag:'pikachu', weight:1 },
  { id:'r072', text:'DK stopped mid-climb, stared at {name}\'s reply for a long time, and then kept climbing without making a single sound', category:'reply', character_tag:'dk', weight:1 },
  { id:'r073', text:'luigi wanted to respond to {name} but he\'s already at emotional capacity and cannot take on more suffering right now', category:'reply', character_tag:'luigi', weight:1 },
  { id:'r074', text:'bowser issued {name} a formal summons for crimes against coherent market analysis — sentencing is set for next red candle', category:'reply', character_tag:'bowser', weight:1 },
  { id:'r075', text:'yoshi laid an egg reading {name}\'s reply — his fourth today — only {name} can make him do that twice in a row', category:'reply', character_tag:'yoshi', weight:1 },
  { id:'r076', text:'{name} bought what they thought was a dip — it was not a dip, it was a cliff, and they are still falling', category:'targeted', character_tag:'general', weight:1 },
  { id:'r077', text:'wario invested one position alongside {name}, sensed the energy, exited immediately, and tripled — {name} is still in', category:'targeted', character_tag:'wario', weight:1 },
  { id:'r078', text:'kirby accidentally absorbed {name}\'s trading strategy, immediately developed financial anxiety, and had to see a therapist', category:'targeted', character_tag:'kirby', weight:1 },
  { id:'r079', text:'samus has hunted the most dangerous creatures in the galaxy — {name}\'s entry price is somehow the scariest thing she\'s seen', category:'targeted', character_tag:'samus', weight:1 },
  { id:'r080', text:'{name} has survived three separate 80% drawdowns purely by refusing to check the price — calling this a "strategy"', category:'targeted', character_tag:'general', weight:1 },
  { id:'r081', text:'ganondorf built a dark empire in less time than {name} has spent explaining why they haven\'t sold yet', category:'targeted', character_tag:'ganondorf', weight:1 },
  { id:'r082', text:'captain falcon timed {name}\'s entry — 0 km/h, 100% delusion, somehow still in the race', category:'targeted', character_tag:'captain_falcon', weight:1 },
  { id:'r083', text:'{name}\'s portfolio looks like the final boss of a game that was designed to be impossible — and unwinnable', category:'targeted', character_tag:'general', weight:1 },
  { id:'r084', text:'DK randomly threw a barrel and it outperformed every limit order {name} has ever placed — it was an accident', category:'targeted', character_tag:'dk', weight:1 },
  { id:'r085', text:'link has rescued the same princess seventeen times — still more successful exits than {name} has managed all cycle', category:'targeted', character_tag:'link', weight:1 },
  { id:'r086', text:'{name} has called the bottom five times — wrong five times — is currently calling it again with full confidence', category:'targeted', character_tag:'general', weight:1 },
  { id:'r087', text:'peach has been kidnapped more times than she can count and still has a better exit strategy than {name}', category:'targeted', character_tag:'peach', weight:1 },
  { id:'r088', text:'luigi saw {name}\'s PnL and said "at least I\'m not alone" — the saddest compliment ever given in financial history', category:'targeted', character_tag:'luigi', weight:1 },
  { id:'r089', text:'{name}\'s transaction history has more red candles than a satan-themed birthday party', category:'targeted', character_tag:'general', weight:1 },
  { id:'r090', text:'mario opened {name}\'s chart, immediately closed the laptop, walked outside, and has not spoken since', category:'targeted', character_tag:'mario', weight:1 },
  { id:'r091', text:'buying high and selling low isn\'t a strategy, {name} — it\'s a disorder and there\'s no medication approved for it yet', category:'universal', character_tag:'general', weight:1 },
  { id:'r092', text:'the only thing more reliable than the market dumping is {name} being completely blindsided every single time it does', category:'universal', character_tag:'general', weight:1 },
  { id:'r093', text:'{name}\'s portfolio has seen more red than bowser\'s castle, his army, and every Koopa shell combined', category:'universal', character_tag:'bowser', weight:1 },
  { id:'r094', text:'{name} calls it long-term investing — financial regulators call it being trapped with no viable exit and no hope', category:'universal', character_tag:'general', weight:1 },
  { id:'r095', text:'{name} went all in because someone in a Telegram group said "this is the one" — it was not the one, it never was', category:'universal', character_tag:'general', weight:1 },
  { id:'r096', text:'mario wants {name} to know that a toad house minigame has better expected value than every trade they\'ve ever made', category:'universal', character_tag:'mario', weight:1 },
  { id:'r097', text:'pikachu has never rage-quit a single match in thirty years — {name}\'s portfolio nearly ended that streak permanently', category:'universal', character_tag:'pikachu', weight:1 },
  { id:'r098', text:'yoshi carried {name} through two bull markets and they still finished down — yoshi has retired and gone to therapy', category:'universal', character_tag:'yoshi', weight:1 },
  { id:'r099', text:'{name} has more conviction than braincells, and bowser respects the sheer commitment to financial self-destruction', category:'universal', character_tag:'bowser', weight:1 },
  { id:'r100', text:'link found {name} wandering the lost woods, going in circles for three years, calling it "accumulation phase"', category:'universal', character_tag:'link', weight:1 },
  { id:'r101', text:'the only thing more painful than hyrule castle on master mode is {name}\'s tax situation after this year', category:'universal', character_tag:'general', weight:1 },
  { id:'r102', text:'DK threw a barrel blindfolded at a random chart and outperformed {name}\'s carefully considered DCA strategy', category:'universal', character_tag:'dk', weight:1 },
  { id:'r103', text:'{name}\'s primary trading indicator is vibes — and the vibes have been objectively catastrophic since Q1', category:'universal', character_tag:'general', weight:1 },
  { id:'r104', text:'luigi stared at {name}\'s unrealised losses for a long time, then hugged them, then started crying again — no one knows whose losses triggered it', category:'universal', character_tag:'luigi', weight:1 },
  { id:'r105', text:'peach has been rugged by ganondorf seventeen times — still fewer times than {name} has been rugged this cycle alone', category:'universal', character_tag:'peach', weight:1 },
  { id:'r106', text:'{name} put their savings into a shitcoin instead of a high-yield account and we are all bearing witness to the consequences', category:'universal', character_tag:'general', weight:1 },
  { id:'r107', text:'the blockchain is immutable, {name} — your entry price is permanently on-chain for all of history to see and judge', category:'universal', character_tag:'general', weight:1 },
  { id:'r108', text:'{name} said diamond hands — the market said liquidated — both statements were correct simultaneously', category:'universal', character_tag:'general', weight:1 },
  { id:'r109', text:'mario looked at {name}\'s 1W chart, made the sign of the cross even though he\'s a plumber, and walked away', category:'universal', character_tag:'mario', weight:1 },
  { id:'r110', text:'wario showed up to steal {name}\'s bags and left empty-handed — said there was genuinely nothing worth taking', category:'universal', character_tag:'wario', weight:1 },
  { id:'r111', text:'{name} read "number go up technology" and signed over their entire savings on the spot — no hesitation', category:'universal', character_tag:'general', weight:1 },
  { id:'r112', text:'samus has cleared planets of hostile life more efficiently than {name} has closed a single position in the green', category:'universal', character_tag:'samus', weight:1 },
  { id:'r113', text:'fox said never give up — he later clarified he had not reviewed {name}\'s trade history before making that statement', category:'universal', character_tag:'fox', weight:1 },
  { id:'r114', text:'{name} is conclusive proof that high conviction and actual competence are two completely unrelated traits', category:'universal', character_tag:'general', weight:1 },
  { id:'r115', text:'kirby absorbed {name}\'s entire trading strategy, immediately developed a gambling addiction, purged it, and filed a complaint', category:'universal', character_tag:'kirby', weight:1 },
  { id:'r116', text:'ganondorf has been losing for thirty years straight and still has a better ROI than {name} does this cycle', category:'universal', character_tag:'ganondorf', weight:1 },
  { id:'r117', text:'captain falcon looked at {name}\'s numbers, said FALCON NO, and has been in fetal position since', category:'universal', character_tag:'captain_falcon', weight:1 },
  { id:'r118', text:'toad tried to warn {name} eleven times — he has since given up, started a farm, and never looked at a chart again', category:'universal', character_tag:'toad', weight:1 },
  { id:'r119', text:'{name}\'s risk management strategy is to simply not open the app — medically valid, financially still a disaster', category:'universal', character_tag:'general', weight:1 },
  { id:'r120', text:'the market is ruthless and {name} is enthusiastic — these two things are incompatible and the results are well-documented', category:'universal', character_tag:'general', weight:1 },
];

// ── Stats generator ───────────────────────────────────────────────────────

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
const TOPS = ['yesterday','2 days ago','3 days ago','last week','2 weeks ago','last month','3 months ago','during the last bull run','when Mario said it was guaranteed','the exact moment it peaked'];
const COPE = ['wagmi','zoom out','this is the accumulation zone','the whales are suppressing it','down 90% is just up 1000% inverted','my cost basis is basically zero','the fundamentals haven\'t changed','just gotta wait for the next cycle','this is actually bullish','technically not a loss if I don\'t sell'];
const DELT = ['-73% YTD','-87% YTD','-91% YTD','-64% YTD','-99.2% from ATH','-82% since going all in','-68% this cycle','+0.3% (gas fees not included)','-100% (margin call, RIP)'];

function generateStats(userId: number) {
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

// ── Anti-repetition (in-memory, resets on cold start) ────────────────────

const recentlyServed = new Map<number, string[]>();

function pickRoast(userId: number, category?: string): Roast {
  let pool = category ? ROASTS.filter(r => r.category === category) : ROASTS;
  if (pool.length === 0) pool = ROASTS;
  const recent = recentlyServed.get(userId) ?? [];
  const fresh = pool.filter(r => !recent.includes(r.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const total = candidates.reduce((s, r) => s + r.weight, 0);
  let cursor = Math.random() * total;
  for (const r of candidates) { cursor -= r.weight; if (cursor <= 0) return r; }
  return candidates[candidates.length - 1];
}

function recordServed(userId: number, roastId: string): void {
  const recent = recentlyServed.get(userId) ?? [];
  recentlyServed.set(userId, [roastId, ...recent].slice(0, 20));
}

// ── Handler ───────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const rawId    = body.userId;
  const userId   = typeof rawId === 'number' ? rawId : Number(rawId ?? 0);
  const uid      = Number.isFinite(userId) ? userId : 0;
  const category = typeof body.category  === 'string' ? body.category  : undefined;
  const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
  const username  = typeof body.username  === 'string' ? body.username  : undefined;
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined;

  const roast = pickRoast(uid, category);
  recordServed(uid, roast.id);

  // roastName = what goes in the roast text (first name reads more natural)
  // displayName = what shows on the card's @handle area (username preferred)
  const roastName   = firstName ?? username ?? 'anon';
  const displayName = username  ?? firstName ?? 'anon';
  const text = roast.text.replace(/\{name\}/g, roastName);
  const stats = generateStats(uid);

  const host = request.headers.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const params = new URLSearchParams({ u: String(uid), r: roast.id, n: displayName, t: text, c: roast.character_tag });
  if (avatarUrl) params.set('a', avatarUrl);

  return json({ roast: { ...roast, text }, stats, cardUrl: `${proto}://${host}/api/card?${params}` });
}
