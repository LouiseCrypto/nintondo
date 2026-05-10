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
const TYPES = ['BAGHOLDER','FINANCIALLY-CUCKED','SERIAL-RUGPULL-VICTIM','COPIUM-OVERDOSE',
  'EXIT-LIQUIDITY-WHORE','LEVERAGE-ADDICT','MARGIN-CALL-MAGNET','PORTFOLIO-CUCK',
  'DEGEN-BEYOND-REPAIR','HOPIUM-JUNKIE','CHART-ILLITERATE','JEET-SUPREME',
  'LIQUIDATION-FETISHIST','BOTTOM-BUYER-NEVER','TOP-SIGNAL-INCARNATE','BROKE-AND-LOUD',
  'SHITCOIN-SOMMELIER','RUG-CONNOISSEUR','POVERTY-SPEEDRUNNER','LOSS-PORN-CREATOR',
  'WIFE-LEFT-STILL-HOLDING','RENT-MONEY-YOLO','NGMI-FINAL-FORM','CERTIFIED-CLOWN',
  'FOMO-SLAVE','WHALE-BAIT','CAPITULATION-KING','DUMPSTER-DIVER','APE-BRAINED',
  'GLORIFIED-LIQUIDITY','STOP-LOSS-ALLERGIC','DELUSION-MAXI','POVERTY-ENJOYER',
  'FINANCIALLY-UNHINGED','TRUST-ME-BRO-TRADER'] as const;

// ── Scene captions ────────────────────────────────────────────────────────────
const SCENES = ['CRYING INTO RAMEN','EXPLAINING LOSSES TO WIFE\'S BOYFRIEND',
  '3AM DRUNK TRADING','RAGE-SELLING AT BOTTOM','BEGGING FOR SEED PHRASE BACK',
  'PAWNING WEDDING RING FOR GAS FEES','SLEEPING IN THE CAR AGAIN',
  'JERKING OFF TO OLD PORTFOLIO SCREENSHOTS','GOOGLING HOW TO FAKE OWN DEATH',
  'TELLING MOM IT\'S A TECH JOB','EATING CEREAL WITH WATER',
  'APPLYING FOR WENDY\'S SHIFT MANAGER','REFRESHING WALLET AT FUNERAL',
  'PANIC-SELLING DURING SEX','CALLING EX FOR RENT MONEY',
  'WRITING SUICIDE NOTE THEN BUYING MORE','HIDING PHONE FROM DEBT COLLECTORS',
  'SNORTING COPIUM OFF DEXSCREENER','BLOWING LAST $50 ON A MEMECOIN',
  'CRYING IN MCDONALD\'S PARKING LOT'] as const;

// ── Stats ─────────────────────────────────────────────────────────────────────
const RISK_LEVELS  = ['TERMINAL','CRITICAL','CATASTROPHIC','FUCKED','COOKED','DOOMED','HOSPICE-TIER','BEYOND-SAVING','FINANCIALLY-DEAD','OBITUARY-PENDING','PRAYING-WON\'T-HELP','ABSOLUTELY-FUCKED','RECTALLY-RUINED','GOD-LEFT-THE-CHAT','SELL-YOUR-ORGANS'];
const MENTAL_STATES = ['COPING','DELUSIONAL','DISSOCIATING','CATATONIC','ROPING','BROKEN','FETAL-POSITION','TALKING-TO-WALLS','ARGUING-WITH-CHARTS','LOSING-WILL-TO-LIVE','PSYCHOTIC-BREAK','CRYING-MASTURBATING','BLACKED-OUT','PRAYING-TO-SATOSHI','CLINICALLY-REGARDED'];
const COPES = ['HODL','ZOOM OUT','ITS FINE','BUYING DIP','PRAYING','DENIAL','STAKING','AVERAGING DOWN AGAIN','IGNORING CHARTS',
  'TELLING WIFE ITS FINE','CALLING IT RESEARCH','BLAMING WHALES','BLAMING THE DEVS','JOINING A CULT','PRETENDING TO WORK',
  'SELLING PLASMA','BECOMING A MONK','DRINKING HEAVILY','ASKING MOM FOR MONEY','ONLYFANS APPLICATION'];
const TOPS = ['JAN 2021','MAY 2021','NOV 2021','LUNA TOP','FTX EVE','ETH MERGE','BTC ATH','EVERY SINGLE TOP','LITERALLY YESTERDAY',
  'THE EXACT MILLISECOND','5 MINS BEFORE RUG','RIGHT AFTER TWEETING','DURING THE PUMP','THE ONE THAT HURT MOST'];

function generateStats(userId: number, roastId: string) {
  const rng  = mulberry32(hashStringToSeed(`${userId}:stats:${roastId}`));
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
  r001:'{name} just crawled in here smelling like margin calls and desperation — the market already fucked you, we\'re just the afterparty',
  r002:'mario saw {name} join, laughed so hard he pissed mushroom juice, and immediately used them as exit liquidity',
  r003:'pikachu shorted {name} on sight and came so hard from the profits he blew a fuse — 40x no lube, no remorse',
  r004:'DK took one whiff of {name}\'s entry price and dry-heaved off the top of the tower — it smells like financial AIDS',
  r005:'peach saw {name}\'s wallet and called the police, a priest, and a fucking coroner — in that order',
  r006:'luigi has been financially cucked for three straight years and {name} still walked in looking more pathetic — genuinely impressive',
  r007:'bowser enslaved an entire kingdom faster than {name} will ever break even — and bowser didn\'t even have to leverage up like a dipshit',
  r008:'yoshi ate {name}\'s portfolio and immediately shit it out — said it tasted like burnt money and broken dreams',
  r009:'link used the ocarina of time to go back and warn {name} not to ape in — {name} told him to fuck off and bought the top anyway',
  r010:'the market bent {name} over before they even finished typing their username — no foreplay, no safeword',
  r011:'{name} walked in and every degen in the chat suddenly felt like Warren fucking Buffett by comparison',
  r012:'mario stopped doing shrooms to welcome {name} — saw the portfolio, snorted twice as hard, and said "this poor bastard"',
  r013:'{name} really clapped back at me like their portfolio isn\'t a fucking crime scene — your last trade was a hate crime against your own bloodline\'s wealth',
  r014:'mario read {name}\'s reply, checked his net worth, confirmed he makes more taking a shit than {name} makes all year, and moved on',
  r015:'pikachu electrocuted {name}\'s router just to save them from their next trade — mercy killing their wifi was an act of charity',
  r016:'DK curled {name}\'s entire net worth as a warm-up this morning — said it was the most pathetic weight he\'s ever lifted',
  r017:'peach read {name}\'s reply and added them to a spreadsheet titled PEOPLE TOO STUPID TO BREATHE AND TRADE SIMULTANEOUSLY',
  r018:'luigi was already sobbing into his empty wallet when {name} replied — somehow {name} made a crying man feel even worse about himself',
  r019:'bowser has committed actual war crimes that are less offensive than the garbage {name} just typed',
  r020:'yoshi swallowed {name}\'s take, immediately projectile-vomited, and checked himself into rehab — one exposure was enough',
  r021:'link pulled out the master sword to cut {name}\'s reply in half but the sword refused — even sacred weapons have standards',
  r022:'{name} typed that with the confidence of someone who has never been right about a single fucking thing in their entire financial life',
  r023:'the absolute balls on {name} replying to me when their on-chain history reads like a fucking snuff film of money being murdered',
  r024:'mario laughed so hard at {name}\'s reply he blew an entire mushroom stash out his nose — complete loss, but still funnier than watching {name} trade',
  r025:'{name} bought the exact top and mario watched it happen in real time — he\'s been pointing and laughing for six months straight and shows no signs of stopping',
  r026:'pikachu\'s leveraged position has more financial discipline than {name}\'s entire existence — and pikachu eats electricity and shits lightning',
  r027:'DK has thrown barrels blindfolded with more accuracy than {name} has ever shown placing any order — {name} couldn\'t hit a buy button at the right time with a fucking GPS',
  r028:'peach saw {name}\'s wallet and blocked them on every platform, every chain, and filed a restraining order in three jurisdictions — self-preservation instinct kicked in',
  r029:'luigi looked at {name}\'s PnL and cried harder than the time he got cucked out of his own game franchise — that\'s really saying something',
  r030:'{name} loses money so consistently that bowser offered them a salaried position doing it — finally a career that matches their talents',
  r031:'yoshi refused to carry {name} after seeing their stop-loss history — said "I\'ll eat literal shit but I won\'t carry that bag"',
  r032:'link beat every dungeon, killed ganon, and saved the entire timeline faster than {name} has managed to break even on a single fucking trade',
  r033:'{name} is still clutching bags from last cycle like it\'s their dead grandmother\'s hand — it\'s not sentimental value honey, it\'s just worthless',
  r034:'{name}\'s entry price is so bad that mathematicians are using it as proof that God either doesn\'t exist or actively hates them',
  r035:'the chart pumped specifically to give {name} hope and then dumped on their face like a financial bukake — the market gets off on {name}\'s suffering',
  r036:'{name}\'s entire strategy is buy high, panic sell low, cry on twitter, then do it again like a financially abused spouse who won\'t leave',
  r037:'mario looked at {name}\'s wallet history and called it the most disturbing thing he\'s seen — and this man has been in sewers his whole life',
  r038:'pikachu\'s net worth in Pokédollars — a fictional currency from a children\'s game — still cucks {name}\'s actual real-money portfolio',
  r039:'DK\'s pile of bananas has outperformed {name}\'s portfolio by 4,700% — literal rotting fruit is a better investment than anything {name} has ever touched',
  r040:'{name} is walking proof that leverage should require a psych eval, a breathalyzer, and written permission from everyone who has ever loved them',
  r041:'wario teleported into the chat the second {name} arrived — he can smell fresh financial victims from three chains away like a fat greasy shark',
  r042:'toad sprinted in screaming to warn everyone that {name} was coming — nobody believed a portfolio could be this sexually violent to its own owner',
  r043:'the degen gods saw {name} join, cracked open a beer, and said "oh this dumb bastard is going to be fun to destroy"',
  r044:'kirby inhaled {name}\'s financial future in one breath — immediately choked, said it tasted like gas fees and daddy issues',
  r045:'samus scanned {name}\'s wallet on arrival and classified it as a biohazard — CDC has been notified, do not make financial contact without full body protection',
  r046:'fox told {name} to do a barrel roll and {name} rolled straight into a 100x long at the top — fox is still laughing, {name} is still liquidated',
  r047:'ganondorf saw {name} arrive and cancelled his world domination plans — said "why would I bother conquering someone who destroys themselves for free"',
  r048:'captain falcon screamed SHOW ME YOUR TRADES at {name} — saw the portfolio, dry-heaved, and booked an emergency therapy session for both of them',
  r049:'{name} walked in with the energy of someone who found crypto last Tuesday and is already telling everyone else they\'re doing it wrong — peak regarded energy',
  r050:'mario put the shrooms down when {name} showed up — {name}\'s financial reality is already more psychotic than any drug-induced hallucination',
  r051:'{name} just waltzed into the most financially violent group chat on the internet looking excited about it — like a lamb skipping into the slaughterhouse',
  r052:'pikachu hit {name} with 50,000 volts on arrival and it still couldn\'t shock them into pulling out — of bad trades or anything else apparently',
  r053:'DK pounded his chest when {name} joined — finally someone new to financially sodomize in front of the whole chat',
  r054:'luigi waved {name} over because misery loves company and {name}\'s portfolio makes luigi feel like a goddamn financial genius',
  r055:'peach sent a polite welcome then quietly moved {name} to her spreadsheet titled PEOPLE WHO SHOULD BE LEGALLY BARRED FROM MONEY',
  r056:'bowser added {name} to his conquest list then crossed them off — there\'s literally nothing left to take, the market already pillaged everything',
  r057:'yoshi gave {name} a ride in, dropped them at the worst possible entry point, then fled the country — even yoshi knows when a cause is lost',
  r058:'link consulted the triforce about {name}\'s financial future — wisdom said "lmao no", courage said "absolutely not", power said "this bitch is cooked"',
  r059:'{name} entered like they had a plan — the market was immediately notified, adjusted accordingly, and began salivating',
  r060:'wario smelled {name}\'s wallet from across the blockchain — described it as "the scent of someone who\'s about to become my exit liquidity"',
  r061:'nobody asked {name} for their shit opinion but here it is, steaming and rancid, making everyone in the chat demonstrably dumber',
  r062:'wario read {name}\'s reply and tried to charge them a stupidity tax — said it would single-handedly fund his retirement',
  r063:'toad processed {name}\'s message faster than their stop-loss has ever triggered — which is never because {name} is too stupid to set one',
  r064:'kirby inhaled {name}\'s take, gained the power of catastrophically bad financial judgment, shit himself, and spat it out immediately',
  r065:'samus locked onto {name}\'s reply and classified it as a hostile organism — she\'s nuked entire planets for less offensive content',
  r066:'fox told {name} to trust the process then read their reply and said "actually don\'t trust anything — especially yourself with money"',
  r067:'ganondorf has destroyed entire civilizations with less concentrated stupidity than what {name} just typed with their greasy little fingers',
  r068:'captain falcon showed {name} what a FALCON PUNCH looks like — it\'s just a printout of their PnL taped to a fist',
  r069:'{name} sent that with the energy of someone who has never once looked at their own transaction history and doesn\'t plan to start now because it would cause actual psychological damage',
  r070:'mario counted his coins after reading {name}\'s message — confirmed he makes more in a single pipe than {name} has made in their entire crypto career',
  r071:'pikachu wasted every stored volt reacting to {name}\'s take — burned more energy on that reply than {name}\'s portfolio has ever generated in value',
  r072:'DK stopped climbing, stared at {name}\'s reply in complete silence for thirty seconds, then kept going — even a gorilla knows when something isn\'t worth engaging with',
  r073:'luigi wanted to respond to {name} but he\'s already emotionally maxed out from his own bags — he physically cannot absorb another person\'s financial trauma right now',
  r074:'bowser issued {name} a formal summons for crimes against coherent thought — the sentence is watching their portfolio bleed for another six months, which was already happening anyway',
  r075:'yoshi laid an egg reading {name}\'s reply — stress-induced, his fourth today — only {name} has the power to make a dinosaur involuntarily reproduce from sheer financial horror',
  r076:'{name} bought what they thought was a dip — it was actually a cliff with no bottom and {name} is still falling while screaming "this is the accumulation zone" into the void',
  r077:'wario went in alongside {name}, felt the energy of imminent financial death, pulled out immediately, and 3x\'d — {name} is still in, still holding, still regarded',
  r078:'kirby absorbed {name}\'s trading strategy by accident, immediately developed crippling anxiety and a gambling addiction, purged everything, and is now in a 12-step program',
  r079:'samus has hunted parasitic aliens across the galaxy — she said {name}\'s entry price is the most terrifying thing she\'s encountered in her entire career',
  r080:'{name} has survived three 80%+ drawdowns by simply never looking at the price — like a financially cucked ostrich with its head in the sand calling it "diamond hands"',
  r081:'ganondorf built a dark empire from nothing in less time than {name} has spent explaining to strangers on the internet why they haven\'t sold their worthless bags yet',
  r082:'captain falcon clocked {name}\'s entry timing at 0 km/h and 100% delusion — the only race {name} is winning is the race to zero',
  r083:'{name}\'s portfolio looks like the final boss of a game designed by someone who hates the player — unbeatable, unfair, and {name} keeps inserting quarters anyway',
  r084:'DK randomly chucked a barrel at a chart and it outperformed every single trade {name} has ever made — a literal ape with no thumbs is a better trader',
  r085:'link has rescued the same princess seventeen times and still has more successful exits than {name} has managed in their entire pathetic trading career',
  r086:'{name} has called the bottom five times, been catastrophically wrong five times, and is currently calling it again with the unearned confidence of someone who gets off on being humiliated by charts',
  r087:'peach has been kidnapped forty-seven times and still has a better exit strategy than {name} — at least she eventually gets rescued, {name}\'s bags are never coming back',
  r088:'luigi saw {name}\'s PnL and whispered "at least I\'m not that guy" — the most devastating thing ever said by a man who literally lives in his brother\'s shadow',
  r089:'{name}\'s transaction history has more red in it than a crime scene at a ketchup factory during a period — absolutely fucking gruesome from start to finish',
  r090:'mario opened {name}\'s chart, closed the laptop so hard it cracked, walked outside, stared at the sky for ten minutes, and hasn\'t spoken to anyone since',
  r091:'buying high and selling low isn\'t a strategy, {name} — it\'s a fetish at this point and you need professional help, not financial advice',
  r092:'the only thing more reliable than the market dumping is {name} being completely blindsided every single time like they\'ve never seen a red candle before in their miserable life',
  r093:'{name}\'s portfolio has more red than the devil\'s asshole after taco tuesday — bowser\'s entire army looks like a green candle compared to this bloodbath',
  r094:'{name} calls it diamond hands — everyone else calls it being financially trapped in an abusive relationship with a chart that doesn\'t love them back',
  r095:'{name} went all in because an anonymous profile picture of an anime girl on telegram said "this is the one" — it was not the one and {name}\'s rent money is gone forever',
  r096:'mario wants {name} to know that a literal coin flip has better expected value than every trade they\'ve ever placed — and {name} would still somehow land on the wrong side',
  r097:'pikachu has never rage-quit in thirty years of combat — looking at {name}\'s portfolio nearly broke that streak because even a fictional electric rat has limits',
  r098:'yoshi carried {name} through two entire bull markets and they STILL finished down — yoshi has retired, started therapy, and now flinches when he hears the word "portfolio"',
  r099:'{name} has more conviction than brain cells and bowser genuinely respects their commitment to financial self-destruction — it takes real dedication to be this consistently wrong',
  r100:'link found {name} wandering the lost woods going in circles for three years calling it "accumulation" — link left them there because some people can\'t be saved',
  r101:'the only thing more painful than hyrule castle on master mode is {name}\'s tax situation — the IRS is going to fuck them harder than the market already did',
  r102:'DK threw a barrel blindfolded at a random chart and it outperformed {name}\'s meticulously planned DCA strategy — a literal primate with no financial education is better at this',
  r103:'{name}\'s primary trading indicator is vibes — and the vibes have been giving "about to lose everything and cry in the shower" since January',
  r104:'luigi stared at {name}\'s unrealised losses, hugged them, and started sobbing uncontrollably — unclear whose portfolio triggered it but both of them are financially and emotionally destroyed',
  r105:'peach has been rugged by ganondorf seventeen times — that\'s still fewer rugs than {name} has eaten this cycle alone, and peach at least gets rescued afterward',
  r106:'{name} yeeted their life savings into a shitcoin with a dog logo instead of literally anything else — we are all witnesses to this financial hate crime against themselves',
  r107:'the blockchain is permanent, {name} — your entry price is carved into digital stone for all of eternity, a monument to the worst financial decision in recorded history',
  r108:'{name} said diamond hands and the market said liquidated — both were correct and now {name} has diamond hands holding absolutely fucking nothing',
  r109:'mario saw {name}\'s weekly chart, crossed himself even though he\'s a plumber from Brooklyn, whispered "mama mia" in genuine horror, and has not opened a chart since',
  r110:'wario showed up to rob {name} and left empty-handed — said "there\'s nothing here, the market already took everything, even the stuff that wasn\'t worth taking"',
  r111:'{name} read "number go up technology" on a reddit post and immediately signed over their life savings, their kids\' college fund, and their dignity — all three are now at zero',
  r112:'samus has cleared entire planets of hostile alien life forms more efficiently than {name} has ever closed a single position in profit — not once, not ever',
  r113:'fox said "never give up, trust your instincts" — he has since issued a formal correction clarifying he had not reviewed {name}\'s trade history and does not endorse their instincts in any way',
  r114:'{name} is walking, breathing, trading proof that confidence and competence are not just unrelated — they are inversely correlated, and {name} is the far end of the graph',
  r115:'kirby absorbed {name}\'s trading strategy, immediately developed a crippling gambling addiction, shit out a loss so large it collapsed a star system, and filed a class-action lawsuit',
  r116:'ganondorf has been catching L\'s for thirty consecutive years across multiple timelines and STILL has a better return on investment than {name} this cycle',
  r117:'captain falcon looked at {name}\'s numbers, screamed FALCON NO at the top of his lungs, assumed the fetal position, and has been rocking back and forth since tuesday',
  r118:'toad tried to warn {name} eleven separate times, watched them ignore every warning, gave up on humanity, bought a farm, and will never look at another chart or another human being again',
  r119:'{name}\'s risk management is simply never opening the app — which is honestly the smartest financial decision they\'ve made, but the portfolio is still bleeding out like a stuck pig in the background',
  r120:'the market is a ruthless, merciless, soul-crushing machine and {name} keeps walking into it dick-first with a smile — the results are catastrophic and well-documented on-chain for everyone to see',
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

  const rng  = mulberry32(hashStringToSeed(`${userId}:render:${roastId}`));

  const tag      = resolveTag(charTag, rng);
  const stats    = generateStats(userId, roastId);
  const typeTag  = pickFrom(TYPES,  mulberry32(hashStringToSeed(`${userId}:type:${roastId}`)));
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
