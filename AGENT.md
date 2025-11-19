# Antigravity Project Context

This file serves as the "Context Anchor" for AI agents working on this project.

## 📂 Spec-Driven Workflow
We use a strict **Spec-Driven Workflow** to manage features and context.
*   **Policy**: Read `specs/README.md` for the official rules.
*   **Active Specs**: Check the `specs/` directory for chronological feature folders (e.g., `specs/2025-11-19-cleanup-codebase/`).

## 🚀 How to Start
When starting a new chat, the agent should:
1.  **Read this file (`AGENT.md`)** to understand the workflow.
2.  **Check `specs/`** to find the active feature folder.
3.  **Read the `task.md`** in that folder to understand the current status.

## 🧠 Key Context
*   **Framework**: Next.js 15, React 19, Tailwind v4.
*   **Testing**: Vitest (Unit/Component), Playwright (E2E).
*   **State**: We are currently cleaning up the codebase before implementing CSV Import.
