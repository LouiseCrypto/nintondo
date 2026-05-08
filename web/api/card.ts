// GET /api/card?u=<userId>&r=<roastId>&n=<name>&a=<avatarUrl>
// Returns a 1080x1920 PNG roast card rendered by @vercel/og.
//
// Edge Runtime — globally distributed, ~50ms cold start.
// Everything is inlined into this one file because Vercel's Edge bundler
// cannot follow relative imports that lead to .tsx modules.

import { ImageResponse } from '@vercel/og';
import React from 'react';
import roastsData from './_shared/roasts.json';
import { generateStats, type DegenStats } from './_shared/stats.js';

export const config = { runtime: 'edge' };

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

interface RoastEntry {
  id: string;
  text: string;
  category: string;
  character_tag: string;
  weight: number;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get('u') ?? '0');
  const roastId = url.searchParams.get('r') ?? '';
  const name = url.searchParams.get('n') ?? 'anon';
  const avatarUrlParam = url.searchParams.get('a');

  const roast = (roastsData.roasts as RoastEntry[]).find((r) => r.id === roastId);
  const roastText = roast
    ? roast.text.replace(/\{name\}/g, name)
    : 'the market already roasted you harder than anything I could say';

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
