// Direct access to window.Telegram.WebApp — @twa-dev/sdk v8 breaks its own proxy.
// The telegram-web-app.js script in index.html loads synchronously before any module JS,
// so window.Telegram.WebApp is always available by the time this module runs.

function wa(): any {
  return (window as any).Telegram?.WebApp ?? {};
}

// Proxy so callers can do tg.platform, tg.shareToStory(), etc. and always
// get the live value from the real WebApp object.
export const tg: any = new Proxy({} as Record<string, unknown>, {
  get(_t, prop: string) {
    const app = wa();
    const val = app[prop];
    return typeof val === 'function' ? val.bind(app) : val;
  },
});

export function init(): void {
  try { wa().ready?.(); } catch { /* non-Telegram context */ }
  try { wa().expand?.(); } catch { /* non-Telegram context */ }
}

// URL param fallback — bot embeds uid/fn/un in the WebApp URL query string
function urlParam(key: string): string | undefined {
  return new URLSearchParams(window.location.search).get(key) ?? undefined;
}

export function getUserId(): number | undefined {
  const id = wa().initDataUnsafe?.user?.id;
  if (id) return id;
  const p = urlParam('uid');
  return p ? Number(p) : undefined;
}

export function getFirstName(): string | undefined {
  return wa().initDataUnsafe?.user?.first_name ?? urlParam('fn');
}

export function getUsername(): string | undefined {
  return wa().initDataUnsafe?.user?.username ?? urlParam('un');
}

export function getPhotoUrl(): string | undefined {
  const sdkPhoto = wa().initDataUnsafe?.user?.photo_url;
  if (sdkPhoto) return sdkPhoto;
  const uid = getUserId();
  if (uid) return `${window.location.origin}/api/avatar?uid=${uid}`;
  return undefined;
}

export function getRawInitData(): string {
  return wa().initData ?? '';
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  try { wa().HapticFeedback?.impactOccurred(style); } catch { }
}

export function hapticNotification(type: 'success' | 'warning' | 'error'): void {
  try { wa().HapticFeedback?.notificationOccurred(type); } catch { }
}

export function showMainButton(text: string, onClick: () => void): void {
  try {
    const btn = wa().MainButton;
    btn.setText(text);
    btn.onClick(onClick);
    btn.show();
  } catch { }
}

export function setMainButtonLoading(loading: boolean): void {
  try {
    const btn = wa().MainButton;
    if (loading) btn.showProgress(false); else btn.hideProgress();
  } catch { }
}

export function hideMainButton(): void {
  try { wa().MainButton?.hide(); } catch { }
}

export function getBgColor(): string {
  return wa().backgroundColor ?? '#0f0a1e';
}
