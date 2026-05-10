/**
 * POST /api/prepare-share
 * Body: { userId: number, cardUrl: string, caption?: string }
 *
 * Downloads the card image, sends it to the user's DM with the bot
 * via the Telegram Bot API. The photo stays in the DM so the user
 * can forward it to any chat.
 */

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const BOT_TOKEN = (process.env.BOT_TOKEN ?? '').trim();
  if (!BOT_TOKEN) {
    return new Response(JSON.stringify({ error: 'Bot token not configured' }), { status: 503 });
  }

  let body: { userId?: number; cardUrl?: string; caption?: string };
  try {
    body = await request.json() as { userId?: number; cardUrl?: string; caption?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { userId, cardUrl } = body;
  if (!userId || !cardUrl) {
    return new Response(JSON.stringify({ error: 'Missing userId or cardUrl' }), { status: 400 });
  }

  const caption = body.caption ?? '🎮 Your Nintondo Roast Card\n\nForward this message to share it with friends!';

  try {
    // 1. Download card image (same Vercel deployment — fast)
    const imgRes = await fetch(cardUrl);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: 'Card fetch failed' }), { status: 502 });
    }
    const imgBlob = await imgRes.blob();

    // 2. Send to user's DM with caption — KEEP the message so they can forward it
    const form = new FormData();
    form.append('chat_id', String(userId));
    form.append('photo', imgBlob, 'card.png');
    form.append('caption', caption);

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form,
    });
    const tgData = await tgRes.json() as { ok: boolean; description?: string };

    if (!tgData.ok) {
      return new Response(JSON.stringify({ error: tgData.description ?? 'Telegram send failed' }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Prepare share failed' }),
      { status: 500 },
    );
  }
}
