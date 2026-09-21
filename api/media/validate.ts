const mediaValidationCache = new Map<string, { valid: boolean; status: number; contentType?: string; reason?: string; timestamp: number }>();
const MEDIA_CACHE_TTL_MS = 15 * 60 * 1000;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.writeHead?.(405, { 'Content-Type': 'application/json' }) || res.status?.(405);
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  const targetUrl = req.query?.url || new URL(req.url, 'http://localhost:5173').searchParams.get('url');

  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    res.writeHead?.(400, { 'Content-Type': 'application/json' }) || res.status?.(400);
    res.end(JSON.stringify({ valid: false, reason: 'INVALID_URL' }));
    return;
  }

  const cached = mediaValidationCache.get(targetUrl);
  if (cached && Date.now() - cached.timestamp < MEDIA_CACHE_TTL_MS) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Atlas-Cache', 'HIT');
    res.end(JSON.stringify({
      valid: cached.valid,
      status: cached.status,
      contentType: cached.contentType,
      reason: cached.reason
    }));
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    let probeRes: Response;
    try {
      probeRes = await fetch(targetUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: controller.signal
      });

      if (probeRes.status === 405 || probeRes.status === 403) {
        probeRes = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Range': 'bytes=0-0'
          },
          redirect: 'follow',
          signal: controller.signal
        });
      }
    } finally {
      clearTimeout(timer);
    }

    const status = probeRes.status;
    const contentType = probeRes.headers.get('content-type') || undefined;

    let result: { valid: boolean; status: number; contentType?: string; reason?: string };
    if (status >= 200 && status < 400) {
      result = { valid: true, status, contentType };
    } else if (status === 404) {
      result = { valid: false, status: 404, reason: '404' };
    } else {
      result = { valid: false, status, reason: String(status) };
    }

    mediaValidationCache.set(targetUrl, { ...result, timestamp: Date.now() });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    let reason = 'UNKNOWN';
    let status = 502;
    if (err.name === 'AbortError' || err.message?.includes('timeout')) {
      reason = 'TIMEOUT';
      status = 408;
    } else if (err.message?.includes('ECONNRESET') || err.message?.includes('fetch failed')) {
      reason = 'CONNECTION_RESET';
      status = 502;
    }
    const result = { valid: false, status, reason };
    mediaValidationCache.set(targetUrl, { ...result, timestamp: Date.now() });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  }
}
