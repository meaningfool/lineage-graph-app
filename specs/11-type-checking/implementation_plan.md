# Implementation Plan - Documentation Reorganization

## Goal
Consolidate dispersed documentation (`project.md`, `specs/README.md`, `specs/TESTING.md`, `AGENT.md`) into a single authoritative **`AGENT.md`** and an enriched **`restore-context`** workflow. This reduces context switching and ensures critical information is provided exactly when needed.

## User Review Required
> [!IMPORTANT]
> This plan involves **deleting** `project.md`, `specs/README.md`, and `specs/TESTING.md` after consolidation. content will be preserved in `AGENT.md` or the `restore-context` workflow.

## Proposed Changes

### 1. Enriched Workflow: `restore-context.md`
We will move "Context" and "Golden Rules" here so they are injected at the start of every session.
#### [MODIFY] `.agent/workflows/restore-context.md`
*   Add **Project Overview**: Brief summary of DAG structure (Input/Step/Output logic) from `project.md`.
*   Add **Golden Rule**: "Do Not Guess" / "Read E2E Tests" from `AGENT.md`.
*   Add **How to Start**: "Read specs, check task, ask permission".

### 2. Consolidated Agent Guide: `AGENT.md`
We will rewrite `AGENT.md` (initially as `AGENT-2.md` for comparison) with the following structure:

#### [NEW] `AGENT-2.md`
*   **How to Create a New Feature**: Workflow for `git checkout -b` and creating un-numbered spec folders.
*   **How to Start a Feature**: Numbering policy (`07-feature`) and `git mv`.
*   **How to Write Specs**: Guidelines for `task.md`, `research.md`, `01-plan.md` (Vertical Slices, Impact Analysis).
*   **How to Write Tests**: E2E-First philosophy, POM, Fixtures, Selectors.
*   **How to Run Tests and Debug**: Exit codes, Visual Verification, Troubleshooting timeouts.
*   **How to Write Learnings**: Guidelines for `learnings.md` (Retrospective vs Log).
*   **Capture Knowledge**: Rules for updating `research.md` (technical findings) vs `learnings.md`.

### 3. Cleanup
Once `AGENT-2.md` is verified and renamed to `AGENT.md`:
#### [DELETE] `project.md`
#### [DELETE] `specs/README.md`
#### [DELETE] `specs/TESTING.md`

## Verification Plan
### Manual Verification
1.  **Read `AGENT-2.md`**: Verify it contains all non-deprecated guidelines from the deleted files.
2.  **Run `restore-context`**: Verify it outputs the critical project context and golden rules.
