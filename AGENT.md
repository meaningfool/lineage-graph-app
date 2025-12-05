# Antigravity Project Context

## 🚀 How to Start
1.  **Read `specs/README.md`**: Understand the Spec-Driven Workflow.
2.  **Check `specs/`**: Find the active feature folder (e.g., `specs/08-error-display/`).
3.  **Read `task.md`**: Check the current status in the active folder.
4.  **Ask Permission**: Confirm your plan with the user before starting.

## 🔑 Key Principles

### 1. Spec-Driven Workflow
*   **One Feature, One Folder**: Work strictly within the active feature folder.
*   **Branch Safety**: Ensure your branch matches the active spec.


### 2. Testing Strategy
*   **Guide**: Read **[`specs/TESTING.md`](./specs/TESTING.md)** for detailed rules.
*   **Philosophy**: **E2E-First**. Start with E2E tests. Shift complex logic to Unit Tests (Pyramid).
*   **Reporting**: **CRITICAL**. Check exit codes (`0` vs `1`). Never trust partial logs.
*   **Visual Verification**: Verify UI changes visually (Browser Tool) before debugging code.
*   **Strict TDD**: Fix environment issues first. Do not bypass E2E verification.

### 3. Code Quality
*   **Selectors**: Always use `data-testid`.
*   **Architecture**: "Parse, Don't Validate". Use Hexagonal Architecture principles.

## 🌟 Golden Rule: Do Not Guess
*   **Do not guess the UI flow**. Read **`apps/web/e2e/csv-import.spec.ts`** to understand the canonical "Happy Path".
*   **Look for**: Exact sequence of actions, stable `data-testid`s, and `await expect(...).toBeVisible()` wait conditions.
