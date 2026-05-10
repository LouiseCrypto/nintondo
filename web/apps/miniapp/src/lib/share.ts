import { tg, getUserId } from './tg.js';

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
 * Pre-upload the card image to Telegram via /api/prepare-share.
 * Returns the cached file_id, or null on failure.
 */
async function prepareShare(cardUrl: string): Promise<string | null> {
  const userId = getUserId();
  if (!userId) return null;
  try {
    const res = await fetch('/api/prepare-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cardUrl }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { fileId?: string };
    return data.fileId ?? null;
  } catch {
    return null;
  }
}

export async function shareToChat(cardUrl: string, roastText: string): Promise<void> {
  const text = storyCaption(roastText);

  // SDK available (proper Mini App context)
  if (sdkAvailable() && typeof tg.switchInlineQuery === 'function') {
    // Pre-upload the card to Telegram BEFORE opening the chat picker.
    // This way the inline result loads instantly when the user picks a chat.
    try {
      const fileId = await prepareShare(cardUrl);
      if (fileId) {
        tg.switchInlineQuery(`cached:${fileId}`, ['users', 'groups', 'channels']);
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
