# Research: Codebase Audit (2025-11-19)

## Findings

### 1. Dead Code
*   `apps/web/src/utils/simple-dag-generator.ts` is unused in the application. It was likely a prototype or utility for generating test data, but it's not imported by `page.tsx` or `lineage-graph.tsx`.

### 2. Test Quality
*   `apps/web/src/app/__tests__/page.test.tsx` is brittle.
    *   It mocks `reactflow` entirely, meaning it tests the mock, not the library integration.
    *   It mocks `trpc`, which is no longer used in `page.tsx`.
    *   It tests implementation details (`data-testid`) that are tightly coupled to the specific mock implementation.
    *   **Recommendation**: Delete and replace with robust tests later.

### 3. Architecture
*   `page.tsx` currently handles data loading, layout calculation (Dagre), and rendering. This violates separation of concerns.
*   `lineage-graph.tsx` is a good "dumb" component.
