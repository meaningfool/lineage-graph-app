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
*   **Expected Behavior**: Import succeeds with 1 node. Error summary shown: "1 row dropped: node-2 - Invalid type 'UNKNOWN'. Valid types: INPUT, STEP, OUTPUT".
*   **Green**: Implement row validation logic. Filter invalid rows. Add error reporting UI.
*   **Refinement**: Updated warning messages to use row ID instead of row number for better user experience.

### Cycle 3: Deduplication
*   **Red**: E2E test uploading a CSV with duplicate IDs. Expect 2 nodes on graph and a warning "node-1: Duplicate ID".
*   **Fixture**: `error-duplicate-ids.csv`
    ```csv
    id,title,type
    node-1,First Node,INPUT
    node-2,Second Node,STEP
    node-1,Duplicate Node,OUTPUT
    ```
*   **Expected Behavior**: Import succeeds with 2 nodes. Warning shown: "1 row dropped: node-1: Duplicate ID".
*   **Green**: Implement `Map`-based deduplication.
*   **Note**: Test includes fresh page navigation to avoid state pollution from previous tests.

### Cycle 4: Multi-Step Wizard UX
*   **Goal**: Improve UX by separating upload UI from results/feedback.
*   **Current Behavior**: Upload → validation → warnings/errors show in same view → user can upload again without closing.
*   **New Behavior**: Upload → validation → **transition to results step** → user clicks "Close" to dismiss modal.

#### Test Updates (Existing Tests)

**All 5 existing tests need updates:**

1. **"should upload a valid CSV and display nodes"** (Valid Files)
   - **Add**: After upload, verify results view shows success state
   - **Add**: Click "Close" button to dismiss modal
   - **Keep**: Verify nodes appear on graph

2. **"should reject file with missing required columns"** (File-Level Validation)
   - **Add**: After upload, verify results view shows error
   - **Change**: Error should be in results step, not upload step
   - **Add**: Verify "Close" button is present

3. **"should clear error message when modal is closed and reopened"** (File-Level Validation)
   - **Add**: After seeing error in results, click "Close"
   - **Keep**: Verify modal closes
   - **Keep**: Verify error is gone on reopen

4. **"should drop rows with invalid node types and show summary"** (Row-Level Validation)
   - **Add**: After upload, verify results view shows warnings
   - **Add**: Click "Close" (instead of Escape) to dismiss
   - **Keep**: Verify filtered nodes on graph

5. **"should deduplicate rows with duplicate IDs and show warning"** (Row-Level Validation)
   - **Add**: After upload, verify results view shows warnings
   - **Add**: Click "Close" (instead of Escape) to dismiss
   - **Keep**: Verify deduplicated nodes on graph

#### New Tests

**No new tests needed** - all scenarios are covered by updated existing tests.

#### Implementation Changes

**1. Add Wizard State** (`csv-import-modal.tsx`):
```tsx
const [currentStep, setCurrentStep] = useState<'upload' | 'results'>('upload');
```

**2. Conditional Rendering**:
- Step 1: Show dropzone
- Step 2: Show results (success/warnings/errors) + Close button

**3. State Transitions**:
- After file processed → `setCurrentStep('results')`
- On Close button → `setIsOpen(false)` + `setCurrentStep('upload')`
- On modal close → Reset to `'upload'`

## Verification
*   **Automated**: New E2E tests for each cycle.
*   **Manual**: Use `legacy_assets/test-files/errors/*.csv` to verify.
