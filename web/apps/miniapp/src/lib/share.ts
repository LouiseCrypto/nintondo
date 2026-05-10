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
 * Extract compact card params from the full card URL.
 * Format: "card:userId:roastId:name:charTag"
 * The bot reconstructs the full URL server-side.
 */
function cardShareCode(cardUrl: string): string {
  try {
    const u = new URL(cardUrl);
    const p = u.searchParams;
    return `card:${p.get('u') ?? '0'}:${p.get('r') ?? 'r000'}:${p.get('n') ?? 'anon'}:${p.get('c') ?? 'general'}`;
  } catch {
    return cardUrl.slice(0, 256);
  }
}

export async function shareToChat(cardUrl: string, roastText: string): Promise<void> {
  const text = storyCaption(roastText);

  // SDK available (proper Mini App context)
  if (sdkAvailable()) {
    // switchInlineQuery — passes a compact code (not a URL) so the bot can
    // reconstruct the card URL and return a photo result.
    try {
      if (typeof tg.switchInlineQuery === 'function') {
        tg.switchInlineQuery(cardShareCode(cardUrl), ['users', 'groups', 'channels']);
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
