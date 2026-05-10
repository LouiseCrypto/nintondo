/**
 * POST /api/prepare-share
 * Body: { userId: number, cardUrl: string, caption?: string }
 *
 * Downloads the card image, sends it to the user's DM with the bot
 * as a DOCUMENT (preserves full resolution, no Telegram compression).
 * Then sends a separate text message with forwarding instructions.
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

  const caption = body.caption ?? '🎮 My Nintondo Roast Card\n\n$NINTONDO on TON | via @nintondobot';

  try {
    // 1. Download card image (same Vercel deployment — fast)
    const imgRes = await fetch(cardUrl);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: 'Card fetch failed' }), { status: 502 });
    }
    const imgBlob = await imgRes.blob();

    // 2. Send card as a DOCUMENT to preserve full resolution (no Telegram compression/cropping)
    const form = new FormData();
    form.append('chat_id', String(userId));
    form.append('document', imgBlob, 'Nintondo-Roast-Card.png');
    form.append('caption', caption);

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: form,
    });
    const tgData = await tgRes.json() as { ok: boolean; description?: string };

    if (!tgData.ok) {
      return new Response(JSON.stringify({ error: tgData.description ?? 'Telegram send failed' }), { status: 502 });
    }

    // 3. Send a separate instruction message (won't be included when forwarding the card)
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: '👆 Forward the card above to share it with any chat!',
      }),
    }).catch(() => {});

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
