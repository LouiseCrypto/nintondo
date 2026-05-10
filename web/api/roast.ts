// POST /api/roast — Edge Runtime, fully self-contained, zero relative imports.
// Everything is inlined because Vercel cannot resolve _shared/ at runtime
// in either Edge or Node.js functions when bundled with esbuild.

export const config = { runtime: 'edge' };

// ── Roast pool ────────────────────────────────────────────────────────────

interface Roast {
  id: string; text: string; category: string; character_tag: string; weight: number;
}

const ROASTS: Roast[] = [
  { id:'r001', text:'{name} just crawled in here smelling like margin calls and desperation — the market already fucked you, we\'re just the afterparty', category:'welcome', character_tag:'general', weight:1 },
  { id:'r002', text:'mario saw {name} join, laughed so hard he pissed mushroom juice, and immediately used them as exit liquidity', category:'welcome', character_tag:'mario', weight:1 },
  { id:'r003', text:'pikachu shorted {name} on sight and came so hard from the profits he blew a fuse — 40x no lube, no remorse', category:'welcome', character_tag:'pikachu', weight:1 },
  { id:'r004', text:'DK took one whiff of {name}\'s entry price and dry-heaved off the top of the tower — it smells like financial AIDS', category:'welcome', character_tag:'dk', weight:1 },
  { id:'r005', text:'peach saw {name}\'s wallet and called the police, a priest, and a fucking coroner — in that order', category:'welcome', character_tag:'peach', weight:1 },
  { id:'r006', text:'luigi has been financially cucked for three straight years and {name} still walked in looking more pathetic — genuinely impressive', category:'welcome', character_tag:'luigi', weight:1 },
  { id:'r007', text:'bowser enslaved an entire kingdom faster than {name} will ever break even — and bowser didn\'t even have to leverage up like a dipshit', category:'welcome', character_tag:'bowser', weight:1 },
  { id:'r008', text:'yoshi ate {name}\'s portfolio and immediately shit it out — said it tasted like burnt money and broken dreams', category:'welcome', character_tag:'yoshi', weight:1 },
  { id:'r009', text:'link used the ocarina of time to go back and warn {name} not to ape in — {name} told him to fuck off and bought the top anyway', category:'welcome', character_tag:'link', weight:1 },
  { id:'r010', text:'the market bent {name} over before they even finished typing their username — no foreplay, no safeword', category:'welcome', character_tag:'general', weight:1 },
  { id:'r011', text:'{name} walked in and every degen in the chat suddenly felt like Warren fucking Buffett by comparison', category:'welcome', character_tag:'general', weight:1 },
  { id:'r012', text:'mario stopped doing shrooms to welcome {name} — saw the portfolio, snorted twice as hard, and said "this poor bastard"', category:'welcome', character_tag:'mario', weight:1 },
  { id:'r013', text:'{name} really clapped back at me like their portfolio isn\'t a fucking crime scene — your last trade was a hate crime against your own bloodline\'s wealth', category:'reply', character_tag:'general', weight:1 },
  { id:'r014', text:'mario read {name}\'s reply, checked his net worth, confirmed he makes more taking a shit than {name} makes all year, and moved on', category:'reply', character_tag:'mario', weight:1 },
  { id:'r015', text:'pikachu electrocuted {name}\'s router just to save them from their next trade — mercy killing their wifi was an act of charity', category:'reply', character_tag:'pikachu', weight:1 },
  { id:'r016', text:'DK curled {name}\'s entire net worth as a warm-up this morning — said it was the most pathetic weight he\'s ever lifted', category:'reply', character_tag:'dk', weight:1 },
  { id:'r017', text:'peach read {name}\'s reply and added them to a spreadsheet titled PEOPLE TOO STUPID TO BREATHE AND TRADE SIMULTANEOUSLY', category:'reply', character_tag:'peach', weight:1 },
  { id:'r018', text:'luigi was already sobbing into his empty wallet when {name} replied — somehow {name} made a crying man feel even worse about himself', category:'reply', character_tag:'luigi', weight:1 },
  { id:'r019', text:'bowser has committed actual war crimes that are less offensive than the garbage {name} just typed', category:'reply', character_tag:'bowser', weight:1 },
  { id:'r020', text:'yoshi swallowed {name}\'s take, immediately projectile-vomited, and checked himself into rehab — one exposure was enough', category:'reply', character_tag:'yoshi', weight:1 },
  { id:'r021', text:'link pulled out the master sword to cut {name}\'s reply in half but the sword refused — even sacred weapons have standards', category:'reply', character_tag:'link', weight:1 },
  { id:'r022', text:'{name} typed that with the confidence of someone who has never been right about a single fucking thing in their entire financial life', category:'reply', character_tag:'general', weight:1 },
  { id:'r023', text:'the absolute balls on {name} replying to me when their on-chain history reads like a fucking snuff film of money being murdered', category:'reply', character_tag:'general', weight:1 },
  { id:'r024', text:'mario laughed so hard at {name}\'s reply he blew an entire mushroom stash out his nose — complete loss, but still funnier than watching {name} trade', category:'reply', character_tag:'mario', weight:1 },
  { id:'r025', text:'{name} bought the exact top and mario watched it happen in real time — he\'s been pointing and laughing for six months straight and shows no signs of stopping', category:'targeted', character_tag:'mario', weight:1 },
  { id:'r026', text:'pikachu\'s leveraged position has more financial discipline than {name}\'s entire existence — and pikachu eats electricity and shits lightning', category:'targeted', character_tag:'pikachu', weight:1 },
  { id:'r027', text:'DK has thrown barrels blindfolded with more accuracy than {name} has ever shown placing any order — {name} couldn\'t hit a buy button at the right time with a fucking GPS', category:'targeted', character_tag:'dk', weight:1 },
  { id:'r028', text:'peach saw {name}\'s wallet and blocked them on every platform, every chain, and filed a restraining order in three jurisdictions — self-preservation instinct kicked in', category:'targeted', character_tag:'peach', weight:1 },
  { id:'r029', text:'luigi looked at {name}\'s PnL and cried harder than the time he got cucked out of his own game franchise — that\'s really saying something', category:'targeted', character_tag:'luigi', weight:1 },
  { id:'r030', text:'{name} loses money so consistently that bowser offered them a salaried position doing it — finally a career that matches their talents', category:'targeted', character_tag:'bowser', weight:1 },
  { id:'r031', text:'yoshi refused to carry {name} after seeing their stop-loss history — said "I\'ll eat literal shit but I won\'t carry that bag"', category:'targeted', character_tag:'yoshi', weight:1 },
  { id:'r032', text:'link beat every dungeon, killed ganon, and saved the entire timeline faster than {name} has managed to break even on a single fucking trade', category:'targeted', character_tag:'link', weight:1 },
  { id:'r033', text:'{name} is still clutching bags from last cycle like it\'s their dead grandmother\'s hand — it\'s not sentimental value honey, it\'s just worthless', category:'universal', character_tag:'general', weight:1 },
  { id:'r034', text:'{name}\'s entry price is so bad that mathematicians are using it as proof that God either doesn\'t exist or actively hates them', category:'universal', character_tag:'general', weight:1 },
  { id:'r035', text:'the chart pumped specifically to give {name} hope and then dumped on their face like a financial bukake — the market gets off on {name}\'s suffering', category:'universal', character_tag:'general', weight:1 },
  { id:'r036', text:'{name}\'s entire strategy is buy high, panic sell low, cry on twitter, then do it again like a financially abused spouse who won\'t leave', category:'universal', character_tag:'general', weight:1 },
  { id:'r037', text:'mario looked at {name}\'s wallet history and called it the most disturbing thing he\'s seen — and this man has been in sewers his whole life', category:'universal', character_tag:'mario', weight:1 },
  { id:'r038', text:'pikachu\'s net worth in Pokédollars — a fictional currency from a children\'s game — still cucks {name}\'s actual real-money portfolio', category:'universal', character_tag:'pikachu', weight:1 },
  { id:'r039', text:'DK\'s pile of bananas has outperformed {name}\'s portfolio by 4,700% — literal rotting fruit is a better investment than anything {name} has ever touched', category:'universal', character_tag:'dk', weight:1 },
  { id:'r040', text:'{name} is walking proof that leverage should require a psych eval, a breathalyzer, and written permission from everyone who has ever loved them', category:'universal', character_tag:'general', weight:1 },
  { id:'r041', text:'wario teleported into the chat the second {name} arrived — he can smell fresh financial victims from three chains away like a fat greasy shark', category:'welcome', character_tag:'wario', weight:1 },
  { id:'r042', text:'toad sprinted in screaming to warn everyone that {name} was coming — nobody believed a portfolio could be this sexually violent to its own owner', category:'welcome', character_tag:'toad', weight:1 },
  { id:'r043', text:'the degen gods saw {name} join, cracked open a beer, and said "oh this dumb bastard is going to be fun to destroy"', category:'welcome', character_tag:'general', weight:1 },
  { id:'r044', text:'kirby inhaled {name}\'s financial future in one breath — immediately choked, said it tasted like gas fees and daddy issues', category:'welcome', character_tag:'kirby', weight:1 },
  { id:'r045', text:'samus scanned {name}\'s wallet on arrival and classified it as a biohazard — CDC has been notified, do not make financial contact without full body protection', category:'welcome', character_tag:'samus', weight:1 },
  { id:'r046', text:'fox told {name} to do a barrel roll and {name} rolled straight into a 100x long at the top — fox is still laughing, {name} is still liquidated', category:'welcome', character_tag:'fox', weight:1 },
  { id:'r047', text:'ganondorf saw {name} arrive and cancelled his world domination plans — said "why would I bother conquering someone who destroys themselves for free"', category:'welcome', character_tag:'ganondorf', weight:1 },
  { id:'r048', text:'captain falcon screamed SHOW ME YOUR TRADES at {name} — saw the portfolio, dry-heaved, and booked an emergency therapy session for both of them', category:'welcome', character_tag:'captain_falcon', weight:1 },
  { id:'r049', text:'{name} walked in with the energy of someone who found crypto last Tuesday and is already telling everyone else they\'re doing it wrong — peak regarded energy', category:'welcome', character_tag:'general', weight:1 },
  { id:'r050', text:'mario put the shrooms down when {name} showed up — {name}\'s financial reality is already more psychotic than any drug-induced hallucination', category:'welcome', character_tag:'mario', weight:1 },
  { id:'r051', text:'{name} just waltzed into the most financially violent group chat on the internet looking excited about it — like a lamb skipping into the slaughterhouse', category:'welcome', character_tag:'general', weight:1 },
  { id:'r052', text:'pikachu hit {name} with 50,000 volts on arrival and it still couldn\'t shock them into pulling out — of bad trades or anything else apparently', category:'welcome', character_tag:'pikachu', weight:1 },
  { id:'r053', text:'DK pounded his chest when {name} joined — finally someone new to financially sodomize in front of the whole chat', category:'welcome', character_tag:'dk', weight:1 },
  { id:'r054', text:'luigi waved {name} over because misery loves company and {name}\'s portfolio makes luigi feel like a goddamn financial genius', category:'welcome', character_tag:'luigi', weight:1 },
  { id:'r055', text:'peach sent a polite welcome then quietly moved {name} to her spreadsheet titled PEOPLE WHO SHOULD BE LEGALLY BARRED FROM MONEY', category:'welcome', character_tag:'peach', weight:1 },
  { id:'r056', text:'bowser added {name} to his conquest list then crossed them off — there\'s literally nothing left to take, the market already pillaged everything', category:'welcome', character_tag:'bowser', weight:1 },
  { id:'r057', text:'yoshi gave {name} a ride in, dropped them at the worst possible entry point, then fled the country — even yoshi knows when a cause is lost', category:'welcome', character_tag:'yoshi', weight:1 },
  { id:'r058', text:'link consulted the triforce about {name}\'s financial future — wisdom said "lmao no", courage said "absolutely not", power said "this bitch is cooked"', category:'welcome', character_tag:'link', weight:1 },
  { id:'r059', text:'{name} entered like they had a plan — the market was immediately notified, adjusted accordingly, and began salivating', category:'welcome', character_tag:'general', weight:1 },
  { id:'r060', text:'wario smelled {name}\'s wallet from across the blockchain — described it as "the scent of someone who\'s about to become my exit liquidity"', category:'welcome', character_tag:'wario', weight:1 },
  { id:'r061', text:'nobody asked {name} for their shit opinion but here it is, steaming and rancid, making everyone in the chat demonstrably dumber', category:'reply', character_tag:'general', weight:1 },
  { id:'r062', text:'wario read {name}\'s reply and tried to charge them a stupidity tax — said it would single-handedly fund his retirement', category:'reply', character_tag:'wario', weight:1 },
  { id:'r063', text:'toad processed {name}\'s message faster than their stop-loss has ever triggered — which is never because {name} is too stupid to set one', category:'reply', character_tag:'toad', weight:1 },
  { id:'r064', text:'kirby inhaled {name}\'s take, gained the power of catastrophically bad financial judgment, shit himself, and spat it out immediately', category:'reply', character_tag:'kirby', weight:1 },
  { id:'r065', text:'samus locked onto {name}\'s reply and classified it as a hostile organism — she\'s nuked entire planets for less offensive content', category:'reply', character_tag:'samus', weight:1 },
  { id:'r066', text:'fox told {name} to trust the process then read their reply and said "actually don\'t trust anything — especially yourself with money"', category:'reply', character_tag:'fox', weight:1 },
  { id:'r067', text:'ganondorf has destroyed entire civilizations with less concentrated stupidity than what {name} just typed with their greasy little fingers', category:'reply', character_tag:'ganondorf', weight:1 },
  { id:'r068', text:'captain falcon showed {name} what a FALCON PUNCH looks like — it\'s just a printout of their PnL taped to a fist', category:'reply', character_tag:'captain_falcon', weight:1 },
  { id:'r069', text:'{name} sent that with the energy of someone who has never once looked at their own transaction history and doesn\'t plan to start now because it would cause actual psychological damage', category:'reply', character_tag:'general', weight:1 },
  { id:'r070', text:'mario counted his coins after reading {name}\'s message — confirmed he makes more in a single pipe than {name} has made in their entire crypto career', category:'reply', character_tag:'mario', weight:1 },
  { id:'r071', text:'pikachu wasted every stored volt reacting to {name}\'s take — burned more energy on that reply than {name}\'s portfolio has ever generated in value', category:'reply', character_tag:'pikachu', weight:1 },
  { id:'r072', text:'DK stopped climbing, stared at {name}\'s reply in complete silence for thirty seconds, then kept going — even a gorilla knows when something isn\'t worth engaging with', category:'reply', character_tag:'dk', weight:1 },
  { id:'r073', text:'luigi wanted to respond to {name} but he\'s already emotionally maxed out from his own bags — he physically cannot absorb another person\'s financial trauma right now', category:'reply', character_tag:'luigi', weight:1 },
  { id:'r074', text:'bowser issued {name} a formal summons for crimes against coherent thought — the sentence is watching their portfolio bleed for another six months, which was already happening anyway', category:'reply', character_tag:'bowser', weight:1 },
  { id:'r075', text:'yoshi laid an egg reading {name}\'s reply — stress-induced, his fourth today — only {name} has the power to make a dinosaur involuntarily reproduce from sheer financial horror', category:'reply', character_tag:'yoshi', weight:1 },
  { id:'r076', text:'{name} bought what they thought was a dip — it was actually a cliff with no bottom and {name} is still falling while screaming "this is the accumulation zone" into the void', category:'targeted', character_tag:'general', weight:1 },
  { id:'r077', text:'wario went in alongside {name}, felt the energy of imminent financial death, pulled out immediately, and 3x\'d — {name} is still in, still holding, still regarded', category:'targeted', character_tag:'wario', weight:1 },
  { id:'r078', text:'kirby absorbed {name}\'s trading strategy by accident, immediately developed crippling anxiety and a gambling addiction, purged everything, and is now in a 12-step program', category:'targeted', character_tag:'kirby', weight:1 },
  { id:'r079', text:'samus has hunted parasitic aliens across the galaxy — she said {name}\'s entry price is the most terrifying thing she\'s encountered in her entire career', category:'targeted', character_tag:'samus', weight:1 },
  { id:'r080', text:'{name} has survived three 80%+ drawdowns by simply never looking at the price — like a financially cucked ostrich with its head in the sand calling it "diamond hands"', category:'targeted', character_tag:'general', weight:1 },
  { id:'r081', text:'ganondorf built a dark empire from nothing in less time than {name} has spent explaining to strangers on the internet why they haven\'t sold their worthless bags yet', category:'targeted', character_tag:'ganondorf', weight:1 },
  { id:'r082', text:'captain falcon clocked {name}\'s entry timing at 0 km/h and 100% delusion — the only race {name} is winning is the race to zero', category:'targeted', character_tag:'captain_falcon', weight:1 },
  { id:'r083', text:'{name}\'s portfolio looks like the final boss of a game designed by someone who hates the player — unbeatable, unfair, and {name} keeps inserting quarters anyway', category:'targeted', character_tag:'general', weight:1 },
  { id:'r084', text:'DK randomly chucked a barrel at a chart and it outperformed every single trade {name} has ever made — a literal ape with no thumbs is a better trader', category:'targeted', character_tag:'dk', weight:1 },
  { id:'r085', text:'link has rescued the same princess seventeen times and still has more successful exits than {name} has managed in their entire pathetic trading career', category:'targeted', character_tag:'link', weight:1 },
  { id:'r086', text:'{name} has called the bottom five times, been catastrophically wrong five times, and is currently calling it again with the unearned confidence of someone who gets off on being humiliated by charts', category:'targeted', character_tag:'general', weight:1 },
  { id:'r087', text:'peach has been kidnapped forty-seven times and still has a better exit strategy than {name} — at least she eventually gets rescued, {name}\'s bags are never coming back', category:'targeted', character_tag:'peach', weight:1 },
  { id:'r088', text:'luigi saw {name}\'s PnL and whispered "at least I\'m not that guy" — the most devastating thing ever said by a man who literally lives in his brother\'s shadow', category:'targeted', character_tag:'luigi', weight:1 },
  { id:'r089', text:'{name}\'s transaction history has more red in it than a crime scene at a ketchup factory during a period — absolutely fucking gruesome from start to finish', category:'targeted', character_tag:'general', weight:1 },
  { id:'r090', text:'mario opened {name}\'s chart, closed the laptop so hard it cracked, walked outside, stared at the sky for ten minutes, and hasn\'t spoken to anyone since', category:'targeted', character_tag:'mario', weight:1 },
  { id:'r091', text:'buying high and selling low isn\'t a strategy, {name} — it\'s a fetish at this point and you need professional help, not financial advice', category:'universal', character_tag:'general', weight:1 },
  { id:'r092', text:'the only thing more reliable than the market dumping is {name} being completely blindsided every single time like they\'ve never seen a red candle before in their miserable life', category:'universal', character_tag:'general', weight:1 },
  { id:'r093', text:'{name}\'s portfolio has more red than the devil\'s asshole after taco tuesday — bowser\'s entire army looks like a green candle compared to this bloodbath', category:'universal', character_tag:'bowser', weight:1 },
  { id:'r094', text:'{name} calls it diamond hands — everyone else calls it being financially trapped in an abusive relationship with a chart that doesn\'t love them back', category:'universal', character_tag:'general', weight:1 },
  { id:'r095', text:'{name} went all in because an anonymous profile picture of an anime girl on telegram said "this is the one" — it was not the one and {name}\'s rent money is gone forever', category:'universal', character_tag:'general', weight:1 },
  { id:'r096', text:'mario wants {name} to know that a literal coin flip has better expected value than every trade they\'ve ever placed — and {name} would still somehow land on the wrong side', category:'universal', character_tag:'mario', weight:1 },
  { id:'r097', text:'pikachu has never rage-quit in thirty years of combat — looking at {name}\'s portfolio nearly broke that streak because even a fictional electric rat has limits', category:'universal', character_tag:'pikachu', weight:1 },
  { id:'r098', text:'yoshi carried {name} through two entire bull markets and they STILL finished down — yoshi has retired, started therapy, and now flinches when he hears the word "portfolio"', category:'universal', character_tag:'yoshi', weight:1 },
  { id:'r099', text:'{name} has more conviction than brain cells and bowser genuinely respects their commitment to financial self-destruction — it takes real dedication to be this consistently wrong', category:'universal', character_tag:'bowser', weight:1 },
  { id:'r100', text:'link found {name} wandering the lost woods going in circles for three years calling it "accumulation" — link left them there because some people can\'t be saved', category:'universal', character_tag:'link', weight:1 },
  { id:'r101', text:'the only thing more painful than hyrule castle on master mode is {name}\'s tax situation — the IRS is going to fuck them harder than the market already did', category:'universal', character_tag:'general', weight:1 },
  { id:'r102', text:'DK threw a barrel blindfolded at a random chart and it outperformed {name}\'s meticulously planned DCA strategy — a literal primate with no financial education is better at this', category:'universal', character_tag:'dk', weight:1 },
  { id:'r103', text:'{name}\'s primary trading indicator is vibes — and the vibes have been giving "about to lose everything and cry in the shower" since January', category:'universal', character_tag:'general', weight:1 },
  { id:'r104', text:'luigi stared at {name}\'s unrealised losses, hugged them, and started sobbing uncontrollably — unclear whose portfolio triggered it but both of them are financially and emotionally destroyed', category:'universal', character_tag:'luigi', weight:1 },
  { id:'r105', text:'peach has been rugged by ganondorf seventeen times — that\'s still fewer rugs than {name} has eaten this cycle alone, and peach at least gets rescued afterward', category:'universal', character_tag:'peach', weight:1 },
  { id:'r106', text:'{name} yeeted their life savings into a shitcoin with a dog logo instead of literally anything else — we are all witnesses to this financial hate crime against themselves', category:'universal', character_tag:'general', weight:1 },
  { id:'r107', text:'the blockchain is permanent, {name} — your entry price is carved into digital stone for all of eternity, a monument to the worst financial decision in recorded history', category:'universal', character_tag:'general', weight:1 },
  { id:'r108', text:'{name} said diamond hands and the market said liquidated — both were correct and now {name} has diamond hands holding absolutely fucking nothing', category:'universal', character_tag:'general', weight:1 },
  { id:'r109', text:'mario saw {name}\'s weekly chart, crossed himself even though he\'s a plumber from Brooklyn, whispered "mama mia" in genuine horror, and has not opened a chart since', category:'universal', character_tag:'mario', weight:1 },
  { id:'r110', text:'wario showed up to rob {name} and left empty-handed — said "there\'s nothing here, the market already took everything, even the stuff that wasn\'t worth taking"', category:'universal', character_tag:'wario', weight:1 },
  { id:'r111', text:'{name} read "number go up technology" on a reddit post and immediately signed over their life savings, their kids\' college fund, and their dignity — all three are now at zero', category:'universal', character_tag:'general', weight:1 },
  { id:'r112', text:'samus has cleared entire planets of hostile alien life forms more efficiently than {name} has ever closed a single position in profit — not once, not ever', category:'universal', character_tag:'samus', weight:1 },
  { id:'r113', text:'fox said "never give up, trust your instincts" — he has since issued a formal correction clarifying he had not reviewed {name}\'s trade history and does not endorse their instincts in any way', category:'universal', character_tag:'fox', weight:1 },
  { id:'r114', text:'{name} is walking, breathing, trading proof that confidence and competence are not just unrelated — they are inversely correlated, and {name} is the far end of the graph', category:'universal', character_tag:'general', weight:1 },
  { id:'r115', text:'kirby absorbed {name}\'s trading strategy, immediately developed a crippling gambling addiction, shit out a loss so large it collapsed a star system, and filed a class-action lawsuit', category:'universal', character_tag:'kirby', weight:1 },
  { id:'r116', text:'ganondorf has been catching L\'s for thirty consecutive years across multiple timelines and STILL has a better return on investment than {name} this cycle', category:'universal', character_tag:'ganondorf', weight:1 },
  { id:'r117', text:'captain falcon looked at {name}\'s numbers, screamed FALCON NO at the top of his lungs, assumed the fetal position, and has been rocking back and forth since tuesday', category:'universal', character_tag:'captain_falcon', weight:1 },
  { id:'r118', text:'toad tried to warn {name} eleven separate times, watched them ignore every warning, gave up on humanity, bought a farm, and will never look at another chart or another human being again', category:'universal', character_tag:'toad', weight:1 },
  { id:'r119', text:'{name}\'s risk management is simply never opening the app — which is honestly the smartest financial decision they\'ve made, but the portfolio is still bleeding out like a stuck pig in the background', category:'universal', character_tag:'general', weight:1 },
  { id:'r120', text:'the market is a ruthless, merciless, soul-crushing machine and {name} keeps walking into it dick-first with a smile — the results are catastrophic and well-documented on-chain for everyone to see', category:'universal', character_tag:'general', weight:1 },
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
