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
    *   **`01-initial-setup.md`**: Create the detailed plan for the first slice. This is where strategies and tasks go.

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

## Naming Conventions
*   **Spec Folders (In Progress)**: `NN-[feature-slug]` where `NN` is the next available number (e.g., `01-cleanup-codebase`, `02-csv-import`)
*   **Spec Folders (Planned)**: `[feature-slug]` (no number prefix until work begins)
*   **Plan Files**: `[sequence]-[description].md` (e.g., `01-ui-skeleton.md`, `02-api-integration.md`)

## Current Features (Implementation Order)
- `01-cleanup-codebase/`: Code quality improvements and architecture cleanup
- `02-csv-import/`: Initial CSV import with basic node validation
- `03-edge-import/`: Dual CSV import for nodes + edges with referential integrity
- `04-column-mapping/`: Column mapping wizard for flexible CSV schemas
- `05-graph-validation/`: Lineage graph validation with visual feedback
- `06-graph-layout/`: Custom graph layout algorithm for data lineage visualization
- `node-properties/`: **[PLANNED]** Import and display node properties (not yet started)

