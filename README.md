# Home Hero Remodeling — Brutalist Landing (Static)

A fast, single-page website for Home Hero Remodeling (Willingboro, NJ). Pure HTML/CSS/JS. Ready for GitHub Pages.

## Structure

- index.html — main one-pager
- styles.css — styles (brutalist, high-contrast)
- scripts.js — interactions (gallery, form, reveal)
- assets/images/logo.svg — logo (inline SVG)
- assets/images/license-placeholder.jpg — replace with license/insurance proof
- assets/images/posters/poster-01.jpg … poster-08.jpg — 9:16 vertical posters
- assets/videos/sample-01.mp4, sample-02.mp4 — short 9:16 demo clips
- pages/thank-you.html, pages/privacy.html — extra pages
- robots.txt, sitemap.xml, 404.html, favicon.svg, .nojekyll

Use only relative paths so it works at https://<user>.github.io/<repo>/.

## Replace posters and videos

- Drop 8 vertical JPGs (1080×1920 recommended) into `assets/images/posters/` named:
  poster-01.jpg … poster-08.jpg
- Put 9:16 MP4 samples into `assets/videos/` named:
  sample-01.mp4, sample-02.mp4
- The gallery markup in `index.html` already points to these files.

## Set webhook and analytics

Open `scripts.js` and set:

- const WEBHOOK = '{N8N_WEBHOOK_URL}' — paste your live n8n webhook URL.
- function initGA('{GA_MEASUREMENT_ID}') — call it in `index.html` if you add GA later.

The estimate form waits ~3s, includes a hidden honeypot, and POSTs JSON:

```
{
  source: 'website-landing',
  timestamp: 'ISO-8601',
  name, phone, email, projectType, message,
  utm: { source, medium, campaign }
}
```

On success, it shows an inline success state with a link to `/pages/thank-you.html`. On error, it offers a mailto fallback.

## Edit services/content

- Update services in the `#services` section of `index.html`.
- Update contact info in footer and About card.
- SEO: head tags and JSON-LD are in `index.html`.

## Accessibility & performance

- Semantic headings and labels, visible focus states, reduced motion respected.
- Assets are lazy-loaded; no heavy libraries.

## Enable GitHub Pages

1. Push to GitHub main branch.
2. In the repo: Settings → Pages → Source: Branch `main`, Folder `/ (root)`.
3. Wait for deployment. Your site will be at `https://<user>.github.io/<repo>/`.

Optional: add a custom domain in Settings → Pages after DNS is configured.

## Local dev

Just open `index.html` in a browser, or serve the folder with any static server. No build step.

---

Notes:
- Update `robots.txt` and `sitemap.xml` if you change the repo name.
- Replace the placeholder license image with your document.

## Reviews — quick test checklist (Codespaces/Browser)

1) Run a local server (for example in Codespaces):
  - Python: `python3 -m http.server 8080 --bind 0.0.0.0`
  - Open via Ports → 8080 → Open in Browser
2) Allow third‑party cookies in your browser (Facebook embeds require it).
3) If you see “This page isn’t available” inside a card:
  - Open the post directly (button “Open on Facebook”), check it’s public.
  - If it’s private or blocked for embed, replace the link in `assets/reviews-embeds.json` with another public review.
  - You can get working embed links from Facebook → “Embed” code: copy the href.
