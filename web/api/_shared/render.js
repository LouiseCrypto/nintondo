import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Production Direction C card renderer — 1080×1920 parody trading card.
 * Uses @vercel/og (Satori) with Node.js runtime so we can load fonts
 * and character PNGs from disk via fs.readFileSync.
 *
 * Satori constraints respected:
 *   - Flexbox only (no CSS grid)
 *   - No box-shadow / filter / backdrop-blur
 *   - linear-gradient supported ✓
 *   - Custom font via ImageResponse `fonts` option ✓
 *   - Images as base64 data URIs ✓
 *   - transform: rotate() supported in Satori 0.10+ ✓
 */
import { ImageResponse } from '@vercel/og';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCharacter } from './characters.js';
import { hashStringToSeed, isoWeekNumber, mulberry32 } from './seeded-random.js';
import { generateStats } from './stats.js';
import { pickScene } from './scenes.js';
import { pickType } from './types.js';
// ── Asset loading — import.meta.url = this file's location in ESM Lambda ────
const SHARED = path.dirname(fileURLToPath(import.meta.url));
function tryRead(filePath) {
    try {
        return fs.readFileSync(filePath);
    }
    catch {
        return null;
    }
}
// Load at module level — Node caches these after first cold start
const fontBuffer = tryRead(path.join(SHARED, 'fonts', 'BowlbyOne-Regular.ttf'));
const logoBuffer = tryRead(path.join(SHARED, 'assets', 'logo-mark.png'));
// Default avatar is always present (committed to repo)
const defaultAvatar = (() => {
    const buf = tryRead(path.join(SHARED, 'assets', 'default-avatar.svg'));
    if (!buf)
        return null;
    return `data:image/svg+xml;base64,${buf.toString('base64')}`;
})();
function pngUri(buf) {
    return buf ? `data:image/png;base64,${buf.toString('base64')}` : null;
}
function jpegUri(bytes) {
    return `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`;
}
const LOGO_URI = pngUri(logoBuffer);
// ── Colour palette ───────────────────────────────────────────────────────────
const RED = '#d4151f';
const BLUE = '#1d8bd9';
const YELLOW = '#ffcc00';
const CREAM = '#f5e6c8';
const DARK = '#0a0a1e';
const PURPLE = '#a855f7';
// ── Sub-components (pure — no hooks) ────────────────────────────────────────
function StatRow({ label, value, accent = false }) {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsx("span", { style: { color: '#888', fontSize: 21, fontFamily: 'monospace' }, children: label }), _jsx("span", { style: { color: accent ? '#f87171' : '#e2e8f0', fontSize: 24, fontFamily: 'BowlbyOne, sans-serif', maxWidth: 280, overflow: 'hidden' }, children: value })] }));
}
export async function renderRoastCard(props) {
    const { userId, username, roast, avatarBytes } = props;
    // ── PRNG seeded per (userId × week) ──
    const week = isoWeekNumber();
    const seed = hashStringToSeed(`${userId}:render:${week}`);
    const rng = mulberry32(seed);
    // ── Resolve character cameo ──
    const character = resolveCharacter(roast.character_tag, rng);
    const charBuffer = tryRead(character.assetPath);
    const charUri = pngUri(charBuffer);
    // ── Avatar ──
    const avatarUri = avatarBytes ? jpegUri(avatarBytes) : (defaultAvatar ?? undefined);
    // ── Card content ──
    const stats = generateStats(userId);
    const typeTag = pickType(userId);
    const scene = pickScene(userId, roast.id);
    const roastText = roast.text.replace(/\{name\}/g, username);
    const cardNum = roast.id.replace(/\D/g, '').padStart(3, '0');
    const fonts = fontBuffer
        ? [{ name: 'BowlbyOne', data: fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength), style: 'normal', weight: 400 }]
        : [];
    // ── JSX card (1080 × 1920) ──────────────────────────────────────────────
    return new ImageResponse((_jsxs("div", { style: {
            width: 1080, height: 1920,
            display: 'flex', flexDirection: 'column',
            background: `linear-gradient(180deg, #2d1a4e 0%, #1a0f2e 100%)`,
            border: `6px solid #1a0a2e`,
            fontFamily: 'BowlbyOne, sans-serif',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: { display: 'flex', height: 160, width: '100%' }, children: [_jsx("div", { style: { display: 'flex', width: 280, background: RED, alignItems: 'center', justifyContent: 'center', padding: '0 16px' }, children: LOGO_URI
                            ? _jsx("img", { src: LOGO_URI, style: { height: 82, objectFit: 'contain' } })
                            : _jsx("span", { style: { color: '#fff', fontSize: 42, letterSpacing: '-1px' }, children: "NINTONDO" }) }), _jsx("div", { style: { display: 'flex', flex: 1, background: BLUE, alignItems: 'center', justifyContent: 'center' }, children: _jsx("span", { style: { color: 'rgba(255,255,255,0.22)', fontSize: 30, letterSpacing: 12 }, children: "\u2605  \u2605  \u2605" }) }), _jsxs("div", { style: { display: 'flex', width: 360, background: RED, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }, children: [_jsx("span", { style: { color: 'rgba(255,255,255,0.55)', fontSize: 18, letterSpacing: 3 }, children: "TYPE" }), _jsx("span", { style: { color: YELLOW, fontSize: typeTag.length > 16 ? 20 : 25, letterSpacing: 1, textAlign: 'center' }, children: typeTag })] })] }), _jsxs("div", { style: { display: 'flex', height: 110, background: DARK, alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', borderBottom: `3px solid ${RED}` }, children: [_jsxs("span", { style: { color: '#fff', fontSize: 50, maxWidth: 560, overflow: 'hidden' }, children: ["@", username] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { color: '#888', fontSize: 24, marginRight: 4 }, children: "HP" }), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (_jsx("div", { style: { width: 16, height: 16, background: i < 2 ? '#ef4444' : '#1f1f3a', border: '1px solid #333' } }, i))), _jsx("span", { style: { color: '#ef4444', fontSize: 24, marginLeft: 6 }, children: "2/10" })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: 920, background: 'linear-gradient(180deg, #3d1a6e 0%, #2d0a4e 55%, #1a0a2e 100%)', padding: '40px 48px 28px' }, children: [_jsxs("div", { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("div", { style: { display: 'flex', width: 320, height: 320, borderRadius: '50%', border: `6px solid ${YELLOW}`, overflow: 'hidden', flexShrink: 0 }, children: avatarUri
                                    ? _jsx("img", { src: avatarUri, width: 320, height: 320, style: { objectFit: 'cover' } })
                                    : _jsx("div", { style: { display: 'flex', width: 320, height: 320, background: '#1e1b4b', alignItems: 'center', justifyContent: 'center' }, children: _jsx("span", { style: { color: '#6b7280', fontSize: 120 }, children: "?" }) }) }), charUri && (_jsx("img", { src: charUri, style: { height: 420, width: 400, objectFit: 'contain', transform: 'rotate(7deg)', flexShrink: 0 } }))] }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', paddingBottom: 4 }, children: _jsx("div", { style: { display: 'flex', background: 'rgba(0,0,0,0.58)', borderRadius: 40, padding: '10px 28px', border: `1px solid rgba(255,204,0,0.25)` }, children: _jsxs("span", { style: { color: YELLOW, fontSize: 22, letterSpacing: 4, fontFamily: 'monospace' }, children: ["SCENE: ", scene] }) }) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: 340, background: CREAM, padding: '22px 48px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }, children: [_jsx("span", { style: { color: RED, fontSize: 38 }, children: "\u2605" }), _jsx("span", { style: { color: RED, fontSize: 34, letterSpacing: 2 }, children: "ROAST ATTACK" })] }), _jsx("div", { style: { display: 'flex', flex: 1, alignItems: 'center' }, children: _jsxs("span", { style: {
                                color: '#2d1a4e',
                                fontSize: roastText.length > 140 ? 30 : roastText.length > 100 ? 34 : 38,
                                fontStyle: 'italic',
                                fontFamily: 'serif',
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                            }, children: ["\"", roastText, "\""] }) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: 260, background: DARK, padding: '18px 48px 14px', borderTop: `3px solid #4c1d95` }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: 14 }, children: _jsx("span", { style: { color: PURPLE, fontSize: 24, fontFamily: 'monospace', letterSpacing: 4 }, children: "\u2550\u2550\u2550 DEGEN PROFILE \u2550\u2550\u2550" }) }), _jsxs("div", { style: { display: 'flex', flex: 1, gap: 40 }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', flex: 1 }, children: [_jsx(StatRow, { label: "PAPERHAND IDX", value: `${stats.paperhandIndex}%`, accent: stats.paperhandIndex >= 85 }), _jsx(StatRow, { label: "LIQ RISK", value: stats.liquidationRisk, accent: true }), _jsx(StatRow, { label: "MENTAL STATE", value: stats.mentalState, accent: true })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', flex: 1 }, children: [_jsx(StatRow, { label: "LAST TOP", value: stats.lastBoughtTheTop }), _jsx(StatRow, { label: "COPE", value: stats.favoriteCope }), _jsx(StatRow, { label: "NET WORTH \u0394", value: stats.netWorthDelta, accent: true })] })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: 130, background: `linear-gradient(90deg, ${RED} 0%, ${BLUE} 50%, ${RED} 100%)`, alignItems: 'center', justifyContent: 'center', gap: 10 }, children: [_jsxs("span", { style: { color: '#fff', fontSize: 30, letterSpacing: 1 }, children: ["CARD #", cardNum, " \u00B7 $NINTONDO on TON"] }), _jsx("span", { style: { color: 'rgba(255,255,255,0.62)', fontSize: 18 }, children: "unofficial parody \u00B7 not affiliated with any video game company" })] })] })), { width: 1080, height: 1920, fonts });
}
