# Deployment Learnings

- Next.js 15 static export requires `output: 'export'` in `next.config.ts`.
- When using `output: 'export'`, `trailingSlash: true` is recommended for better compatibility with static hosts like Cloudflare Pages to avoid 404s on direct navigation to subpages.
