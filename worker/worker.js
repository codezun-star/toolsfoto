const ALLOWED_ORIGINS = ['https://unpkg.com'];

function isAllowed(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.some(o => parsed.origin === o);
  } catch {
    return false;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return new Response('Missing ?url= parameter', { status: 400, headers: CORS_HEADERS });
    }

    if (!isAllowed(target)) {
      return new Response('URL not allowed', { status: 403, headers: CORS_HEADERS });
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers: { 'User-Agent': 'ffmpeg-proxy/1.0' },
    });

    const response = new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...CORS_HEADERS,
      },
    });

    return response;
  },
};
