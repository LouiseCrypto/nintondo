// Sharing helpers — robust fallback chain for all Telegram client versions.

import { tg } from './tg.js';

function storyText(roastText: string): string {
  return `${roastText}\n\nvia @nintondobot · $NINTONDO on TON`;
}

function openUrl(url: string): void {
  // Try Telegram's own link opener first, fall back to window.open
  try {
    if (typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(url);
      return;
    }
  } catch { /* fall through */ }
  try {
    if (typeof tg.openLink === 'function') {
      tg.openLink(url);
      return;
    }
  } catch { /* fall through */ }
  window.open(url, '_blank');
}

export function shareToStory(cardUrl: string, roastText: string): void {
  try {
    if (typeof tg.shareToStory === 'function') {
      tg.shareToStory(cardUrl, { text: storyText(roastText) });
      return;
    }
  } catch { /* fall through to chat share */ }
  shareToChat(cardUrl, roastText);
}

export function shareToChat(cardUrl: string, roastText: string): void {
  const text = storyText(roastText);

  // Try inline query switch (lets user pick any chat)
  try {
    if (typeof tg.switchInlineQuery === 'function') {
      tg.switchInlineQuery(roastText.slice(0, 50), ['users', 'groups', 'channels']);
      return;
    }
  } catch { /* fall through */ }

  // Universal Telegram share URL — works in Telegram's in-app browser
  const shareUrl =
    `https://t.me/share/url?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(text)}`;
  openUrl(shareUrl);
}
