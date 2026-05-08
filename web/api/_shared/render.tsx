// Card template for @vercel/og — 1080x1920 story format.
// Satori supports a subset of CSS flex layout; no grid, no transforms.

import type { DegenStats } from './stats.js';

// Default avatar as inline SVG data URI — used when the Telegram avatar
// is unavailable so the Edge function never needs to hit the filesystem.
export const DEFAULT_AVATAR_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='22' fill='%236b7280'/%3E%3Cellipse cx='50' cy='90' rx='32' ry='25' fill='%236b7280'/%3E%3C/svg%3E";

interface CardProps {
  name: string;
  roastText: string;
  stats: DegenStats;
  avatarSrc: string; // https URL or data URI
}

function StatRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        fontSize: 28,
        fontFamily: 'monospace',
      }}
    >
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: accent ? '#f87171' : '#e2e8f0', fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

export function CardTemplate({ name, roastText, stats, avatarSrc }: CardProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 40%, #0f0a1e 100%)',
        padding: '72px 60px 48px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
        }}
      />

      {/* Avatar */}
      <div
        style={{
          display: 'flex',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: '6px solid #a855f7',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(168,85,247,0.5)',
          marginBottom: 28,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          width={300}
          height={300}
          style={{ objectFit: 'cover' }}
          alt=""
        />
      </div>

      {/* Name */}
      <div
        style={{
          color: '#e2e8f0',
          fontSize: 52,
          fontWeight: 'bold',
          marginBottom: 48,
          letterSpacing: '-0.5px',
        }}
      >
        {name}
      </div>

      {/* Roast text */}
      <div
        style={{
          color: '#f8fafc',
          fontSize: 58,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.25,
          maxWidth: 900,
          marginBottom: 'auto',
          padding: '0 20px',
        }}
      >
        &ldquo;{roastText}&rdquo;
      </div>

      {/* Stats block */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid #4c1d95',
          borderRadius: 20,
          padding: '32px 44px',
          width: '100%',
          marginTop: 48,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            color: '#a855f7',
            fontSize: 30,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          ╔══ DEGEN PROFILE ══╗
        </div>

        <StatRow label="Paperhand Index:" value={`${stats.paperhandIndex}%`} accent={stats.paperhandIndex >= 85} />
        <StatRow label="Liquidation Risk:" value={stats.liquidationRisk} accent />
        <StatRow label="Mental State:" value={stats.mentalState} accent />
        <StatRow label="Last Bought Top:" value={stats.lastBoughtTheTop} />
        <StatRow label="Cope Of Choice:" value={stats.favoriteCope} />
        <StatRow label="Net Worth Delta:" value={stats.netWorthDelta} accent />

        <div
          style={{
            color: '#a855f7',
            fontSize: 30,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          ╚═══════════════════╝
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          color: '#475569',
          fontSize: 26,
          marginTop: 8,
        }}
      >
        via @nintondobot · $NINTONDO on TON
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
        }}
      />
    </div>
  );
}
