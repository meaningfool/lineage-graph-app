# Deployment Guide

This document outlines the process for updating and deploying the Data Lineage App.

## Prerequisites

1.  **Package Manager**: `pnpm`
2.  **Cloudflare CLI**: `npx wrangler`
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
Ensure the application is built for static export. This command generates the static files in `apps/web/out`.
```bash
pnpm --filter web build
```

### 2. Verify the Build (Optional)
You can test the static build locally using a simple server:
```bash
npx serve apps/web/out
```

### 3. Deploy to Cloudflare Pages
Deploy the static assets to the `data-lineage-app` project on Cloudflare:
```bash
npx wrangler pages deploy apps/web/out --project-name data-lineage-app --branch main
```

### 4. Push Changes to GitHub
Commit your changes and push them to your repository:
```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

## Configuration Notes

- **Static Export**: Enabled in `apps/web/next.config.ts` via `output: 'export'`.
- **Clean URLs**: Enabled in `apps/web/next.config.ts` via `trailingSlash: true`.
- **Production URL**: [https://lineage.meaningfool.net](https://lineage.meaningfool.net) (once custom domain is finalized).

## Future Automation (CI/CD)

To automate this process, a GitHub Action can be set up to run the build and deploy commands whenever changes are pushed to `main`. This would require adding `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to your GitHub repository secrets.
