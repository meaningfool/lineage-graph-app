# Test Stabilization & Refactoring Plan

## Context
Following the implementation of the Error Display feature (`08-error-display`), we identified significant instability in our E2E test suite. While we applied targeted fixes to `csv-import.spec.ts` and `node-properties.spec.ts`, a broader effort is needed to systematically apply these learnings, refactor the suite for long-term robustness, and codify these best practices.

## Goals
1.  **Stabilize E2E Suite**: Ensure all E2E tests are robust, deterministic, and free of race conditions.
2.  **Refactor Tests**: Apply best practices (e.g., `uploadFile` helper, `*-trigger` selectors) across the entire suite.
3.  **Update Documentation**: Codify testing guidelines in `AGENT.md` (or equivalent) to prevent future regressions.
4.  **Code Critique**: Review the `error-display` implementation for code quality and potential refactoring.

## Plan

### 1. E2E Test Refactoring
- [ ] **Phase 1: Vertical Slice (Minimal POM)**:
    - Create `e2e/pages/LineagePage.ts` supporting only the "Happy Path" (upload, map, submit).
    - Refactor *only* the first test in `csv-import.spec.ts` to use this POM.
    - Verify success.
- [ ] **Phase 2: Expand & Generalize**:
    - Extend POM for validation and error handling.
    - Refactor remaining tests in `csv-import`, `graph-layout`, etc.
- [ ] **Robust Assertions**: Use semantic attributes (`data-validation-status`) instead of CSS classes.
- [ ] **Parallel Execution**: Re-enable parallel execution (Step 0).

### 2. Fixture Reorganization
- [x] **Analyze Structure**: Map existing fixtures to their usage.
- [x] **Group by Feature**: Create folders (`shared`, `graph-layout`, `csv-import`, etc.) and move files.
- [x] **Update Specs**: Update all `path.join` references in spec files.

### 3. Unit Test Shift (The Testing Pyramid)
- [x] **Setup**: Verify `vitest` configuration (already installed).
- [x] **Implement Unit Tests**:
    -   Create `apps/web/src/utils/csv-parsing.test.ts` (or similar) to test parsing logic.
    -   Create `apps/web/src/logic/graph-layout.test.ts` to test layout algorithms.
-   **Goal**: Move complex logic validation (e.g., "invalid type", "cycle detection") out of E2E.

### 4. E2E Pruning
- [x] **Identify Redundant Tests**: Map E2E tests to new unit tests.
- [x] **Skip Tests**: Mark them as `test.skip` to preserve them as reference/manual test fixtures but remove them from the CI critical path.
-   **Goal**: Reduce E2E execution time and flakiness.

### 5. Documentation & Process
- [x] **Create/Update `AGENT.md`**: Add a specific section on "E2E Testing Guidelines" covering:
    -   Page Object Model (POM) requirement.
    -   Fixture management (absolute paths).
    -   Selector strategy (`data-testid`).
    -   Debugging protocol (visual inspection first).
- [x] **Update `specs/README.md`**: Add "Impact Analysis" to the planning phase checklist.from `08-error-display/research.md`.

### 6. Code Critique
- [x] **Critique**: Analyze `ErrorListPanel` and related components.
- [x] **Report**: Create `post-02-code-critique.md` with findings and recommendations.
