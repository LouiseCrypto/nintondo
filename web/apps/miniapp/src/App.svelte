<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    init,
    getUserId,
    getFirstName,
    getUsername,
    getPhotoUrl,
    hapticImpact,
    hapticNotification,
    tg,
  } from './lib/tg.js';
  import { fetchRoast, type RoastResponse } from './lib/api.js';
  import { shareToStory, shareToChat } from './lib/share.js';

  // ── State ────────────────────────────────────────────────────────────────
  type Screen = 'landing' | 'generating' | 'reveal';
  let screen    = $state<Screen>('landing');
  let result    = $state<RoastResponse | null>(null);
  let error     = $state<string | null>(null);
  let loading   = $state(false);   // button loading state while fetch is in-flight
  let cardLoaded = $state(false);
  let diagResult = $state<string | null>(null);

  // Slot-machine animation
  const SLOT_PHRASES = [
    'CALCULATING DEGEN SCORE...',
    'CHECKING YOUR BAGS...',
    'REVIEWING TRANSACTION HISTORY...',
    'CONSULTING THE CHART...',
    'FINDING YOUR WEAKNESSES...',
    'ASKING MARIO...',
  ];
  let slotIndex = $state(0);
  let slotTimer: ReturnType<typeof setInterval> | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────
  onMount(() => {
    try { init(); } catch { /* outside Telegram — ignore */ }
  });

  onDestroy(() => {
    clearSlot();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function startSlot() {
    slotIndex = 0;
    slotTimer = setInterval(() => {
      slotIndex = (slotIndex + 1) % SLOT_PHRASES.length;
    }, 450);
  }

  function clearSlot() {
    if (slotTimer !== null) { clearInterval(slotTimer); slotTimer = null; }
  }

  // ── Main flow ─────────────────────────────────────────────────────────────
  // Fetch happens while still on landing (button goes loading).
  // We only switch to 'generating' once we have data — so there's
  // nothing that can get permanently stuck on the generating screen.
  async function handleGetRoasted() {
    if (loading) return;   // prevent double-tap
    error = null;
    loading = true;
    diagResult = null;

    try {
      hapticImpact('medium');

      const userId    = getUserId()    ?? 0;
      const firstName = getFirstName() ?? undefined;
      const username  = getUsername()  ?? undefined;
      const avatarUrl = getPhotoUrl()  ?? undefined;

      const data = await fetchRoast({ userId, firstName, username, avatarUrl });

      // Switch to generating only after we have the data — show animation briefly
      result = data;
      cardLoaded = false;
      screen = 'generating';
      startSlot();

      await new Promise<void>((r) => setTimeout(r, 1800));

      clearSlot();
      screen = 'reveal';
      hapticNotification('success');

    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong — try again';
      hapticNotification('error');
    } finally {
      loading = false;
    }
  }

  function handleRoastAgain() {
    result = null;
    error = null;
    screen = 'landing';
    hapticImpact('medium');
  }

  // ── Diagnostic ───────────────────────────────────────────────────────────
  async function testApi() {
    diagResult = 'calling /api/roast…';
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, firstName: 'Test' }),
        signal: AbortSignal.timeout(10_000),
      });
      const text = await res.text();
      diagResult = `${res.status}\n${text.slice(0, 300)}`;
    } catch (e) {
      diagResult = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // ── Theme ─────────────────────────────────────────────────────────────────
  const accent    = tg.themeParams?.button_color      ?? '#a855f7';
  const accentText = tg.themeParams?.button_text_color ?? '#ffffff';
  const bgColor   = tg.themeParams?.bg_color          ?? '#0f0a1e';
  const textColor = tg.themeParams?.text_color         ?? '#f8fafc';
  const hintColor = tg.themeParams?.hint_color         ?? '#64748b';
</script>

<main style:background={bgColor} style:color={textColor}>

  <!-- ── LANDING ───────────────────────────────────────────────────── -->
  {#if screen === 'landing'}
    <div class="screen landing">
      <div class="logo"><span class="logo-n">N</span>intondo</div>

      <div class="tagline" style:color={hintColor}>
        Nintendo characters. Crypto degeneracy.<br />Your financial ruin, narrated.
      </div>

      {#if error}
        <div class="error-box" role="alert">⚠️ {error}</div>
      {/if}

      <div class="landing-art" aria-hidden="true">🎮💀📉</div>

      <button
        class="btn btn-cta"
        class:btn-loading={loading}
        style:background={accent}
        style:color={accentText}
        onclick={handleGetRoasted}
        disabled={loading}
      >
        {loading ? '⏳ LOADING...' : '🔥 GET ROASTED'}
      </button>

      <p class="cta-hint" style:color={hintColor}>
        Your personalised degen profile awaits
      </p>

      <p class="build-stamp" style:color={hintColor}>build: 2026-05-09c</p>
    </div>

  <!-- ── GENERATING ────────────────────────────────────────────────── -->
  {:else if screen === 'generating'}
    <div class="screen generating">
      <div class="slot-emoji" aria-hidden="true">🎰</div>
      <div class="slot-text" role="status" aria-live="polite">
        {SLOT_PHRASES[slotIndex]}
      </div>
      <div class="spinner" aria-hidden="true"></div>
    </div>

  <!-- ── REVEAL ────────────────────────────────────────────────────── -->
  {:else if screen === 'reveal' && result}
    <div class="screen reveal">
      <div class="card-wrapper">
        <img
          class="card-img"
          class:loaded={cardLoaded}
          src={result.cardUrl}
          alt="Your roast card"
          loading="eager"
          onload={() => { cardLoaded = true; }}
          onerror={(e) => { (e.currentTarget as HTMLImageElement).alt = 'Card unavailable'; }}
        />
      </div>

      <div class="actions">
        <button
          class="btn btn-primary"
          style:background={accent}
          style:color={accentText}
          onclick={() => { hapticImpact('medium'); shareToStory(result!.cardUrl, result!.roast.text); }}
        >
          📖 Share to Story
        </button>

        <button
          class="btn btn-secondary"
          onclick={() => { hapticImpact('light'); shareToChat(result!.cardUrl, result!.roast.text); }}
        >
          💬 Send to Chat
        </button>

        <button class="btn btn-ghost" onclick={handleRoastAgain}>
          🔄 Roast Me Again
        </button>
      </div>

      <p class="footer-text" style:color={hintColor}>powered by $NINTONDO on TON</p>
    </div>
  {/if}
</main>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(body) {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-height: 100dvh; overflow-x: hidden;
  }

  main { min-height: 100dvh; display: flex; flex-direction: column; }

  .screen {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px 20px 48px;
    min-height: 100dvh; text-align: center;
  }

  /* ── Landing ── */
  .logo { font-size: clamp(2.5rem,10vw,4rem); font-weight: 900; letter-spacing: -1px; margin-bottom: 16px; color: #f8fafc; }
  .logo-n { background: linear-gradient(135deg,#a855f7,#ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .tagline { font-size: 1rem; line-height: 1.6; max-width: 280px; margin-bottom: 40px; }
  .landing-art { font-size: 4rem; margin-bottom: 32px; }

  .btn-cta {
    width: 100%; max-width: 320px;
    padding: 18px 24px; border-radius: 16px; border: none;
    font-size: 1.2rem; font-weight: 900; cursor: pointer;
    letter-spacing: 0.03em; margin-bottom: 20px;
    box-shadow: 0 4px 24px rgba(168,85,247,0.4);
    transition: opacity 0.15s, transform 0.1s;
    font-family: inherit;
  }
  .btn-cta:active { opacity: 0.85; transform: scale(0.97); }
  .btn-cta:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .btn-loading { animation: pulse 1s ease-in-out infinite; }

  .cta-hint { font-size: 0.875rem; max-width: 260px; line-height: 1.5; }
  .error-box {
    background: rgba(239,68,68,0.15); border: 1px solid #ef4444;
    border-radius: 12px; padding: 12px 16px; font-size: 0.875rem;
    margin-bottom: 24px; max-width: 300px; color: #fca5a5;
  }
  .build-stamp { margin-top: 16px; font-size: 0.65rem; font-family: monospace; }

  /* ── Generating ── */
  .generating { gap: 24px; }
  .slot-emoji { font-size: 5rem; animation: bounce 0.4s ease-in-out infinite alternate; }
  .slot-text { font-size: 1rem; font-weight: 700; letter-spacing: 0.05em; color: #a855f7; min-height: 1.5em; }
  .spinner { width: 40px; height: 40px; border: 3px solid rgba(168,85,247,0.2); border-top-color: #a855f7; border-radius: 50%; animation: spin 0.7s linear infinite; }

  /* ── Reveal ── */
  .reveal { justify-content: flex-start; padding-top: 20px; gap: 0; }
  .card-wrapper { width: 100%; max-width: 360px; aspect-ratio: 9/16; background: rgba(168,85,247,0.1); border-radius: 16px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(168,85,247,0.25); }
  .card-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.4s ease; }
  .card-img.loaded { opacity: 1; }
  .actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 360px; }
  .btn { width: 100%; padding: 14px 20px; border-radius: 14px; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s, transform 0.1s; font-family: inherit; }
  .btn:active { opacity: 0.85; transform: scale(0.98); }
  .btn-secondary { background: rgba(168,85,247,0.2); color: #e2e8f0; border: 1px solid rgba(168,85,247,0.4); }
  .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
  .footer-text { font-size: 0.75rem; margin-top: 16px; margin-bottom: 0; }

  @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
</style>
