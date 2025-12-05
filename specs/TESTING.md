# Testing Strategy & Guidelines

## Philosophy: The "E2E-First" Pyramid

We employ a nuanced testing strategy that balances user-centric verification with long-term maintainability.

1.  **Start with E2E (Forcing Function)**:
    *   Every new feature **MUST** start with End-to-End (E2E) tests.
    *   This ensures we build what the user actually sees and interacts with.
    *   Do not write Unit Tests for a feature until the E2E "Happy Path" is passing.

2.  **Stabilize & Shift (The Pyramid)**:
    *   As a feature matures, E2E tests may become slow or flaky if they cover every edge case (e.g., 50 permutations of validation logic).
    *   **Strategy**: Extract complex logic (parsers, validators, algorithms) into pure functions and cover them with **Unit Tests**.
    *   **Pruning**: Once Unit Tests cover the edge cases, simplify the E2E test to cover only the core integration flows ("Happy Path" + "Critical Error"). Mark redundant E2E tests as `test.skip` (don't delete them immediately; keep them as reference).

## Protocols

### 1. Reporting Accuracy (CRITICAL)
**Never assume success based on partial logs.**
*   **Exit Codes**: ALWAYS check the process exit code. `0` = Success, `1` = Failure.
*   **Full Summary**: Use `--reporter=list` and scroll to the bottom to see the final `X passed, Y failed` count.
*   **Verification**: If you see "Passed" for one shard/worker, do not assume the whole suite passed.

### 2. Debugging & Verification
*   **Visual First**: If a test fails, prioritize **Visual Inspection** (via Browser Tool or manual check) to distinguish between a *Feature Failure* (bug) and a *Test Failure* (wrong assertion).
*   **Occam's Razor**: Check for simple explanations first.
    *   *Is the text assertion outdated?*
    *   *Did the selector change?*
    *   *Do NOT assume complex race conditions immediately.*
*   **Environment First**: If tests fail due to timeouts or crashes, fix the environment/infrastructure before changing test logic.

### 3. Regression Testing
*   **Rule**: You must run the **FULL E2E SUITE** (`npm run test:e2e`) at least once before marking a feature as complete.
*   **Goal**: Prevent "hidden debt" where new changes break unrelated features (e.g., shared components).

## Technical Standards

### E2E (Playwright)
*   **Page Object Model (POM)**:
    *   All UI interactions must be encapsulated in Page Objects (e.g., `LineagePage`).
    *   Tests should read like user stories: `await page.importGraph(...)`.
*   **Fixtures**:
    *   **Location**: `apps/web/e2e/fixtures/[feature-name]/`.
    *   **Absolute Paths**: ALWAYS use `path.join(__dirname, "fixtures", ...)` to resolve paths. Never use relative paths like `../fixtures`.
*   **Selectors**:
    *   **Primary**: `data-testid` (e.g., `data-testid="submit-button"`).
    *   **Secondary**: Semantic roles (`getByRole('button', { name: 'Save' })`).
    *   **Avoid**: Generic CSS classes, XPath, or fragile text content.

### Unit (Vitest)
*   **Location**: Co-located with source code (e.g., `src/lib/parser.ts` -> `src/lib/parser.test.ts`).
*   **Scope**: Pure logic, data transformations, complex validation rules, algorithms.

## Agent Playbook

### 1. The "Golden Flow" (Source of Truth)
Do not guess the UI flow. Read `apps/web/e2e/csv-import.spec.ts` to understand the canonical "Happy Path".
*   **Look for**: Exact sequence of actions, stable `data-testid`s, and `await expect(...).toBeVisible()` wait conditions.

### 2. Browser Tool Best Practices
*   **Mimic E2E**: If the test waits for a dialog, you must wait for it too.
*   **Use TestIDs**: Always prefer `data-testid`.
*   **Wait for Async**: Always wait for visual confirmation (e.g., success message) before asserting.
