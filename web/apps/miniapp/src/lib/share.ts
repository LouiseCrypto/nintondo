import { tg } from './tg.js';

function storyCaption(roastText: string): string {
  return `${roastText}\n\nvia @nintondobot · $NINTONDO on TON`;
}

function sdkAvailable(): boolean {
  return typeof tg.openTelegramLink === 'function';
}

export function shareToStory(cardUrl: string, roastText: string): void {
  try {
    if (typeof tg.shareToStory === 'function') {
      tg.shareToStory(cardUrl, { text: storyCaption(roastText) });
      return;
    }
  } catch { }
  void shareToChat(cardUrl, roastText);
}

/**
 * Build a short card URL (≤ ~100 chars) safe to pass via switchInlineQuery.
 * Strips `t` (roast text) and `a` (avatar URL) — card.tsx resolves these
 * server-side via the roast ID lookup and /api/avatar proxy.
 */
function shortCardUrl(cardUrl: string): string {
  try {
    const u = new URL(cardUrl);
    u.searchParams.delete('t');
    u.searchParams.delete('a');
    return u.toString().slice(0, 256);
  } catch {
    return cardUrl.slice(0, 256);
  }
}

export async function shareToChat(cardUrl: string, roastText: string): Promise<void> {
  const text = storyCaption(roastText);

  // SDK available (proper Mini App context)
  if (sdkAvailable()) {
    // switchInlineQuery — passes a short card URL so the bot returns a photo result.
    // Full URL would exceed Telegram's 256-char query limit, so we strip `t` and `a`.
    try {
      if (typeof tg.switchInlineQuery === 'function') {
        tg.switchInlineQuery(shortCardUrl(cardUrl), ['users', 'groups', 'channels']);
        return;
      }
    } catch { }

    // Fall back to tg:// deep link share dialog
    try {
      const deepLink = `tg://msg_url?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(text)}`;
      tg.openTelegramLink(deepLink);
      return;
    } catch { }
  }

  // No SDK — copy to clipboard with clear instruction
  try {
    await navigator.clipboard.writeText(cardUrl);
  } catch { }
  alert('Link copied! Paste it into any Telegram chat to share your card 👇\n\n' + cardUrl);
}
