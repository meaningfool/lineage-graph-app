# Spec: Simple Node Import (TDD Phase 1)

## Goal
Implement the ability to upload a CSV file and display nodes on the graph.
**Scope**: No validation, no specific node types, no edges. Just "File In -> Nodes Out".

## TDD Cycle

### 🔴 Red (The Test)
Create a new E2E test `apps/web/e2e/csv-import.spec.ts`:
1.  **Setup**: Load the app.
2.  **Action**: Click "Import CSV".
3.  **Action**: Upload `legacy_assets/test-files/valid/valid-basic-nodes.csv` (or a simpler fixture).
4.  **Assertion**: Verify that nodes with labels from the CSV appear on the canvas.
5.  **Expectation**: Test fails because the button/modal/logic doesn't exist.

### 🟢 Green (The Implementation)
1.  **Dependencies**: Install `react-dropzone` and `papaparse`.
2.  **UI**:
    -   Add "Import CSV" button to `Header`.
    -   Create `CSVImportModal` using `react-dropzone`.
3.  **Logic**:
    -   On file drop, parse with `papaparse`.
    -   Map rows to simple ReactFlow nodes (id = row.id, label = row.label).
    -   Update `Page` state with new nodes.

## Technical Details
-   **Library**: `react-dropzone` for drag-and-drop.
-   **Parser**: `papaparse` (client-side).
-   **State**: Lift node state up to `Page` (or use a Context if needed later, but `Page` state is fine for now).

## Questions Resolved
-   **Dropzone**: Yes, using `react-dropzone` immediately.
-   **Validation**: Deferred to Phase 2.
-   **Node Types**: Deferred to Phase 2 (default to a generic type for now).
