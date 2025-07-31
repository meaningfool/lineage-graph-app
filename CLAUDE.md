# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A data lineage visualization application built with Next.js, TypeScript, and tRPC. The app helps users understand how data flows through directed acyclic graphs (DAGs) from source data through computed values to final metrics.

## Architecture

### Monorepo Structure
- **Root**: pnpm workspace with shared configuration
- **apps/web**: Frontend Next.js app (port 3001) with React, ReactFlow, TailwindCSS
- **apps/server**: Backend tRPC API server (port 3000) with Drizzle ORM
- **packages/**: Shared utilities (when needed)

### Core Technologies
- **Frontend**: Next.js 15, React 19, ReactFlow for graph visualization, TailwindCSS + shadcn/ui
- **Backend**: tRPC for type-safe APIs, Drizzle ORM with SQLite/Turso
- **Graph Engine**: graphology library with dagre for layout algorithms
- **Testing**: Vitest with Testing Library for component testing
- **Code Quality**: Biome for linting/formatting, husky for git hooks

### Key Components
- **LineageGraph** (`apps/web/src/utils/lineagegraph.ts`): Core graph abstraction using graphology
- **Custom ReactFlow nodes** (`apps/web/src/components/lineage-graph.tsx`): Visualization components
- **Graph layout utilities** (`apps/web/src/utils/graph-layout.ts`): Dagre-based positioning

## Development Commands

### Essential Commands (from root)
```bash
pnpm dev                    # Start both web and server
pnpm dev:web               # Start web app only (port 3001)
pnpm dev:server           # Start server only (port 3000)
pnpm build                # Build all apps
pnpm check-types          # TypeScript validation
pnpm check                # Run Biome linting/formatting
```

### Database Commands
```bash
pnpm db:push              # Push schema changes
pnpm db:studio           # Open Drizzle Studio
pnpm db:generate         # Generate migrations
pnpm db:migrate          # Run migrations
```

### Testing Commands (from apps/web/)
```bash
pnpm test                 # Run tests in watch mode
pnpm test:run            # Run tests once
pnpm test:ui             # Open Vitest UI
pnpm test:coverage       # Run with coverage
```

## Development Rules

### TDD Workflow (MANDATORY)
This project follows strict TDD workflow from `.cursor/rules/001-tdd-workflow.md`:

1. **DESIGN**: Define signatures, outline tests, trim scope, get user approval
2. **RED**: Write failing tests, get approval to commit tests
3. **COMMIT TESTS**: Separate commit for tests only (use `test:` prefix)
4. **GREEN**: Implement minimal solution, get approval to commit
5. **COMMIT IMPLEMENTATION**: Separate commit for implementation (use `feat:` prefix)

**Enhanced Guidelines:**
- Always separate test commits from implementation commits for clear development history
- Focus on behavioral testing over implementation details
- When testing UI interactions, test minimal necessary proof (e.g., class presence, not specific values)
- Each RED-GREEN cycle should be committed separately
- Never proceed to next phase without explicit user permission

### Testing Approach
- **Use Testing Library queries exclusively**: `screen.getByTestId()`, `within().getAllByTestId()`
- **Never use `querySelector()`** or DOM traversal (JSDOM incompatible)
- **Test user-visible behavior and outcomes**, not internal mechanics or implementation details
- **Update existing tests** when user-facing behavior intentionally changes
- **Use specific test IDs** for predictable testing scenarios (e.g., `node-new-users`)
- **Minimal proof testing**: When testing CSS classes, verify presence (e.g., `transition-transform`) not specific values
- Use regex patterns for dynamic test IDs: `/^property-/`

### Feature Development Process
- **Plan complex features** in scratchpad.md with clear iterations before starting
- **Break features into small, independently testable increments**
- **Each iteration should deliver clear user value** and be fully tested
- Remove scratchpad.md after feature completion to keep repository clean
- Use iterative TDD approach: small cycles with frequent commits

### Commit Strategy
- **Structure commits**: Infrastructure, refactoring, setup (commit separately)
- **Feature commits**: New functionality, bug fixes (commit after structure)
- **Test commits**: Always separate from implementation commits
- Follow Kent Beck's principle: "Make the change easy, then make the easy change"

## Code Conventions

### Graph Data Flow
- **Edge semantics**: A → B means "A is derived from B"
- **Node roles**: OUTPUT (metrics), STEP (transformations), INPUT (source data)
- **Validation**: All graphs must be acyclic (validated by graphology-dag)

### Component Patterns
- React components use modern patterns (hooks, functional components)
- tRPC procedures for type-safe API communication
- Zod schemas for runtime validation
- Custom ReactFlow nodes with handles and properties display

## Common Tasks

### Adding New Graph Features
1. Extend `LineageGraph` class in `apps/web/src/utils/lineagegraph.ts`
2. Add corresponding tests following TDD workflow
3. Update ReactFlow components if UI changes needed
4. Consider layout implications in `graph-layout.ts`

### API Development
1. Add tRPC procedures in `apps/server/src/routers/`
2. Update client-side queries in web app
3. Ensure type safety end-to-end

### Database Changes
1. Modify schema in `apps/server/src/db/`
2. Generate and run migrations
3. Update tRPC procedures as needed