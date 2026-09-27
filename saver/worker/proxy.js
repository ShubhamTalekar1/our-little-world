// A tiny page-fetching proxy for Saver, for Cloudflare Workers (free tier is plenty).
// GET /?url=https://example.com/page → that page's HTML, with CORS headers.
//
// Set ALLOWED_ORIGIN (e.g. https://you.github.io) in the Worker's settings so
// only your copy of Saver can use it.

const MAX_BYTES = 3 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allowed === '*' ? '*' : allowed,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: cors });
    if (allowed !== '*' && origin && origin !== allowed) return new Response('Forbidden', { status: 403, headers: cors });

    const target = new URL(request.url).searchParams.get('url');
    let url;
    try {
      url = new URL(target);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      return new Response('Pass ?url=https://…', { status: 400, headers: cors });
    }

    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        // Many sites only serve their full metadata to regular browsers.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });

    const type = res.headers.get('Content-Type') || '';
    if (!/html|xml/.test(type)) {
      return new Response('Not an HTML page', { status: 415, headers: cors });
    }
    const body = await res.text();
    return new Response(body.slice(0, MAX_BYTES), {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'text/html; charset=utf-8', 'X-Final-Url': res.url },
    });
  },
};
