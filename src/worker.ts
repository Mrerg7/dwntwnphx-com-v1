interface Env {
  ASSETS: {
    fetch(input: Request): Promise<Response>;
  };
}

const CANONICAL_HOST = 'dwntwnphx.com';

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname === '[::1]' ||
    hostname === '[::]'
  );
}

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  // HSTS (Cloudflare edge already serves HTTPS; preload-safe max-age)
  if (!headers.has('Strict-Transport-Security')) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  if (!headers.has('X-Content-Type-Options')) headers.set('X-Content-Type-Options', 'nosniff');
  if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!headers.has('Permissions-Policy')) {
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  }
  if (!headers.has('X-Frame-Options')) {
    // Allow same-origin framing only; Stream/CF beacon use script + iframe embeds
    headers.set('X-Frame-Options', 'SAMEORIGIN');
  }
  // CSP: permissive enough for Astro inline assets + Stream + CF beacon + Google Fonts
  if (!headers.has('Content-Security-Policy')) {
    headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://customer-wa9cpywo3l4jte5c.cloudflarestream.com",
        "media-src 'self' https://customer-wa9cpywo3l4jte5c.cloudflarestream.com",
        "frame-src 'self' https://customer-wa9cpywo3l4jte5c.cloudflarestream.com",
        "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'self'",
      ].join('; '),
    );
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const hostNeedsRedirect = !isLocalHost(url.hostname) && url.hostname !== CANONICAL_HOST;
    // Behind Cloudflare, protocol may already be https; also respect x-forwarded-proto
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps = url.protocol === 'https:' || forwardedProto === 'https';
    const schemeNeedsRedirect = !isLocalHost(url.hostname) && !isHttps;

    if (hostNeedsRedirect || schemeNeedsRedirect) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }

    const res = await env.ASSETS.fetch(request);
    return withSecurityHeaders(res);
  },
};
