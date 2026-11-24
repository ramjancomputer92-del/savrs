# MediaGrab — Starter Website

A responsive static frontend starter for MediaGrab.

## Included features
- Responsive landing page and tool cards
- YouTube thumbnail preview using the public thumbnail image endpoint
- Direct HTTPS media URL checker (the file host decides whether downloading is permitted)
- Official help links for Facebook, Instagram and YouTube
- No backend or API key required for these starter features

## Run locally
Open `index.html` in a modern browser.

## Publish free
1. Create a GitHub repository and upload `index.html`, `style.css`, and `app.js`.
2. In Cloudflare Pages, connect the repository.
3. Choose the static site / no framework setup. Build command: leave blank. Output directory: `/`.
4. Deploy. Cloudflare will provide a `*.pages.dev` address.

Free-plan limits and terms can change; check the provider's current terms before launch.

## Important legal and technical limits
This starter intentionally does **not** scrape or download arbitrary Facebook, Instagram or YouTube videos/reels. It does not bypass login, private content, DRM, access controls or platform protections. Platform terms, copyright and creator permissions apply. Add only official APIs or workflows that explicitly permit the intended use. The direct-link feature opens a user-supplied URL; browser cross-origin rules and the file host may prevent a forced download.

## Next steps
- Add a privacy policy and terms of use.
- Add rate limiting and abuse protection if a backend is introduced.
- Test on mobile and desktop.
- Use official platform documentation before adding integrations.
