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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const hostNeedsRedirect = !isLocalHost(url.hostname) && url.hostname !== CANONICAL_HOST;
    const schemeNeedsRedirect = url.protocol !== 'https:';

    if (hostNeedsRedirect || schemeNeedsRedirect) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
