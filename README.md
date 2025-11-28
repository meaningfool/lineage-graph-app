# Data Lineage App

A web application for visualizing data lineage through directed acyclic graphs (DAGs).

## Quick Start

```bash
pnpm install
pnpm dev        # Start all apps (web on :3001, server on :3000)
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, React Flow, TailwindCSS 4, shadcn/ui
- **Backend**: tRPC, SQLite + Drizzle ORM, Bun
- **Testing**: Vitest (unit), Playwright (E2E)
- **Tooling**: pnpm workspaces, Biome, Husky

## Project Structure

```
apps/
├── web/        # Frontend (port 3001)
└── server/     # Backend API (port 3000)
specs/          # Feature specs and planning
```

## Development

See `specs/README.md` for the spec-driven workflow.
See `AGENT.md` or `CLAUDE.md` for AI agent context.
