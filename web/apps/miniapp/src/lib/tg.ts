// Thin wrapper around the Telegram WebApp SDK.
// Centralising all SDK access here means the rest of the app can be
// tested without mocking the global window.Telegram object.

import WebApp from '@twa-dev/sdk';

export const tg = WebApp;

export function init(): void {
  WebApp.ready();
  WebApp.expand();
}

// URL param fallback — bot embeds uid/fn/un in the WebApp URL query string
// so user data is available even if initDataUnsafe fails to populate.
function urlParam(key: string): string | undefined {
  return new URLSearchParams(window.location.search).get(key) ?? undefined;
}

export function getUserId(): number | undefined {
  const id = WebApp.initDataUnsafe?.user?.id;
  if (id) return id;
  const p = urlParam('uid');
  return p ? Number(p) : undefined;
}

export function getFirstName(): string | undefined {
  return WebApp.initDataUnsafe?.user?.first_name ?? urlParam('fn');
}

export function getUsername(): string | undefined {
  return WebApp.initDataUnsafe?.user?.username ?? urlParam('un');
}

export function getPhotoUrl(): string | undefined {
  const sdkPhoto = WebApp.initDataUnsafe?.user?.photo_url;
  if (sdkPhoto) return sdkPhoto;
  // Fall back to the server-side avatar proxy using the uid we have
  const uid = getUserId();
  if (uid) return `${window.location.origin}/api/avatar?uid=${uid}`;
  return undefined;
}

export function getRawInitData(): string {
  return WebApp.initData ?? '';
}

// Theme-aware background colour for the card overlay
export function getBgColor(): string {
  return WebApp.backgroundColor ?? '#0f0a1e';
}

// Haptic helpers — swallow errors on clients that don't support them
export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  try {
    WebApp.HapticFeedback.impactOccurred(style);
  } catch { /* older clients */ }
}

export function hapticNotification(type: 'success' | 'warning' | 'error'): void {
  try {
    WebApp.HapticFeedback.notificationOccurred(type);
  } catch { /* older clients */ }
}

// MainButton helpers
export function showMainButton(text: string, onClick: () => void): void {
  WebApp.MainButton.setText(text);
  WebApp.MainButton.onClick(onClick);
  WebApp.MainButton.show();
}

export function setMainButtonLoading(loading: boolean): void {
  if (loading) {
    WebApp.MainButton.showProgress(false);
  } else {
    WebApp.MainButton.hideProgress();
  }
}

export function hideMainButton(): void {
  WebApp.MainButton.hide();
}
