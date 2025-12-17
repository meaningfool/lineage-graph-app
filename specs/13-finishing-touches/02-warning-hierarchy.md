# Spec: Structured Import Warnings

## Goal
Transform the import warning system from a flat, mixed list of strings into a structured, hierarchical report. This improves user experience by grouping errors under clear summaries (e.g., "3 Nodes Dropped") and hiding technical details behind collapsible sections, reducing cognitive load.

## Slice 1: Structured Data & UI Refactor
**Goal**: Replace the flat `string[]` warnings with a structured `ImportReport` object and update the UI to display it hierarchically.

**Test Scenarios**:

*   **Unit Test Updates (`csv-graph-importer.test.ts`)**:
    *   **Refactor `ImportResult`**: Update all tests to expect `result.report` instead of `result.warnings`.
    *   **Check Structure**: verify `report.nodes.droppedCount` and `report.edges.droppedCount` instead of searching for "X nodes dropped" strings.
    *   **Check Details**: verify specific error messages are present in `report.nodes.errors[{ id, message }]` and `report.edges.errors[{ source, target, message }]`.
    *   **Example Assertion Change**:
        *   *Old*: `expect(result.warnings).toContain("1 node dropped")`
        *   *New*: `expect(result.report.nodes.droppedCount).toBe(1)`

*   **E2E Test Updates (`csv-import.spec.ts`)**:
    *   **Slice 5 Tests** (`should drop nodes...`, `should deduplicate...`, `should reject edges...`):
        *   **Action**: These tests currently check for detailed error text immediately. They must be updated to **expand the accordion** before checking for details.
            1. Verify **Summary** visibility (e.g., "1 node dropped").

**Implementation**:

*   **Components**:
    *   `ImportWizardDialog`: Replace the simple `<ul>` loop with a new `WarningSummary` component.
    *   `WarningSummary`: A new React component that takes `ImportReport` as a prop. It renders two main sections (Nodes, Edges) using Radix UI `Collapsible` or an Accordion.
*   **Domain Logic (`csv-graph-importer.ts`)**:
    *   Define `ImportReport` interface (Nodes/Edges categories, error objects).
    *   Refactor `buildGraphFromCsv` to populate this object instead of pushing formatted strings to an array.
*   **State (`use-new-import-wizard.ts`)**:
    *   Update `warnings` state to be `report` (of type `ImportReport | null`).

**Impact Analysis**:
*   **Shared Components**: `buildGraphFromCsv` is core logic; changing its return signature breaks the hook and the wizard.
*   **Affected Tests**: `apps/web/src/lib/csv-graph-importer.test.ts`, `apps/web/e2e/csv-import.spec.ts` (specifically Slice 5 tests).
