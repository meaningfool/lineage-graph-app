# Antigravity Project Context

## How to Create a New Feature
**When**: when I'm asking you to create a new feature, or to move a spec to the backlog
*   **Create Branch**: `git checkout -b feat/my-feature-name`
*   **Create Folder**: `mkdir specs/my-feature-name` (Do **NOT** add a number prefix yet).
*   **Initialize Docs**:
    *   Create `research.md` (Raw notes/Context).
    *   Create `learnings.md` (Retrospective).
    *   Create `01-initial-plan.md` using the template (see "How to Write Specs").

## Directory Structure
```
specs/
├── [NN-feature-name]/            # One folder per feature (numbered by implementation order)
│   ├── task.md                   # The Feature Manifest (Master Checklist)
│   ├── research.md               # Raw research notes, analysis, and context
│   ├── learnings.md              # Curated insights and "Aha!" moments (for sharing)
│   ├── 01-[phase-name].md        # Implementation plan for Phase 1
│   ├── 02-[phase-name].md        # Implementation plan for Phase 2
│   └── ...
├── [feature-name]/               # Planned features (not yet started, no number)
```

## How to Start a Feature
1.  **Start a Feature**:
    *   Create a new git branch: `git checkout -b feat/my-feature`
    *   Create a matching folder: `mkdir specs/my-feature` (no number prefix yet)

2.  **When Work Begins (Branch Created)**:
    *   Rename the folder to include the next available number: `git mv specs/my-feature specs/07-my-feature`
    *   This number reflects the **implementation order**, making it easy to understand the project's history.

## How to Write Specs
*   **Vertical Slices**: Each slice must have a testable change in behaviour from the user perspective, unless it's a refactoring slice / spec. (See `specs/SPEC-TEMPLATE.md`).
*   **Test-First**: Define the *exact* test scenario (inputs, actions, assertions) before defining the implementation details.
*   **Slice Isolation**: Ensure that each slice can be verified independently. If Slice 2 depends on Logic, verify Logic *with simple data* first. Leave complex edge cases (cycles, limits) for later slices.
*   **Impact Analysis**: Explicitly list **Shared Components** (e.g., `LineageGraph`, `CSVImporter`) that will be modified. Identify which **Existing Tests** rely on these components and plan for their verification/update.

**Naming Conventions**
*   **Spec Folders (In Progress)**: `NN-[feature-slug]` where `NN` is the next available number (e.g., `01-cleanup-codebase`, `02-csv-import`)
*   **Spec Folders (Planned)**: `[feature-slug]` (no number prefix until work begins)
*   **Plan Files**: `[sequence]-[description].md` (e.g., `01-ui-skeleton.md`, `02-api-integration.md`)
*   **Post-Spec Reports**: `post-[preceding-spec-number]-[description].md` (e.g., `post-01-critique.md` after `01-plan.md`)

## How to Implement a Slice
*   **Strict TDD**: Write the *minimum* code required to pass the current slice's test. Do not over-engineer for future slices. It is acceptable for code to break when moving to the next slice (e.g., a traversal algorithm that works for DAGs but hangs on cycles is correct for Slice 2 if Slice 3 adds cycle support).

## How to Write Tests
**Philosophy**
We use **End-to-End (E2E) tests by default** to verify user-facing behavior. We move testing logic to **Unit Tests** on a case-by-case basis (e.g., for complex pure functions or heavy permutations).

*   **Fixture Specificity**: Do not use a single "mega-fixture" for all tests. Create minimal, focused fixtures for each scenario (e.g., `simple_dag.csv` for basic logic, `cycle_3_nodes.csv` for degeneracy).

**Technical Standards**

### E2E (Playwright)
*   **Page Object Model (POM)**:
    *   All UI interactions must be encapsulated in Page Objects (e.g., `LineagePage`).
    *   Tests should read like user stories: `await page.importGraph(...)`.
*   **Fixtures**:
    *   **Location**: `apps/web/e2e/fixtures/[feature-name]/`.
    *   **Absolute Paths**: ALWAYS use `path.join(__dirname, "fixtures", ...)` to resolve paths. Never use relative paths like `../fixtures`.
*   **Selectors**:
    *   **Primary**: `data-testid` (e.g., `data-testid="submit-button"`).
    *   **Secondary**: Semantic roles (`getByRole('button', { name: 'Save' })`).
    *   **Avoid**: Generic CSS classes, XPath, or fragile text content.

### Unit (Vitest)
*   **Location**: Co-located with source code (e.g., `src/lib/parser.ts` -> `src/lib/parser.test.ts`).
*   **Scope**: Pure logic, data transformations, complex validation rules, algorithms.

## How to Run Tests and Debug
**Reporting Accuracy (CRITICAL)**
**Never assume success based on partial logs.**
*   **Exit Codes**: ALWAYS check the process exit code. `0` = Success, `1` = Failure.
*   **Full Summary**: Use `--reporter=list` and scroll to the bottom to see the final `X passed, Y failed` count.
*   **Verification**: If you see "Passed" for one shard/worker, do not assume the whole suite passed.

**Debugging & Verification**
*   **Visual First**: If a test fails, prioritize **Visual Inspection** (via Browser Tool or manual check) to distinguish between a *Feature Failure* (bug) and a *Test Failure* (wrong assertion).
*   **Occam's Razor**: Check for simple explanations first.
    *   *Is the text assertion outdated?*
    *   *Did the selector change?*
    *   *Do NOT assume complex race conditions immediately.*
*   **Environment First**: If tests fail due to timeouts or crashes, fix the environment/infrastructure before changing test logic.

**Troubleshooting: Timeouts & Stale Processes**
System slowdowns (e.g., Next.js server consuming 1.5GB+) can cause widespread test timeouts, especially on `page.goto`.
*   **Symptom**: `Test timeout of 30000ms exceeded`, often during `beforeEach` or initial navigation.
*   **Check**: Run `ps aux | grep -E "node|playwright"` to see if orphaned processes are hoarding RAM.
*   **Fix**: Kill stale processes: `pkill -f "playwright|test:e2e|next"`. This is often more effective than increasing test timeouts.

## How to Finish a Feature
*   **Workflow**: Always use the `/close-branch` command.
*   **Reference**: See `.agent/workflows/close-branch.md` for the single source of truth on merging, regression testing, and commit message formatting.

## How to Write Learnings
This file is a **Retrospective** of the engineering process, not a technical log.

### Specificity
*   **Too Specific**: Implementation details like "Changed text from 'Nodes' to 'Mapping'". (Not reusable).
*   **Too General**: Platitudes like "Write better tests". (Not actionable).
*   **Just Right**: "We wasted time debugging complex race conditions when the cause was a simple text mismatch." (Grounded in reality, but teaches a general principle).
