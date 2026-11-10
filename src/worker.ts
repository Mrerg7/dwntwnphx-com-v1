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

/**
 * Normalize pathname only (shared by request + Asset Location cleanup).
 */
function normalizePathname(pathname: string): string {
  let path = pathname.replace(/\/{2,}/g, '/') || '/';

  // Do not expose the error document as an indexable URL
  if (path === '/404' || path === '/404.html' || path === '/404/') {
    return '/';
  }

  if (path === '/index.html' || path === '/index') {
    return '/';
  }
  if (path.endsWith('/index.html')) {
    return `${path.slice(0, -'/index.html'.length)}/` || '/';
  }
  if (path.endsWith('/index')) {
    return `${path.slice(0, -'/index'.length)}/` || '/';
  }
  if (path.endsWith('.html')) {
    const withoutHtml = path.slice(0, -'.html'.length) || '/';
    return withoutHtml.endsWith('/') ? withoutHtml : `${withoutHtml}/`;
  }

  // Enforce trailingSlash: 'always' for extensionless paths (matches Astro + sitemap)
  const hasExtension = /\/[^/]+\.[a-zA-Z0-9]+$/.test(path);
  if (path !== '/' && !path.endsWith('/') && !hasExtension) {
    return `${path}/`;
  }

  return path;
}

/**
 * Collapse host / scheme / path aliases into one absolute canonical URL.
 * Returns null when the request is already canonical (no redirect needed).
 *
 * Addresses Search Console "Page with redirect" from:
 * - www / workers.dev → apex
 * - http → https
 * - Assets soft-307s on /index.html (and similar)
 * - multi-hop chains like www…/index.html → apex…/index.html → /
 */
function toCanonicalUrl(requestUrl: URL, request: Request): URL | null {
  const local = isLocalHost(requestUrl.hostname);
  const canonical = new URL(requestUrl.toString());
  let changed = false;

  if (!local && canonical.hostname !== CANONICAL_HOST) {
    canonical.hostname = CANONICAL_HOST;
    changed = true;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = canonical.protocol === 'https:' || forwardedProto === 'https';
  if (!local && !isHttps) {
    canonical.protocol = 'https:';
    changed = true;
  }

  // Strip explicit :80/:443 (or mistaken preview ports) only on the public host
  if (!local && canonical.port) {
    canonical.port = '';
    changed = true;
  }

  const normalizedPath = normalizePathname(canonical.pathname);
  if (normalizedPath !== canonical.pathname) {
    canonical.pathname = normalizedPath;
    changed = true;
  }

  if (!changed) return null;

  // Any public redirect must advertise the https apex form.
  // Build a fresh URL string — mutating protocol on an http URL can be flaky in workerd.
  if (!local) {
    const search = canonical.search;
    const hash = canonical.hash;
    return new URL(`https://${CANONICAL_HOST}${canonical.pathname}${search}${hash}`);
  }

  return canonical;
}

function permanentRedirect(to: URL): Response {
  const headers = new Headers({ Location: to.toString(), 'Cache-Control': 'public, max-age=3600' });
  return new Response(null, { status: 301, headers });
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

/**
 * If Assets returns a soft redirect (often 307 for /index.html), upgrade it
 * to a single absolute 301 against the canonical host so Google can consolidate.
 */
function upgradeAssetRedirect(res: Response, requestUrl: URL, request: Request): Response | null {
  if (res.status < 300 || res.status >= 400) return null;
  const location = res.headers.get('Location');
  if (!location) return null;

  const local = isLocalHost(requestUrl.hostname);
  const absolute = new URL(location, requestUrl);
  absolute.pathname = normalizePathname(absolute.pathname);

  const target = local
    ? absolute
    : new URL(`https://${CANONICAL_HOST}${absolute.pathname}${absolute.search}${absolute.hash}`);

  const already =
    requestUrl.pathname === target.pathname &&
    requestUrl.search === target.search &&
    (local
      ? requestUrl.host === target.host
      : target.hostname === CANONICAL_HOST &&
        (requestUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https'));

  if (already) return null;

  return permanentRedirect(target);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const canonical = toCanonicalUrl(url, request);
    if (canonical) {
      return permanentRedirect(canonical);
    }

    const res = await env.ASSETS.fetch(request);
    const upgraded = upgradeAssetRedirect(res, url, request);
    if (upgraded) return upgraded;

    return withSecurityHeaders(res);
  },
};
