# Antigravity Project Context

This file serves as the "Context Anchor" for AI agents working on this project.

## 📂 Spec-Driven Workflow
We use a strict **Spec-Driven Workflow** to manage features and context.
*   **Policy**: Read `specs/README.md` for the official rules.
*   **Active Specs**: Check the `specs/` directory for chronological feature folders. **RULE**: Each feature branch MUST have its own dedicated folder (e.g., `specs/2025-11-21-edge-import/`). Do NOT reuse old folders for new branches.
*   **Branch Safety**: The spec folder implies the branch name. If you are about to commit code and the current branch does not match the active spec folder, **STOP** and ask the user if they want to create/switch to the correct branch first.
*   **Merge Protocol**: When merging a feature branch, you MUST include the contents of `learnings.md` in the merge commit message.
*   **Documentation Rules**:
    *   **`research.md`**: Log ALL technical findings, debugging steps, and issues here.
    *   **`learnings.md`**: RESERVED for the USER. Do not write to this file unless explicitly dictated by the user. It is for high-level, editorialized insights only.
*   **Implementation Plan Rules**:
    *   Implementation plans (e.g., `02-node-validation.md`) MUST explicitly list which **existing tests need updates**, not just new tests to create.
    *   When a change affects existing behavior, document what changes in each test and why (e.g., "Add: Click Close button; Change: Error in results step").
*   **Testing Rules**:
    *   **Visual Verification**: When a feature involves visual cues (hidden/shown elements, styles, layout), you MUST verify it visually.
    *   **Automated Proof**: Prefer capturing screenshots *within* the E2E test (e.g., `page.screenshot()`) over manual browser sessions. This ensures reproducibility and provides a permanent artifact.
    *   **Robust Selectors**: ALWAYS use `data-testid` for selecting elements in tests. Do NOT rely on text content (e.g., button labels) or CSS classes, as these change frequently. We have configured Next.js to strip these attributes in production, so use them freely.
    *   **Strict E2E-First TDD**: If E2E tests fail due to environment or infrastructure issues (e.g., timeouts, connection refused, element not found due to crash), you **MUST** fix the environment first. You are **FORBIDDEN** from switching to Unit Tests or Implementation code until the E2E tests are running successfully and failing for the correct reason (Assertion Error). Never bypass E2E verification to "save time".
    *   **Vertical Slicing**: Every slice or iteration MUST result in a user-visible change (UI). Even deep backend changes should be verified by their effect on the UI.
    *   **Systematic E2E Testing**: For every slice/iteration, you MUST explicitly detail:
        *   **New E2E Tests**: Specific scenarios, setup, actions, and assertions.
        *   **Existing Tests Updates**: What needs to change in existing tests to prevent staleness.
        *   **Stale Test Prevention**: Explicitly check and plan for existing tests to ensure the suite remains up-to-date.
    *   **E2E Failure Protocol**:
        *   **Stop & Inspect**: If a test fails on a selector, STOP immediately. Do NOT guess. Use the browser tool to inspect the DOM.
        *   **Policy Check**: Cross-reference the failing selector against `AGENT.md` rules (must be `data-testid` or stable attribute).
        *   **Manual Fallback**: If the test cannot be fixed in **one attempt** after inspection, ask the user to verify the feature manually to unblock the workflow.

## 🚀 How to Start
When starting a new chat, the agent should:
1.  **Read this file (`AGENT.md`)** to understand the workflow.
2.  **Check `specs/`** to find the active feature folder.
3.  **Read the `task.md`** in that folder to understand the current status.
4.  **Ask for permission**: Never start doing anything before asking for permission, at least when starting a new chat.

## 🧠 Key Context
*   **Framework**: Next.js 15, React 19, Tailwind v4.
*   **Testing**: Vitest (Unit/Component), Playwright (E2E).
*   **State**: We are currently implementing the CSV Import feature.

## 🧪 Agent Playbook: How to Test & Verify
**Future Agents:** Use this guide to reliably test the application and use the Browser Tool.

### 1. The "Golden Flow" (Source of Truth)
Do not guess the UI flow or selectors. Read the E2E tests to understand exactly how to interact with the app.
*   **Reference File**: `apps/web/e2e/csv-import.spec.ts`
*   **Why**: This file contains the canonical "Happy Path" for the CSV Import Wizard.
*   **What to look for**:
    *   **Steps**: The exact sequence of actions (e.g., Upload -> Wait -> Map -> Next).
    *   **Selectors**: Stable `data-testid`s (e.g., `mapping-select-id-trigger`, `mapping-next-button`).
    *   **Wait Conditions**: `await expect(...).toBeVisible()` lines tell you exactly what to wait for before proceeding.

### 2. Browser Tool Best Practices
When using the `browser_subagent` or `run_browser_action`:
*   **Mimic the E2E Tests**: If the test waits for a dialog, you must wait for it too.
*   **Use TestIDs**: Always prefer `data-testid` over text or classes.
*   **Wait for Async**: The app is fast, but not instant. Always wait for a visual confirmation (e.g., "Import successful" text) before asserting success.

### 3. Data Strategy
*   **Do NOT invent data**: Use the existing CSV fixtures.
*   **Location**: `apps/web/e2e/fixtures/`
*   **Key Files**:
    *   `nodes_valid_basic.csv` / `edges_valid_basic.csv`: Standard happy path data.
    *   `nodes_with_desc.csv`: For testing properties.
    *   `nodes_invalid_*.csv`: For testing validation errors.
