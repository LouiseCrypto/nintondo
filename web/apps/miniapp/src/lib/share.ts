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

export async function shareToChat(cardUrl: string, roastText: string): Promise<void> {
  const text = storyCaption(roastText);

  // SDK available (proper Mini App context)
  if (sdkAvailable()) {
    // Prefer switchInlineQuery — lets user pick any chat
    try {
      if (typeof tg.switchInlineQuery === 'function') {
        tg.switchInlineQuery(roastText.slice(0, 50), ['users', 'groups', 'channels']);
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
