# Phase 2: Node Validation & Types

## Goal
Implement robust validation for CSV imports, ensuring data integrity and providing clear user feedback.

## Requirements
1.  **File-Level Validation**:
    *   Must have `id`, `title`, and `type` columns.
    *   If any are missing, **reject the entire file** and show a critical error.
2.  **Row-Level Validation**:
    *   Valid types: `INPUT`, `STEP`, `OUTPUT` (case-insensitive).
    *   If `type` is invalid or missing, **drop the row** and report an error.
    *   If `id` is duplicate, **keep the first** and drop the rest (report warning).
3.  **User Feedback**:
    *   Display a summary of errors/dropped rows in the modal or a toast.

## Existing Test Modifications

### `csv-import.spec.ts` - "should upload a CSV and display nodes"
*   **Current State**: Uses `basic-nodes.csv` with columns `id,title`.
*   **Required Change**: Update `basic-nodes.csv` to include the `type` column.
*   **New Fixture Content**:
    ```csv
    id,title,type
    node-1,First Node,STEP
    node-2,Second Node,STEP
    ```
*   **Reason**: Once validation is implemented, files without the `type` column will be rejected.

## Test File Structure

After Phase 2, `csv-import.spec.ts` will have the following structure:

```
CSV Import
├── Valid Files
│   └── should upload a valid CSV and display nodes
├── File-Level Validation (Blocking Errors)
│   ├── should reject file with missing required columns
│   └── should clear error message when modal is closed and reopened
└── Row-Level Validation (Non-Blocking Errors)
    ├── should drop rows with invalid node types and show summary
    └── should deduplicate rows with duplicate IDs and show warning
```

**Rationale**: This structure separates happy path from error cases, and distinguishes between file-level (blocking) and row-level (non-blocking) validation failures.

## TDD Cycles (Vertical Slices)

### Cycle 1: Critical File Errors (Missing Columns)
*   **Red**: E2E test uploading a CSV missing the `type` column. Expect a visible error message "Missing required columns: type".
*   **Fixture**: `error-missing-type.csv`
    ```csv
    id,title
    node-1,First Node
    node-2,Second Node
    ```
*   **Expected Behavior**: Import fails. Error message shown: "Missing required columns: type".
*   **Green**: Implement column check in `CSVImportModal`. Show error state.
*   **Refinement**: Added test and fix for error state cleanup (errors should clear when modal is closed and reopened).

### Cycle 2: Invalid Node Types (Row Dropping)
*   **Red**: E2E test uploading a CSV with one valid node and one invalid node (type="UNKNOWN"). Expect 1 node on graph and an error report "Row 2: Invalid type 'UNKNOWN'".
*   **Fixture**: `error-invalid-type.csv`
    ```csv
    id,title,type
    node-1,Valid Node,STEP
    node-2,Invalid Node,UNKNOWN
    ```
*   **Expected Behavior**: Import succeeds with 1 node. Error summary shown: "1 row dropped: Row 2 - Invalid type 'UNKNOWN'. Valid types: INPUT, STEP, OUTPUT".
*   **Green**: Implement row validation logic. Filter invalid rows. Add error reporting UI.

### Cycle 3: Deduplication
*   **Red**: E2E test uploading a CSV with duplicate IDs. Expect 1 node on graph and a warning "Row 3: Duplicate ID 'node-1'".
*   **Fixture**: `error-duplicate-ids.csv`
    ```csv
    id,title,type
    node-1,First Node,INPUT
    node-2,Second Node,STEP
    node-1,Duplicate Node,OUTPUT
    ```
*   **Expected Behavior**: Import succeeds with 2 nodes. Warning shown: "1 row dropped: Row 3 - Duplicate ID 'node-1'".
*   **Green**: Implement `Map`-based deduplication.

## Verification
*   **Automated**: New E2E tests for each cycle.
*   **Manual**: Use `legacy_assets/test-files/errors/*.csv` to verify.
