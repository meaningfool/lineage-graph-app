# Implementation Plan - Phase 3: E2E Testing Setup

## Goal
Establish a robust E2E testing infrastructure using Playwright to verify the Lineage Graph rendering. This replaces the brittle unit tests we deleted.

## User Review Required
> [!NOTE]
> I am proposing **Playwright** because the "Chrome DevTools MCP" is not available in my environment and Playwright is the standard for persistent, CI-ready E2E tests.

## Proposed Changes

### Infrastructure
#### [NEW] [playwright.config.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/playwright.config.ts)
- Standard configuration for Next.js.
- Base URL: `http://localhost:3001` (Web).

#### [MODIFY] [package.json](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/package.json)
- Add `devDependencies`: `@playwright/test`.
- Add `scripts`: `test:e2e`, `test:e2e:ui`.

### Tests
#### [NEW] [smoke.spec.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/e2e/smoke.spec.ts)
- **Test 1: Graph Rendering**
    - Navigate to `/`.
    - Check if `.react-flow__renderer` exists and is visible.
    - Check if `.react-flow__node` count > 0.
    - Check if `.react-flow__edge` count > 0.
    - Check if specific text (e.g., "Source 1") is visible.

## Verification Plan

### Automated Tests
- Run `pnpm --filter web test:e2e` to execute the new smoke test.
- Ensure it passes against the running dev server.

### Manual Verification
- I will use my `browser_subagent` (my built-in web capability) to manually visit the page and confirm it matches what the Playwright test sees.
