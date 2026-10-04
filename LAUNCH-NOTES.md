Launch checklist

- Canonical domain is https://alexkeegan.com/. Canonical, sharing URLs, robots.txt, and sitemap.xml are configured. Add alexkeegan.com and www.alexkeegan.com to Vercel; make the bare domain primary and redirect www to it. DNS, SSL, and domain ownership still need verification.
- CSP is report-only for preview testing. Inspect browser console for violations before enabling enforcement. No report endpoint is configured; violations are visible in the console.
- Inline script hash in vercel.json must be regenerated if the inline script changes. Inline styles are allowed because current animations update element styles.
- Lenis remains version-pinned on jsDelivr. Download was blocked in the editing environment. Self-host the official 1.1.14 distribution and preserve its license, or calculate SRI from verified bytes before release.
- Deploy as a static HTML site (no framework/build step). Exclude internal files using .vercelignore; verify /BOT-REFERENCE.md and /.DS_Store return 404.
- Verify response headers on Vercel, keyboard navigation, no-JavaScript readability, reduced motion, downloads, mobile video playback, contrast, and social preview.
- Confirm Vercel plan eligibility for a site advertising freelance services.
- Enable two-factor authentication for hosting, source control, and registrar. Enable domain auto-renewal and registrar lock.
- Review public CV personal details and permissions for client screenshots/videos.
- Original About video backup is /private/tmp/portfolio-about-original.mp4, outside deployment.
