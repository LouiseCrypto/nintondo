// Thin wrapper around the Telegram WebApp SDK.
// Centralising all SDK access here means the rest of the app can be
// tested without mocking the global window.Telegram object.

import WebApp from '@twa-dev/sdk';

export const tg = WebApp;

export function init(): void {
  WebApp.ready();
  WebApp.expand();
}

export function getUserId(): number | undefined {
  return WebApp.initDataUnsafe?.user?.id;
}

export function getFirstName(): string | undefined {
  return WebApp.initDataUnsafe?.user?.first_name;
}

export function getUsername(): string | undefined {
  return WebApp.initDataUnsafe?.user?.username;
}

export function getPhotoUrl(): string | undefined {
  // Telegram exposes photo_url in initDataUnsafe.user when available
  return WebApp.initDataUnsafe?.user?.photo_url;
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
