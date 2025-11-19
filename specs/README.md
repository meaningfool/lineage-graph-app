# Spec-Driven Development Policy

This repository uses a **Spec-Driven Workflow** to manage context, planning, and task tracking across multiple AI sessions and Git branches.

## Directory Structure

```
specs/
├── README.md                     # This policy file
├── [YYYY-MM-DD-feature-name]/    # One folder per feature branch (Chronological)
│   ├── task.md                   # The Feature Manifest (Master Checklist)
│   ├── research.md               # Raw research notes, analysis, and context
│   ├── learnings.md              # Curated insights and "Aha!" moments (for sharing)
│   ├── 01-[phase-name].md        # Implementation plan for Phase 1
│   ├── 02-[phase-name].md        # Implementation plan for Phase 2
│   └── ...
```

## Workflow

1.  **Start a Feature**:
    *   Create a new git branch: `git checkout -b feature/my-feature`
    *   Create a matching folder: `mkdir specs/YYYY-MM-DD-my-feature`

2.  **Plan the Feature**:
    *   **`task.md`**: Create the high-level roadmap (Vertical Slices). This is the Table of Contents.
    *   **`research.md`**: Log any initial analysis or findings here.
    *   **`01-initial-setup.md`**: Create the detailed plan for the first slice.

3.  **Iterate (Multi-Chat Support)**:
    *   **Chat 1**: Creates the plan and maybe starts coding.
    *   **Chat 2**: Reads `task.md` to see status, reads `01-initial-setup.md` for instructions, and continues work.
    *   **Chat 3**: Verifies work, marks item as `[x]` in `task.md`, and creates `02-next-phase.md`.

4.  **Capture Knowledge**:
    *   **`research.md`**: Systematically log technical findings, trade-offs, and analysis.
    *   **`learnings.md`**: Curate specific, high-value insights you want to preserve or share later.

5.  **Commit**:
    *   Always commit the `specs/` files along with the code changes. This preserves the "Why" and "How" alongside the "What".

## Naming Conventions
*   **Branch Folders**: `YYYY-MM-DD-[feature-slug]` (e.g., `2025-11-19-csv-import`).
*   **Plan Files**: `[sequence]-[description].md` (e.g., `01-ui-skeleton.md`, `02-api-integration.md`).
