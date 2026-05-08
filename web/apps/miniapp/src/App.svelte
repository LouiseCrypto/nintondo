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
    showMainButton,
    setMainButtonLoading,
    hideMainButton,
    tg,
  } from './lib/tg.js';
  import { fetchRoast, type RoastResponse } from './lib/api.js';
  import { shareToStory, shareToChat } from './lib/share.js';

  // ── State ────────────────────────────────────────────────────────────────
  type Screen = 'landing' | 'generating' | 'reveal';
  let screen = $state<Screen>('landing');
  let result = $state<RoastResponse | null>(null);
  let error = $state<string | null>(null);

  // Slot-machine animation — cycles through roast snippets while loading
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
  let cardLoaded = $state(false);

  // ── Lifecycle ────────────────────────────────────────────────────────────
  onMount(() => {
    init();
    showMainButton('🔥 GET ROASTED', handleGetRoasted);
  });

  onDestroy(() => {
    clearSlot();
    hideMainButton();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function startSlot() {
    slotIndex = 0;
    slotTimer = setInterval(() => {
      slotIndex = (slotIndex + 1) % SLOT_PHRASES.length;
      hapticImpact('light');
    }, 400);
  }

  function clearSlot() {
    if (slotTimer !== null) {
      clearInterval(slotTimer);
      slotTimer = null;
    }
  }

  async function handleGetRoasted() {
    error = null;
    screen = 'generating';
    setMainButtonLoading(true);
    startSlot();
    hapticImpact('medium');

    try {
      const userId = getUserId() ?? 0;
      const firstName = getFirstName();
      const username = getUsername();
      const avatarUrl = getPhotoUrl();

      const data = await fetchRoast({ userId, firstName, username, avatarUrl });

      // Minimum 2s of animation so the slot machine has time to land
      await new Promise((r) => setTimeout(r, 2000));

      clearSlot();
      result = data;
      cardLoaded = false;
      screen = 'reveal';
      hapticNotification('success');
      hideMainButton();
    } catch (err) {
      clearSlot();
      error = err instanceof Error ? err.message : 'Something went wrong';
      screen = 'landing';
      hapticNotification('error');
      setMainButtonLoading(false);
    }
  }

  function handleRoastAgain() {
    result = null;
    error = null;
    screen = 'landing';
    hapticImpact('medium');
    showMainButton('🔥 GET ROASTED', handleGetRoasted);
  }

  // Use Telegram theme params for accent colour so the app respects dark/light mode
  const accent = tg.themeParams?.button_color ?? '#a855f7';
  const accentText = tg.themeParams?.button_text_color ?? '#ffffff';
  const bgColor = tg.themeParams?.bg_color ?? '#0f0a1e';
  const textColor = tg.themeParams?.text_color ?? '#f8fafc';
  const hintColor = tg.themeParams?.hint_color ?? '#64748b';
</script>

<main style:background={bgColor} style:color={textColor}>

  <!-- ── LANDING SCREEN ─────────────────────────────────────────────── -->
  {#if screen === 'landing'}
    <div class="screen landing">
      <div class="logo">
        <span class="logo-n">N</span>intondo
      </div>

      <div class="tagline" style:color={hintColor}>
        Nintendo characters. Crypto degeneracy.<br />Your financial ruin, narrated.
      </div>

      {#if error}
        <div class="error-box" role="alert">
          ⚠️ {error} — tap the button below to retry
        </div>
      {/if}

      <div class="landing-art" aria-hidden="true">🎮💀📉</div>

      <button
        class="btn btn-cta"
        style:background={accent}
        style:color={accentText}
        onclick={handleGetRoasted}
      >
        🔥 GET ROASTED
      </button>

      <p class="cta-hint" style:color={hintColor}>
        Your personalised degen profile awaits
      </p>
    </div>

  <!-- ── GENERATING SCREEN ──────────────────────────────────────────── -->
  {:else if screen === 'generating'}
    <div class="screen generating">
      <div class="slot-emoji" aria-hidden="true">🎰</div>
      <div class="slot-text" role="status" aria-live="polite">
        {SLOT_PHRASES[slotIndex]}
      </div>
      <div class="spinner" aria-hidden="true"></div>
    </div>

  <!-- ── REVEAL SCREEN ──────────────────────────────────────────────── -->
  {:else if screen === 'reveal' && result}
    <div class="screen reveal">
      <!-- Card image — lazy-loaded; fades in once the PNG is ready -->
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

      <!-- Action buttons -->
      <div class="actions">
        <button
          class="btn btn-primary"
          style:background={accent}
          style:color={accentText}
          onclick={() => {
            hapticImpact('medium');
            shareToStory(result!.cardUrl, result!.roast.text);
          }}
        >
          📖 Share to Story
        </button>

        <button
          class="btn btn-secondary"
          onclick={() => {
            hapticImpact('light');
            shareToChat(result!.cardUrl, result!.roast.text);
          }}
        >
          💬 Send to Chat
        </button>

        <button
          class="btn btn-ghost"
          onclick={handleRoastAgain}
        >
          🔄 Roast Me Again
        </button>
      </div>

      <p class="footer-text" style:color={hintColor}>
        powered by $NINTONDO on TON
      </p>
    </div>
  {/if}
</main>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-height: 100dvh;
    overflow-x: hidden;
  }

  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* ── Screens ─────────────────────────────────────────────────────── */
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 20px 48px;
    min-height: 100dvh;
    text-align: center;
  }

  /* ── Landing ─────────────────────────────────────────────────────── */
  .logo {
    font-size: clamp(2.5rem, 10vw, 4rem);
    font-weight: 900;
    letter-spacing: -1px;
    margin-bottom: 16px;
    color: #f8fafc;
  }

  .logo-n {
    background: linear-gradient(135deg, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1rem;
    line-height: 1.6;
    max-width: 280px;
    margin-bottom: 40px;
  }

  .landing-art {
    font-size: 4rem;
    margin-bottom: 32px;
  }

  .btn-cta {
    width: 100%;
    max-width: 320px;
    padding: 18px 24px;
    border-radius: 16px;
    border: none;
    font-size: 1.2rem;
    font-weight: 900;
    cursor: pointer;
    letter-spacing: 0.03em;
    margin-bottom: 20px;
    box-shadow: 0 4px 24px rgba(168, 85, 247, 0.4);
    transition: opacity 0.15s, transform 0.1s;
    font-family: inherit;
  }

  .btn-cta:active {
    opacity: 0.85;
    transform: scale(0.97);
  }

  .cta-hint {
    font-size: 0.875rem;
    max-width: 260px;
    line-height: 1.5;
  }

  .error-box {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 0.875rem;
    margin-bottom: 24px;
    max-width: 300px;
    color: #fca5a5;
  }

  /* ── Generating ──────────────────────────────────────────────────── */
  .generating {
    gap: 24px;
  }

  .slot-emoji {
    font-size: 5rem;
    animation: bounce 0.4s ease-in-out infinite alternate;
  }

  .slot-text {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #a855f7;
    min-height: 1.5em;
    transition: opacity 0.15s;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(168, 85, 247, 0.2);
    border-top-color: #a855f7;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── Reveal ──────────────────────────────────────────────────────── */
  .reveal {
    justify-content: flex-start;
    padding-top: 20px;
    gap: 0;
  }

  .card-wrapper {
    width: 100%;
    max-width: 360px;
    aspect-ratio: 9 / 16;
    background: rgba(168, 85, 247, 0.1);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(168, 85, 247, 0.25);
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .card-img.loaded {
    opacity: 1;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 360px;
  }

  .btn {
    width: 100%;
    padding: 14px 20px;
    border-radius: 14px;
    border: none;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    font-family: inherit;
  }

  .btn:active {
    opacity: 0.85;
    transform: scale(0.98);
  }

  .btn-primary {
    /* background and color set via inline style from theme params */
  }

  .btn-secondary {
    background: rgba(168, 85, 247, 0.2);
    color: #e2e8f0;
    border: 1px solid rgba(168, 85, 247, 0.4);
  }

  .btn-ghost {
    background: transparent;
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .footer-text {
    font-size: 0.75rem;
    margin-top: 16px;
    margin-bottom: 0;
  }

  /* ── Animations ──────────────────────────────────────────────────── */
  @keyframes bounce {
    from { transform: translateY(0); }
    to   { transform: translateY(-12px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
