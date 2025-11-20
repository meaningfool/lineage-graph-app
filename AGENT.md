# Antigravity Project Context

This file serves as the "Context Anchor" for AI agents working on this project.

## 📂 Spec-Driven Workflow
We use a strict **Spec-Driven Workflow** to manage features and context.
*   **Policy**: Read `specs/README.md` for the official rules.
*   **Active Specs**: Check the `specs/` directory for chronological feature folders (e.g., `specs/2025-11-19-cleanup-codebase/`).
*   **Branch Safety**: The spec folder implies the branch name. If you are about to commit code and the current branch does not match the active spec folder, **STOP** and ask the user if they want to create/switch to the correct branch first.
*   **Merge Protocol**: When merging a feature branch, you MUST include the contents of `learnings.md` in the merge commit message.
*   **Documentation Rules**:
    *   **`research.md`**: Log ALL technical findings, debugging steps, and issues here.
    *   **`learnings.md`**: RESERVED for the USER. Do not write to this file unless explicitly dictated by the user. It is for high-level, editorialized insights only.
*   **Implementation Plan Rules**:
    *   Implementation plans (e.g., `02-node-validation.md`) MUST explicitly list which **existing tests need updates**, not just new tests to create.
    *   When a change affects existing behavior, document what changes in each test and why (e.g., "Add: Click Close button; Change: Error in results step").

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
