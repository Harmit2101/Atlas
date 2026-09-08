import type { IncomingMessage, ServerResponse } from 'http';

const UNTERA_BASE_URL = 'https://api.untera.io/api/v1';

// Whitelist of allowed endpoints - prevents open proxy vulnerability
const ALLOWED_ENDPOINT_PATTERN = /^(listings\/search|listings\/[a-zA-Z0-9_-]+|market\/scores|stats|sources)$/;

/**
 * Serverless API Proxy for Untera Real Estate API
 * Runs server-side on Vercel to protect UNTERA_API_KEY and eliminate CORS issues.
 */
export default async function handler(req: any, res: any) {
  // Only permit GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.writeHead?.(405, { 'Content-Type': 'application/json' }) || res.status?.(405);
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' }));
    return;
  }

  // Read API Key strictly from server environment (never exposed to client bundle)
  const apiKey = process.env.UNTERA_API_KEY;
  if (!apiKey) {
    res.writeHead?.(503, { 'Content-Type': 'application/json' }) || res.status?.(503);
    res.end(JSON.stringify({ 
      error: 'UNTERA_API_KEY_NOT_CONFIGURED', 
      message: 'Server-side Untera API key is not configured in environment variables.' 
    }));
    return;
  }

  try {
    // Extract path from req.query.path (array or string) or parse from req.url
    let pathSegments: string[] = [];
    if (req.query && req.query.path) {
      pathSegments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
    } else {
      const parsedUrl = new URL(req.url || '', 'http://localhost');
      const clean = parsedUrl.pathname.replace(/^\/api\/untera\/?/, '');
      pathSegments = clean ? clean.split('/') : [];
    }

    const cleanPath = pathSegments.filter(Boolean).join('/');

    // Validate path against allowed whitelist
    if (!cleanPath || !ALLOWED_ENDPOINT_PATTERN.test(cleanPath)) {
      res.writeHead?.(403, { 'Content-Type': 'application/json' }) || res.status?.(403);
      res.end(JSON.stringify({ 
        error: 'FORBIDDEN_ENDPOINT', 
        message: 'The requested Untera endpoint is not permitted through the Atlas proxy.' 
      }));
      return;
    }

    // Extract query string from req.url or construct from req.query
    let queryString = '';
    if (req.url && req.url.includes('?')) {
      queryString = req.url.substring(req.url.indexOf('?'));
    } else if (req.query) {
      const q = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== 'path') {
          if (Array.isArray(value)) {
            value.forEach(v => q.append(key, v));
          } else if (value !== undefined) {
            q.append(key, String(value));
          }
        }
      }
      const qs = q.toString();
      queryString = qs ? `?${qs}` : '';
    }

    const upstreamUrl = `${UNTERA_BASE_URL}/${cleanPath}${queryString}`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey
      }
    });

    const status = upstreamResponse.status;
    const responseText = await upstreamResponse.text();

    res.writeHead?.(status, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }) || res.status?.(status);
    res.end(responseText);
  } catch (err: any) {
    res.writeHead?.(502, { 'Content-Type': 'application/json' }) || res.status?.(502);
    res.end(JSON.stringify({ 
      error: 'UPSTREAM_GATEWAY_ERROR', 
      message: err.message || 'Failed to reach Untera upstream server.' 
    }));
  }
}
