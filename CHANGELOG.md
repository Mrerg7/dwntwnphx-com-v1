# Changelog

## 2026-10-04 — Comprehensive optimization pass

### I. Technical foundation
- Added security headers in `src/worker.ts` (HSTS, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, X-Frame-Options SAMEORIGIN, CSP allowing
  Astro inline + Cloudflare Stream + Cloudflare Insights + Google Fonts).
- Added `public/_headers` cache policy: immutable 1y for `/_astro/*` hashed
  assets, short TTL for sitemap/robots.
- Kept canonical-host 301 + HTTPS redirect; added `x-forwarded-proto` awareness.
- Organization + Breadcrumb + FAQ + Product JSON-LD in layout/index; updated
  `dateModified`.

### II. SEO
- Title format: `dwntwnphx.com | Premium Domain for Sale | Downtown Phoenix DTPHX — $50,000`.
- Meta description now includes price + escrow + CTA.
- Expanded keywords toward "buy downtown phoenix domain / premium domain names / investment domains".
- Added OG image dimensions/alt, `color-scheme`, breadcrumb nav, FAQ section
  with `FAQPage` schema, internal link to sister `phxdwntwn.com`.
- Added `src/pages/404.astro` (noindex-safe via default layout canonical home).

### III. CRO
- Footer now has 3 tiered CTAs: Buy now / Make an offer / Contact agent
  (distinct `mailto:` subjects + `data-cta` hooks for tracking pixels).
- Above-the-fold hero: explicit `$50,000` + escrow microcopy + dual CTA.
- Trust strip: escrow-secured / 1-of-1 / sister-pair.
- Trust signals in footer: escrow, registrar push, written agreement.
- Sticky mobile buy bar (`md:hidden`) with 48px CTA.
- Exit-intent lead capture `<dialog>` (desktop mouseout + 75s mobile fallback,
  session-gated, no dependency).

### IV. Mobile
- Viewport now includes `viewport-fit=cover`; `overflow-x: clip`.
- All tap targets raised to 48px (`min-h-12`, header button `h-12 w-12`,
  sticky bar, FAQ summaries).
- Body base 16px; small eyebrows kept ≥10–12px display-only.
- Hero Stream iframe `loading="lazy"` + eager poster `<img>` fallback
  (1200×652, `fetchpriority="high"`); preconnect to fonts + Stream.
- Fonts load non-blocking (`media=print` swap + preload + noscript fallback);
  removed render-blocking CSS `@import`.

### V. Design
- Preserved ember/dusk palette; added hover lift on `.card`/buttons,
  `fade-in` utility, `focus-visible` ring, `prefers-reduced-motion` guard,
  skip-to-content link, `btn-outline` variant.

### Validation
- `npm run build` must pass; submit `/sitemap-index.xml` to Search Console
  after deploy; monitor 48h.
