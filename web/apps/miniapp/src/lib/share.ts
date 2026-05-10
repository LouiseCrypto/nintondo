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
 * Send the card photo to the user's DM with the bot,
 * then navigate to the bot chat so they can forward it.
 */
export async function shareToChat(cardUrl: string, roastText: string): Promise<void> {
  const userId = getUserId();

  if (userId) {
    try {
      const res = await fetch('/api/prepare-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cardUrl,
          caption: `🎮 My Nintondo Roast Card\n\n${roastText}\n\n$NINTONDO on TON | via @nintondobot\n\n👆 Forward this message to share!`,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (res.ok) {
        // Navigate to the bot's DM where the card was just sent
        if (sdkAvailable()) {
          tg.openTelegramLink('https://t.me/NintondoBot');
        }
        return;
      }
    } catch { }
  }

  // Fallback: deep link share
  if (sdkAvailable()) {
    try {
      const text = storyCaption(roastText);
      const deepLink = `tg://msg_url?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(text)}`;
      tg.openTelegramLink(deepLink);
      return;
    } catch { }
  }

  // Last resort: clipboard
  try {
    await navigator.clipboard.writeText(cardUrl);
  } catch { }
  alert('Link copied! Paste it into any Telegram chat to share your card 👇\n\n' + cardUrl);
}
