# Deployment Guide

This document outlines the process for updating and deploying the Data Lineage App.

## Hosting

- **Cloudflare Worker**: `data-lineage-app`, configured in `wrangler.jsonc`. It serves the static export in `apps/web/out` as static assets, with no Worker code. It replaced the Cloudflare Pages project of the same name on 2 November 2026 (meaningfool/meaningfool.github.io#19).
- **Production URL**: [https://lineage.meaningfool.net](https://lineage.meaningfool.net), the Worker's custom domain.
- **workers.dev URL**: [https://data-lineage-app.josselin-perrus.workers.dev](https://data-lineage-app.josselin-perrus.workers.dev)
- **Cloudflare account**: "Josselin.perrus@gmail.com's Account" (`ac8ef9d0a6131db0875a6b24b5e8d221`).
- **Analytics**: Cloudflare Web Analytics' automatic setup for the meaningfool.net zone adds its beacon to every page. Nothing in this repository sets it up.

## Prerequisites

1.  **Package Manager**: `pnpm`
2.  **Cloudflare CLI**: `npx wrangler`, a dev dependency pinned to 4.151.2.
3.  **Authentication**: You must be logged into Cloudflare via Wrangler:
    ```bash
    npx wrangler login
    ```

## Local Development

To run the app locally in development mode:
```bash
pnpm --filter web dev
```

## Update & Deployment Process

### 1. Build the Application
Ensure the application is built for static export. This command generates the static files in `apps/web/out`, then writes `apps/web/out/_redirects` (see "Behaviour Kept from Cloudflare Pages").
```bash
pnpm --filter web build
```

### 2. Verify the Build (Optional)
Serve the build the way the Worker does, with its redirects, headers and 404 page, on http://localhost:8787:
```bash
npx wrangler dev
```

### 3. Deploy to Cloudflare Workers
Build, then deploy `apps/web/out` to the `data-lineage-app` Worker. It goes live on lineage.meaningfool.net and workers.dev at once.
```bash
pnpm run deploy
```
Keep the `run`: `pnpm deploy` is a different, built-in pnpm command.

### 4. Push Changes to GitHub
Commit your changes and push them to your repository:
```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

## Behaviour Kept from Cloudflare Pages

Workers serves static files differently from Pages. These settings keep what Pages did:
- **Unknown URLs** get `apps/web/out/404.html` with a 404 status (`not_found_handling: "404-page"` in `wrangler.jsonc`).
- **Redirects are permanent (308)**: `/index.html` and `/index` to `/`, `/404.html` to `/404`, `/404/index.html` and `/404/index` to `/404/`. Workers alone would send a temporary 307, so `apps/web/scripts/write-redirects.mjs` lists them in `apps/web/out/_redirects` after `next build`. It reads them off the HTML files in the export, so a new page gets its redirects too.
- **Default headers**: `apps/web/public/_headers` sends the headers Pages added to every response (`Access-Control-Allow-Origin: *`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`). It also gives files other than HTML and Next's `.txt` payloads Pages' 4-hour cache. A new file or folder in `apps/web/public/` needs a line there to get it.

Differences that remain, all harmless:
- 404 responses get `Cache-Control: public, max-age=0, must-revalidate` instead of `no-store`. A 404 under a cached folder, such as `/demo/`, gets the 4-hour cache.
- `.js` files are sent as `text/javascript` instead of `application/javascript`.
- Text files are sent without `charset=utf-8` (local `npx wrangler dev` adds it, production doesn't). The HTML pages declare UTF-8 themselves, and the other text files are plain ASCII. A text file with other characters that browsers open directly needs a `Content-Type` with the charset in `_headers`.
- Redirects also carry `X-Content-Type-Options: nosniff`.

## Rollback

- **A bad deploy**: `npx wrangler rollback` puts the Worker back on its previous version. `npx wrangler deployments list` shows the recent ones.
- **Back to Cloudflare Pages**, while the Pages project still exists:
  1. Workers & Pages → the Worker `data-lineage-app` → Domains: remove the custom domain `lineage.meaningfool.net`.
  2. Workers & Pages → the Pages project `data-lineage-app` → Custom domains: add `lineage.meaningfool.net`. This recreates its CNAME `lineage` → `data-lineage-app.pages.dev`.

  The Pages project still serves the build deployed before the move. To deploy a newer one there, run `pnpm --filter web build`, then `npx wrangler pages deploy apps/web/out --project-name data-lineage-app --branch main`. The Pages project is due for deletion a few days after the move (meaningfool/meaningfool.github.io#19).

## Configuration Notes

- **Static Export**: Enabled in `apps/web/next.config.ts` via `output: 'export'`.
- **Clean URLs**: Enabled in `apps/web/next.config.ts` via `trailingSlash: true`.
- **Worker**: `wrangler.jsonc` at the repository root.

## Future Automation (CI/CD)

To automate this process, a GitHub Action can be set up to run `pnpm run deploy` whenever changes are pushed to `main`. This would require adding `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to your GitHub repository secrets.
