# AGENT.md

## Build/Test Commands
- **Development**: `pnpm dev` (starts both web:3001 & server:3000), `pnpm dev:web`, `pnpm dev:server`
- **Build/Lint**: `pnpm build`, `pnpm check` (Biome format/lint), `pnpm check-types`
- **Unit tests**: `cd apps/web && pnpm test` (Vitest watch), `pnpm test:run` (once), `pnpm test:coverage`
- **E2E tests**: `pnpm test:e2e --project=chromium [test-file]` (single test), always use `--project=chromium`
- **Database**: `pnpm db:push`, `pnpm db:studio`, `pnpm db:generate`, `pnpm db:migrate`

## Architecture
- **Monorepo**: pnpm workspace with apps/web (Next.js frontend) & apps/server (tRPC API)
- **Tech Stack**: Next.js 15, React 19, TypeScript, tRPC, Drizzle ORM, SQLite/Turso, ReactFlow, TailwindCSS
- **Graph Engine**: graphology library with dagre layout, custom ReactFlow nodes
- **Key Files**: `apps/web/src/utils/lineagegraph.ts` (core graph), `apps/web/src/components/lineage-graph.tsx`

## TDD Workflow (MANDATORY)
Follows strict 5-phase TDD from `.cursor/rules/001-tdd-workflow.md`:
1. **DESIGN**: Define signatures, outline tests, get user approval
2. **RED**: Write failing tests, get approval to commit tests (`test:` prefix)
3. **GREEN**: Implement minimal solution, get approval to commit (`feat:` prefix)
Always separate test and implementation commits, never proceed without explicit user permission.

## Code Style
- **Formatting**: Biome with tabs, double quotes, organized imports
- **Testing**: Use Testing Library queries only (`screen.getByTestId()`, never `querySelector()`)
- **Types**: TypeScript with Zod validation, tRPC for type-safe APIs
- **Components**: Modern React patterns, functional components with hooks
- **Graph**: Edge A→B means "A derived from B", roles: OUTPUT/STEP/INPUT nodes
