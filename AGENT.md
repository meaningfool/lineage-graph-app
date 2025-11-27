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
