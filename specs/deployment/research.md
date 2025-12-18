# Deployment Research

## Context
- The app is a Next.js 15 project in a pnpm monorepo.
- The user wants to host it on `lineage.meaningfool.net`.
- Existing website `meaningfool.net` is an Astro project on GitHub Pages.
- Cloudflare is already used by the user for "some stuff".

## Findings
- `apps/web` seems purely client-side; no `src/app/api` routes or server-side data fetching found.
- `apps/server` exists but doesn't seem to be used by `apps/web`.
- Next.js static export (`output: 'export'`) is suitable for Cloudflare Pages or GitHub Pages.
- Cloudflare Pages is preferred for subdomains because it handles SSL and custom domains very easily.

## Strategy
1. Configure Next.js for static export.
2. Build the app locally to ensure everything is fine.
3. Suggest Cloudflare Pages setup.
