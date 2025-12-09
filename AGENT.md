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

### 4. Context Retrieval (Kit CLI)
*   **Workflow**: Run the context restoration workflow at the start of every session.
    *   Command: `/restore-context` (or manually follow `.agent/workflows/restore-context.md`)
*   **Manual Fallback**:
    *   `kit file-tree .`
    *   `kit symbols .`
    *   *Note*: If `kit` is not found, try: `/Users/josselinperrus/Library/Python/3.13/bin/kit`
*   **Semantic Search (mgrep)**: Use for natural language queries when you don't know exact keywords.
    *   Command: `mgrep "your question here" [path]` (e.g., `mgrep "how is auth handled?" src/`)
*   **Pinpointing**: Use Kit to inspect specific parts of the codebase.
    *   Command: `kit symbols <path/to/file>` to see definitions in a file without reading the whole content.
    *   Command: `kit file-tree <path/to/dir>` to see the structure of a specific subdirectory.

### 5. Feature Completion Protocol
*   **Workflow**: Always use the `/close-branch` command.
*   **Reference**: See `.agent/workflows/close-branch.md` for the single source of truth on merging, regression testing, and commit message formatting.

## 🌟 Golden Rule: Do Not Guess
*   **Do not guess the UI flow**. Read **`apps/web/e2e/csv-import.spec.ts`** to understand the canonical "Happy Path".
*   **Look for**: Exact sequence of actions, stable `data-testid`s, and `await expect(...).toBeVisible()` wait conditions.
