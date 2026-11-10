# dwntwnphx.com

Sister site to [phxdwntwn.com](https://phxdwntwn.com) — Downtown Phoenix, written downtown-first.

**Asking price:** $50,000  
**Inquiries:** [sales@desertrich.com](mailto:sales@desertrich.com)

## Local development

```bash
npm install
npm run dev
```

Dev server defaults to Astro’s port; for a Workers-faithful preview (canonical redirects):

```bash
npm run build
npx wrangler dev --port 43123
```

## Deploy

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`

## SEO / canonical URLs

Canonical host is `https://dwntwnphx.com/` (trailing slash on HTML routes).

The Worker (`src/worker.ts`) issues a **single 301** for:

- `www` / non-apex hosts → apex
- `http` → `https`
- `/index.html`, `/index`, `*.html`, duplicate slashes, missing trailing slashes

Sitemap: `https://dwntwnphx.com/sitemap-index.xml`
