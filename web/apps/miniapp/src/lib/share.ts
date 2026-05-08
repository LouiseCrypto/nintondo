// Sharing helpers — Story share with fallback to chat forwarding.
// Telegram's shareToStory is only available on newer clients; the fallback
// uses switchInlineQuery so the user can pick a chat themselves.

import { tg } from './tg.js';

// 9:16 story format caption
function storyText(roastText: string): string {
  return `${roastText}\n\nvia @nintondobot · $NINTONDO on TON`;
}

export function shareToStory(cardUrl: string, roastText: string): void {
  if (typeof tg.shareToStory === 'function') {
    tg.shareToStory(cardUrl, {
      text: storyText(roastText),
      // widget_link surfaces the Mini App in the story
      widget_link: {
        url: tg.initDataUnsafe?.start_param
          ? `https://t.me/${getBotUsername()}?startapp`
          : undefined,
        name: 'Get Roasted',
      },
    });
  } else {
    // Graceful degradation — older Telegram clients
    shareToChat(cardUrl, roastText);
  }
}

export function shareToChat(cardUrl: string, roastText: string): void {
  // switchInlineQuery lets the user pick any chat to forward the inline result
  if (typeof tg.switchInlineQuery === 'function') {
    tg.switchInlineQuery(roastText.slice(0, 50), ['users', 'groups', 'channels']);
  } else {
    // Last resort — open t.me/share URL in Telegram's built-in browser
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(storyText(roastText))}`;
    tg.openTelegramLink(shareUrl);
  }
}

// Best-effort bot username extraction from the start_param URL or init data
function getBotUsername(): string {
  // Fallback to a placeholder — the real username comes from BotFather config
  return 'nintondobot';
}
