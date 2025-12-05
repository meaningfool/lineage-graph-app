# Code Critique: Error Display Feature

## 1. Executive Summary
The "Error Display" feature (`feat/error-display`) has been implemented with a solid architectural foundation, adhering to the project's separation of concerns. The UI components are well-structured, and the validation logic is isolated in the `lib` directory.

However, a **critical gap** was identified in the testing strategy: while the "Unit Test Shift" phase introduced tests for CSV parsing, the core graph validation logic (cycle detection, connectivity rules) remains **untested by unit tests**. It currently relies entirely on E2E tests, which contradicts the goal of moving complex logic testing to the bottom of the pyramid.

## 2. Architecture Analysis

### Strengths
*   **Separation of Concerns**: The validation logic (`graph-validation.ts`) is completely decoupled from the UI (`LineageGraph.tsx`). The UI merely displays errors that are computed elsewhere.
*   **Performance**: The potentially expensive validation algorithms (like DFS for cycle detection) are executed **once** during the import process (in `use-csv-import-wizard.ts`), rather than on every render. `LineageGraph` only iterates through the results to format them for display.
*   **Extensibility**: The "Strategy Pattern" used in `validateGraph` allows for easy addition of new validation rules without modifying the core orchestrator or the UI.
*   **Smart/Dumb Components**:
    *   `ErrorListPanel` and `ErrorToggle` are pure presentational components.
    *   `CustomEdge` encapsulates its own interaction logic (hover states, tooltips) and path delegation, keeping the parent graph component clean.

### Weaknesses
*   **Implicit Deduplication**: The error deduplication logic in `LineageGraph.tsx` relies on message string uniqueness. While functional for current requirements (collapsing cycle errors), it couples the display logic to the specific wording of error messages.

## 3. Code Quality

### Observations
*   **Hardcoded Values**: `LineageGraph.tsx` contains hardcoded color values (e.g., `#ef4444` for error states). These should be extracted to constants or derived from the Tailwind theme to ensure consistency.
*   **Type Safety**: The code makes good use of TypeScript interfaces (`GraphError`, `GraphNode`, `GraphEdge`).
*   **Readability**: The code is generally clean and well-commented. The `CustomEdge` component clearly documents its responsibilities.

## 4. Testing Status

### Critical Findings
*   **Missing Unit Tests (Gap in Stabilization Execution)**: The `apps/web/src/lib/graph-validation.ts` file and its sub-modules have **zero unit test coverage**.
    *   *Alignment*: This finding aligns with **Goal 3.3** of the `02-stabilization-plan.md` ("Move complex logic validation... out of E2E"), but it represents a **missed execution step**. While `graph-layout-utils.test.ts` was created as planned, `graph-validation.test.ts` was not.
    *   *Impact*: We are currently relying on slow E2E tests (`graph-validation.spec.ts`) for logic that should be tested in milliseconds.

## 5. Recommendations

### Immediate Actions (Refactoring Phase)
*   *None currently required.* (Deferring unit tests as error logic is expected to change in the next spec).

### Future Improvements
1.  **Create `graph-validation.test.ts`**: Implement unit tests for `detectSelfCycles`, `validateNodeConnectivity`, and `detectMultiNodeCycles`. (Deferred to avoid rework pending upcoming spec changes).
2.  **Extract Constants**: Move color codes from `LineageGraph.tsx` to a `theme.ts` or similar constant file.
3.  **Explicit Error Grouping**: Instead of deduplicating by message string, consider returning a structured `ErrorGroup` object from the validator.
