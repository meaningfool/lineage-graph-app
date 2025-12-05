# Spec-Driven Development Policy

This repository uses a **Spec-Driven Workflow** to manage context, planning, and task tracking across multiple AI sessions and Git branches.

## Directory Structure

```
specs/
├── README.md                     # This policy file
├── [NN-feature-name]/            # One folder per feature (numbered by implementation order)
│   ├── task.md                   # The Feature Manifest (Master Checklist)
│   ├── research.md               # Raw research notes, analysis, and context
│   ├── learnings.md              # Curated insights and "Aha!" moments (for sharing)
│   ├── 01-[phase-name].md        # Implementation plan for Phase 1
│   ├── 02-[phase-name].md        # Implementation plan for Phase 2
│   └── ...
├── [feature-name]/               # Planned features (not yet started, no number)
```

## Workflow

1.  **Start a Feature**:
    *   Create a new git branch: `git checkout -b feat/my-feature`
    *   Create a matching folder: `mkdir specs/my-feature` (no number prefix yet)

2.  **Plan the Feature**:
    *   **`task.md`**: Create the high-level roadmap (Vertical Slices). This is the Table of Contents.
    *   **`research.md`**: Log *only* raw research notes, analysis, and context. **DO NOT** put plans, tasks, or recommendations here.
    *   **`01-initial-setup.md`**: Create the detailed plan for the first slice. **USE THE TEMPLATE**: Copy `specs/SPEC-TEMPLATE.md` to ensure consistent structure.
    *   **Impact Analysis**: Explicitly list **Shared Components** (e.g., `LineageGraph`, `CSVImporter`) that will be modified. Identify which **Existing Tests** rely on these components and plan for their verification/update.

3.  **When Work Begins (Branch Created)**:
    *   Rename the folder to include the next available number: `git mv specs/my-feature specs/07-my-feature`
    *   This number reflects the **implementation order**, making it easy to understand the project's history.

4.  **Iterate (Multi-Chat Support)**:
    *   **Chat 1**: Creates the plan and maybe starts coding.
    *   **Chat 2**: Reads `task.md` to see status, reads `01-initial-setup.md` for instructions, and continues work.
    *   **Chat 3**: Verifies work, marks item as `[x]` in `task.md`, and creates `02-next-phase.md`.

5.  **Capture Knowledge**:
    *   **`research.md`**: Log ALL technical findings, debugging steps, trade-offs, and analysis here.
    *   **`learnings.md`**: RESERVED for the USER. Do not write to this file unless explicitly dictated by the user. It is for high-level, editorialized insights only.

6.  **Commit**:
    *   Always commit the `specs/` files along with the code changes. This preserves the "Why" and "How" alongside the "What".

7.  **Feature Completion Protocol**:
    *   **Regression Check**: You **MUST** run the full E2E suite (`npm run test:e2e`) and ensure all tests pass before merging.
    *   **Merge Strategy**: Use "Squash and Merge" (or equivalent) to create a single commit on `main` corresponding to the feature.
    *   **Branch Lifecycle**: Keep the feature branch alive (do not delete it) after merging. This allows for future reference or hotfixes.
    *   **Commit Message**: The commit message on `main` (or the merge commit) **MUST** include the insights from `learnings.md`. This ensures that high-level lessons are permanently logged in the project history.
        *   **Format**: Add "LEARNINGS:" followed by a line break and the list of insights as bullet points.

## How to Write `learnings.md`

This file is a **Retrospective** of the engineering process, not a technical log.

### Specificity
*   **Too Specific**: Implementation details like "Changed text from 'Nodes' to 'Mapping'". (Not reusable).
*   **Too General**: Platitudes like "Write better tests". (Not actionable).
*   **Just Right**: "We wasted time debugging complex race conditions when the cause was a simple text mismatch." (Grounded in reality, but teaches a general principle).

## Naming Conventions
*   **Spec Folders (In Progress)**: `NN-[feature-slug]` where `NN` is the next available number (e.g., `01-cleanup-codebase`, `02-csv-import`)
*   **Spec Folders (Planned)**: `[feature-slug]` (no number prefix until work begins)
*   **Plan Files**: `[sequence]-[description].md` (e.g., `01-ui-skeleton.md`, `02-api-integration.md`)
*   **Post-Spec Reports**: `post-[preceding-spec-number]-[description].md` (e.g., `post-01-critique.md` after `01-plan.md`)

## See Also
*   **[`../AGENT.md`](../AGENT.md)**: High-level context and principles.
*   **[`TESTING.md`](./TESTING.md)**: Detailed testing strategy and guidelines.



