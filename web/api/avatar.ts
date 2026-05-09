/**
 * GET /api/avatar?uid=<telegramUserId>
 * Proxies the user's Telegram profile photo via the bot token (server-side only).
 * Bot token is read from BOT_TOKEN env var set in Vercel dashboard.
 */

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const uid = new URL(request.url).searchParams.get('uid');
  if (!uid) return new Response('Missing uid', { status: 400 });

  const BOT_TOKEN = (process.env.BOT_TOKEN ?? '').trim();
  if (!BOT_TOKEN) return new Response('Bot token not configured', { status: 503 });

  try {
    // Step 1: get profile photo list
    const photosRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${uid}&limit=1`,
    );
    const photosJson = await photosRes.json() as { ok: boolean; result?: { photos: Array<Array<{ file_id: string }>> } };
    if (!photosJson.ok || !photosJson.result?.photos?.length) {
      return new Response('No photo', { status: 404 });
    }

    // Pick the smallest size (index 0) to keep it fast
    const fileId = photosJson.result.photos[0][0].file_id;

    // Step 2: resolve file path
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
    );
    const fileJson = await fileRes.json() as { ok: boolean; result?: { file_path: string } };
    if (!fileJson.ok || !fileJson.result?.file_path) {
      return new Response('File not found', { status: 404 });
    }

    // Step 3: fetch and stream the image
    const imgRes = await fetch(
      `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileJson.result.file_path}`,
    );
    if (!imgRes.ok) return new Response('Image unavailable', { status: 502 });

    const bytes = await imgRes.arrayBuffer();
    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response('Avatar fetch failed', { status: 500 });
  }
}
