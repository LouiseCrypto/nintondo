// Sharing helpers — robust fallback chain for all Telegram client versions.

import { tg } from './tg.js';

function storyCaption(roastText: string): string {
  return `${roastText}\n\nvia @nintondobot · $NINTONDO on TON`;
}

// ── Story share ────────────────────────────────────────────────────────────

export function shareToStory(cardUrl: string, roastText: string): void {
  // 1. Telegram native story share (Telegram 7.8+, initialized SDK)
  try {
    if (typeof tg.shareToStory === 'function') {
      tg.shareToStory(cardUrl, { text: storyCaption(roastText) });
      return;
    }
  } catch { /* fall through */ }

  // 2. Fall back to chat share
  shareToChat(cardUrl, roastText);
}

// ── Chat share ─────────────────────────────────────────────────────────────

export async function shareToChat(cardUrl: string, roastText: string): Promise<void> {
  const text = storyCaption(roastText);

  // 1. Telegram switchInlineQuery — lets user pick any chat (requires initialized SDK)
  try {
    if (typeof tg.switchInlineQuery === 'function') {
      tg.switchInlineQuery(roastText.slice(0, 50), ['users', 'groups', 'channels']);
      return;
    }
  } catch { /* fall through */ }

  // 2. tg://msg_url deep link — Telegram WebView intercepts tg:// natively
  try {
    const deepLink = `tg://msg_url?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(text)}`;
    window.location.href = deepLink;
    return;
  } catch { /* fall through */ }

  // 3. Copy card URL to clipboard as last resort
  try {
    await navigator.clipboard.writeText(cardUrl);
    alert('Card link copied — paste it into any Telegram chat!');
  } catch {
    alert(`Card link:\n${cardUrl}`);
  }
}
