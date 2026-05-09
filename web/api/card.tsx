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

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(request: Request): Promise<Response> {
  const url      = new URL(request.url);
  const origin   = url.origin;
  const userId   = Number(url.searchParams.get('u') ?? '0') || 0;
  const roastText = decodeURIComponent(url.searchParams.get('t') ?? 'the market already roasted you harder than anything I could say');
  const charTag  = url.searchParams.get('c') ?? 'general';
  const username = url.searchParams.get('n') ?? 'anon';
  const avatarUrl = url.searchParams.get('a') ?? '';
  const roastId  = url.searchParams.get('r') ?? 'r000';

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
    avatarUrl ? fetch(avatarUrl).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null) : Promise.resolve(null),
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

  // ── Card JSX (540 × 960) ───────────────────────────────────────────────────
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
      <div style={{ display: 'flex', flexDirection: 'column', height: 460,
        background: 'linear-gradient(180deg, #3d1a6e 0%, #2d0a4e 55%, #1a0a2e 100%)', padding: '20px 24px 14px' }}>
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
