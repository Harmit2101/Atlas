import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

const ALLOWED_ENDPOINT_PATTERN = /^(listings\/search|listings\/[a-zA-Z0-9_-]+|market\/scores|stats|sources)$/;

/**
 * Local development proxy middleware for Untera API.
 * Emulates the Vercel serverless proxy, protecting UNTERA_API_KEY from browser exposure,
 * completely bypassing CORS restrictions on localhost, and caching responses in-memory
 * to strictly honor the 15 req/min burst and 1,000 req/day quota.
 */
const proxyCache = new Map<string, { body: string; status: number; timestamp: number }>();
const PROXY_CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute server-side cache

function unteraProxyPlugin(envApiKey?: string): Plugin {
  return {
    name: 'untera-local-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/untera')) {
          return next();
        }

        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' }));
          return;
        }

        const apiKey = envApiKey || process.env.UNTERA_API_KEY;
        if (!apiKey) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'UNTERA_API_KEY_NOT_CONFIGURED',
            message: 'Server-side UNTERA_API_KEY is not configured in local environment variables (.env.local).'
          }));
          return;
        }

        try {
          const parsedUrl = new URL(req.url, 'http://localhost:5173');
          const cleanPath = parsedUrl.pathname.replace(/^\/api\/untera\/?/, '');

          if (!cleanPath || !ALLOWED_ENDPOINT_PATTERN.test(cleanPath)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'FORBIDDEN_ENDPOINT',
              message: 'The requested Untera endpoint is not permitted through the Atlas proxy.'
            }));
            return;
          }

          const cacheKey = `${cleanPath}${parsedUrl.search}`;
          const cached = proxyCache.get(cacheKey);

          // Return fresh cached server-side response
          if (cached && Date.now() - cached.timestamp < PROXY_CACHE_TTL_MS) {
            res.statusCode = cached.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Atlas-Cache', 'HIT');
            res.end(cached.body);
            return;
          }

          const upstreamUrl = `https://api.untera.io/api/v1/${cleanPath}${parsedUrl.search}`;

          const upstreamResponse = await fetch(upstreamUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-API-Key': apiKey
            }
          });

          const status = upstreamResponse.status;
          const responseText = await upstreamResponse.text();

          // Handle rate-limit gracefully using stale cache if available
          if (status === 429 && cached) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Atlas-Cache', 'STALE_RATE_LIMITED');
            res.end(cached.body);
            return;
          }

          if (status === 200) {
            proxyCache.set(cacheKey, {
              body: responseText,
              status,
              timestamp: Date.now()
            });
          }

          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
          res.end(responseText);
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'UPSTREAM_GATEWAY_ERROR',
            message: err.message || 'Failed to reach Untera upstream server.'
          }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const unteraKey = env.UNTERA_API_KEY || process.env.UNTERA_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      unteraProxyPlugin(unteraKey)
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('three') || id.includes('@react-three')) {
                return 'three';
              }
              if (id.includes('react') || id.includes('react-router')) {
                return 'vendor';
              }
            }
          }
        }
      }
    }
  };
});

