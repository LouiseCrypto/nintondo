/**
 * POST /api/prepare-share
 * Body: { userId: number, cardUrl: string }
 *
 * Downloads the card image, uploads it to Telegram via the Bot API
 * (temp message to the user's DM), grabs the cached file_id, deletes
 * the temp message, and returns { fileId }.
 *
 * The Mini App calls this BEFORE switchInlineQuery so the inline result
 * is instant (no slow image fetch during inline query answering).
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

  let body: { userId?: number; cardUrl?: string };
  try {
    body = await request.json() as { userId?: number; cardUrl?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { userId, cardUrl } = body;
  if (!userId || !cardUrl) {
    return new Response(JSON.stringify({ error: 'Missing userId or cardUrl' }), { status: 400 });
  }

  try {
    // 1. Download card image (same Vercel deployment — fast)
    const imgRes = await fetch(cardUrl);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: 'Card fetch failed' }), { status: 502 });
    }
    const imgBlob = await imgRes.blob();

    // 2. Upload to Telegram via sendPhoto (temp message to user's DM)
    const form = new FormData();
    form.append('chat_id', String(userId));
    form.append('photo', imgBlob, 'card.png');
    form.append('disable_notification', 'true');

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form,
    });
    const tgData = await tgRes.json() as {
      ok: boolean;
      result?: { message_id: number; photo: Array<{ file_id: string }> };
    };

    if (!tgData.ok || !tgData.result?.photo?.length) {
      return new Response(JSON.stringify({ error: 'Telegram upload failed' }), { status: 502 });
    }

    const fileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;
    const messageId = tgData.result.message_id;

    // 3. Delete the temp message (non-critical)
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: userId, message_id: messageId }),
    }).catch(() => {});

    return new Response(JSON.stringify({ fileId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Prepare share failed' }),
      { status: 500 },
    );
  }
}
