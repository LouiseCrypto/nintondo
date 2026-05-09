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
import React from 'react';
import { resolveCharacter } from './characters.js';
import { hashStringToSeed, isoWeekNumber, mulberry32 } from './seeded-random.js';
import { generateStats } from './stats.js';
import { pickScene } from './scenes.js';
import { pickType } from './types.js';

// ── Asset loading — import.meta.url = this file's location in ESM Lambda ────

const SHARED = path.dirname(fileURLToPath(import.meta.url));

function tryRead(filePath: string): Buffer | null {
  try { return fs.readFileSync(filePath); } catch { return null; }
}

// Load at module level — Node caches these after first cold start
const fontBuffer   = tryRead(path.join(SHARED, 'fonts',  'BowlbyOne-Regular.ttf'));
const logoBuffer   = tryRead(path.join(SHARED, 'assets', 'logo-mark.png'));
// Default avatar is always present (committed to repo)
const defaultAvatar = (() => {
  const buf = tryRead(path.join(SHARED, 'assets', 'default-avatar.svg'));
  if (!buf) return null;
  return `data:image/svg+xml;base64,${buf.toString('base64')}`;
})();

function pngUri(buf: Buffer | null): string | null {
  return buf ? `data:image/png;base64,${buf.toString('base64')}` : null;
}
function jpegUri(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`;
}

const LOGO_URI = pngUri(logoBuffer);

// ── Colour palette ───────────────────────────────────────────────────────────

const RED    = '#d4151f';
const BLUE   = '#1d8bd9';
const YELLOW = '#ffcc00';
const CREAM  = '#f5e6c8';
const DARK   = '#0a0a1e';
const PURPLE = '#a855f7';

// ── Sub-components (pure — no hooks) ────────────────────────────────────────

function StatRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ color: '#888', fontSize: 21, fontFamily: 'monospace' }}>{label}</span>
      <span style={{ color: accent ? '#f87171' : '#e2e8f0', fontSize: 24, fontFamily: 'BowlbyOne, sans-serif', maxWidth: 280, overflow: 'hidden' }}>{value}</span>
    </div>
  );
}

// ── Main render function ─────────────────────────────────────────────────────

export interface RoastCardProps {
  userId:      number;
  username:    string;              // display name (already resolved)
  roast:       { id: string; text: string; character_tag: string };
  avatarBytes: Uint8Array | null;  // pre-fetched avatar, or null → default
}

export async function renderRoastCard(props: RoastCardProps): Promise<ImageResponse> {
  const { userId, username, roast, avatarBytes } = props;

  // ── PRNG seeded per (userId × week) ──
  const week = isoWeekNumber();
  const seed = hashStringToSeed(`${userId}:render:${week}`);
  const rng  = mulberry32(seed);

  // ── Resolve character cameo ──
  const character  = resolveCharacter(roast.character_tag, rng);
  const charBuffer = tryRead(character.assetPath);
  const charUri    = pngUri(charBuffer);

  // ── Avatar ──
  const avatarUri = avatarBytes ? jpegUri(avatarBytes) : (defaultAvatar ?? undefined);

  // ── Card content ──
  const stats     = generateStats(userId);
  const typeTag   = pickType(userId);
  const scene     = pickScene(userId, roast.id);
  const roastText = roast.text.replace(/\{name\}/g, username);
  const cardNum   = roast.id.replace(/\D/g, '').padStart(3, '0');

  // ── Font ──
  type FontOption = { name: string; data: ArrayBuffer; style: 'normal' | 'italic'; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 };
  const fonts: FontOption[] = fontBuffer
    ? [{ name: 'BowlbyOne', data: fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength) as ArrayBuffer, style: 'normal', weight: 400 }]
    : [];

  // ── JSX card (1080 × 1920) ──────────────────────────────────────────────

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg, #2d1a4e 0%, #1a0f2e 100%)`,
        border: `6px solid #1a0a2e`,
        fontFamily: 'BowlbyOne, sans-serif',
        overflow: 'hidden',
      }}>

        {/* ── HEADER STRIP (160px) ── red | blue | red */}
        <div style={{ display: 'flex', height: 160, width: '100%' }}>

          {/* Left red: NINTONDO wordmark */}
          <div style={{ display: 'flex', width: 280, background: RED, alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            {LOGO_URI
              ? <img src={LOGO_URI} style={{ height: 82, objectFit: 'contain' }} />
              : <span style={{ color: '#fff', fontSize: 42, letterSpacing: '-1px' }}>NINTONDO</span>
            }
          </div>

          {/* Middle blue: decorative stars */}
          <div style={{ display: 'flex', flex: 1, background: BLUE, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 30, letterSpacing: 12 }}>★  ★  ★</span>
          </div>

          {/* Right red: TYPE badge */}
          <div style={{ display: 'flex', width: 360, background: RED, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, letterSpacing: 3 }}>TYPE</span>
            <span style={{ color: YELLOW, fontSize: typeTag.length > 16 ? 20 : 25, letterSpacing: 1, textAlign: 'center' }}>{typeTag}</span>
          </div>

        </div>

        {/* ── USERNAME ROW (110px) ── */}
        <div style={{ display: 'flex', height: 110, background: DARK, alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', borderBottom: `3px solid ${RED}` }}>
          <span style={{ color: '#fff', fontSize: 50, maxWidth: 560, overflow: 'hidden' }}>@{username}</span>

          {/* HP bar — always 2/10 because same */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 24, marginRight: 4 }}>HP</span>
            {([0,1,2,3,4,5,6,7,8,9] as const).map(i => (
              <div key={i} style={{ width: 16, height: 16, background: i < 2 ? '#ef4444' : '#1f1f3a', border: '1px solid #333' }} />
            ))}
            <span style={{ color: '#ef4444', fontSize: 24, marginLeft: 6 }}>2/10</span>
          </div>
        </div>

        {/* ── ILLUSTRATION WINDOW (920px) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 920, background: 'linear-gradient(180deg, #3d1a6e 0%, #2d0a4e 55%, #1a0a2e 100%)', padding: '40px 48px 28px' }}>

          {/* Avatar + Character row */}
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>

            {/* User avatar: circular, yellow ring */}
            <div style={{ display: 'flex', width: 320, height: 320, borderRadius: '50%', border: `6px solid ${YELLOW}`, overflow: 'hidden', flexShrink: 0 }}>
              {avatarUri
                ? <img src={avatarUri} width={320} height={320} style={{ objectFit: 'cover' }} />
                : <div style={{ display: 'flex', width: 320, height: 320, background: '#1e1b4b', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: 120 }}>?</span>
                  </div>
              }
            </div>

            {/* Character cameo: rotated, pinned right */}
            {charUri && (
              <img
                src={charUri}
                style={{ height: 420, width: 400, objectFit: 'contain', transform: 'rotate(7deg)', flexShrink: 0 }}
              />
            )}

          </div>

          {/* Scene caption pill */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.58)', borderRadius: 40, padding: '10px 28px', border: `1px solid rgba(255,204,0,0.25)` }}>
              <span style={{ color: YELLOW, fontSize: 22, letterSpacing: 4, fontFamily: 'monospace' }}>
                SCENE: {scene}
              </span>
            </div>
          </div>

        </div>

        {/* ── ROAST PANEL (340px) ── cream/aged-paper */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 340, background: CREAM, padding: '22px 48px' }}>

          {/* ★ ROAST ATTACK header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <span style={{ color: RED, fontSize: 38 }}>★</span>
            <span style={{ color: RED, fontSize: 34, letterSpacing: 2 }}>ROAST ATTACK</span>
          </div>

          {/* Roast text — scale font for longer strings */}
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <span style={{
              color: '#2d1a4e',
              fontSize: roastText.length > 140 ? 30 : roastText.length > 100 ? 34 : 38,
              fontStyle: 'italic',
              fontFamily: 'serif',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}>
              "{roastText}"
            </span>
          </div>

        </div>

        {/* ── STATS PANEL (260px) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 260, background: DARK, padding: '18px 48px 14px', borderTop: `3px solid #4c1d95` }}>

          {/* — DEGEN PROFILE — */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <span style={{ color: PURPLE, fontSize: 24, fontFamily: 'monospace', letterSpacing: 4 }}>
              ═══ DEGEN PROFILE ═══
            </span>
          </div>

          {/* Two columns of 3 stats each */}
          <div style={{ display: 'flex', flex: 1, gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <StatRow label="PAPERHAND IDX" value={`${stats.paperhandIndex}%`}   accent={stats.paperhandIndex >= 85} />
              <StatRow label="LIQ RISK"      value={stats.liquidationRisk}         accent />
              <StatRow label="MENTAL STATE"  value={stats.mentalState}             accent />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <StatRow label="LAST TOP"      value={stats.lastBoughtTheTop} />
              <StatRow label="COPE"          value={stats.favoriteCope} />
              <StatRow label="NET WORTH Δ"   value={stats.netWorthDelta}            accent />
            </div>
          </div>

        </div>

        {/* ── FOOTER STRIP (130px) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 130, background: `linear-gradient(90deg, ${RED} 0%, ${BLUE} 50%, ${RED} 100%)`, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ color: '#fff', fontSize: 30, letterSpacing: 1 }}>
            CARD #{cardNum} · $NINTONDO on TON
          </span>
          <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 18 }}>
            unofficial parody · not affiliated with any video game company
          </span>
        </div>

      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );
}
