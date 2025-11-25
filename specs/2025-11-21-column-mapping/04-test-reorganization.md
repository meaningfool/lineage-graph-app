# Test Suite Reorganization Plan

## Objective
Refactor the `csv-import.spec.ts` E2E test suite to:
1.  **Remove Redundancy**: Eliminate duplicate "Happy Path" tests.
2.  **Improve Structure**: Organize tests logically (Happy Path -> Workflow -> Mapping -> Validation).
3.  **Enhance Coverage**: Add missing tests for wizard state reset, malformed CSVs, and sequential imports.
4.  **Clean Up**: Remove obsolete or skipped tests.

## Detailed Mapping: Old vs. New

| Old Test Name | Action | New Group | Notes |
| :--- | :--- | :--- | :--- |
| `should show mapping step with ID, Title...` | **KEEP** | Column Mapping | Renamed to `should show mapping step...` |
| `should validate mapping requirements` | **KEEP** | Column Mapping | Covers "Next" button disabled states. |
| `should import nodes with mapped fields` | **KEEP** | Happy Path | This becomes the main "Happy Path" test. |
| `should upload a valid CSV and display nodes` | **REMOVE** | - | Redundant with `should import nodes...`. |
| `should have disabled next button initially` | **REMOVE** | - | Redundant with `should validate mapping requirements`. |
| `should allow uploading an edges file...` | **KEEP** | Happy Path | Renamed to `should allow uploading edges...`. |
| `should reject edges pointing to missing nodes` | **KEEP** | Edge Validation | - |
| `should reject edges pointing to missing target` | **KEEP** | Edge Validation | - |
| `should reject edges pointing to nodes dropped` | **KEEP** | Edge Validation | - |
| `should import edges with only source/target` | **KEEP** | Edge Validation | - |
| `should silently deduplicate parallel edges` | **KEEP** | Edge Validation | - |
| `should reject file with missing required cols` | **REMOVE** | - | Obsolete (skipped). |
| `should clear error message when modal closed` | **REMOVE** | - | Obsolete (skipped). |
| `should drop rows with invalid node types` | **KEEP** | Node Validation | - |
| `should deduplicate rows with duplicate IDs` | **KEEP** | Node Validation | - |
| `should disable Next button if Source=Target` | **KEEP** | Column Mapping | - |
| `should limit warning messages to 10` | **KEEP** | Node Validation | - |
| **[NEW]** | **CREATE** | Workflow | `should reset wizard state when modal is closed` |
| **[NEW]** | **CREATE** | Workflow | `should show error for malformed CSV` |
| **[NEW]** | **CREATE** | Workflow | `should replace graph on second import` |

## Proposed Structure & New Tests

### 1. Happy Path (The "Golden Flow")
*   **`should import nodes and edges with mapped fields`** (Existing)
    *   Verifies the complete end-to-end flow with custom headers.
*   **`should allow uploading an edges file along with nodes`** (Existing)
    *   Verifies basic edge import.

### 2. Workflow & State (New/Restored)
*   **[NEW] `should reset wizard state when modal is closed and reopened`**
    *   **Goal**: Verify that closing the modal clears files, mapping, and step state.
    *   **Steps**: Upload files -> Close Modal -> Reopen -> Verify empty state (Step 1).
*   **[NEW] `should show error for malformed CSV`**
    *   **Goal**: Verify error handling for invalid files.
    *   **Steps**: Upload a non-CSV file or corrupted CSV -> Verify "Failed to parse" error message.
*   **[NEW] `should replace graph on second import`**
    *   **Goal**: Verify that a second import wipes the canvas and replaces the old graph.
    *   **Steps**:
        1.  Import Graph A (2 nodes).
        2.  Verify Graph A is on canvas.
        3.  Open Modal -> Cancel (Close) -> Verify Graph A is STILL there.
        4.  Open Modal -> Import Graph B (3 DIFFERENT nodes).
        5.  Verify Graph B is on canvas (Graph A nodes are gone).

### 3. Column Mapping Logic
*   **`should validate mapping requirements`** (Existing)
*   **`should disable Next button if Source and Target columns are the same`** (Existing)

### 4. Node Validation
*   **`should drop nodes with invalid types and show summary`** (Existing)
*   **`should deduplicate nodes with duplicate IDs and show warning`** (Existing)
*   **`should limit warning messages to 10`** (Existing)

### 5. Edge Validation
*   **`should reject edges pointing to missing nodes`** (Existing)
*   **`should reject edges pointing to missing target node`** (Existing)
*   **`should reject edges pointing to nodes dropped due to validation errors`** (Existing)
*   **`should import edges with only source and target columns`** (Existing)
*   **`should silently deduplicate parallel edges`** (Existing)

## Fixture Management

| Fixture Name | Action | Reason |
| :--- | :--- | :--- |
| `nodes_valid_basic.csv` | **KEEP** | Used in Happy Path. |
| `edges_valid_basic.csv` | **KEEP** | Used in Happy Path. |
| `nodes_valid_custom_headers.csv` | **KEEP** | Used in Happy Path (Custom Headers). |
| `edges_valid_no_id_column.csv` | **KEEP** | Used in Edge Validation. |
| `edges_valid_duplicates.csv` | **KEEP** | Used in Edge Validation. |
| `nodes_invalid_duplicate_ids.csv` | **KEEP** | Used in Node Validation. |
| `nodes_invalid_bad_type.csv` | **KEEP** | Used in Node Validation. |
| `nodes_invalid_missing_type_col.csv` | **REMOVE** | Obsolete (File-level check removed). |
| `edges_invalid_missing_source.csv` | **KEEP** | Used in Edge Validation. |
| `edges_invalid_missing_target.csv` | **KEEP** | Used in Edge Validation. |
| `edges_invalid_orphaned.csv` | **KEEP** | Used in Edge Validation. |
| `nodes_stress_many_warnings.csv` | **KEEP** | Used in Node Validation. |
| `malformed.csv` | **CREATE** | For new `should show error for malformed CSV` test. |
| `nodes_second_import.csv` | **CREATE** | For new `should replace graph on second import` test. |

## Implementation Steps
1.  **Fixture Cleanup**:
    *   Remove `nodes_invalid_missing_type_col.csv`.
    *   Create `malformed.csv` (Random text).
    *   Create `nodes_second_import.csv` (Simple nodes file).
2.  **Refactor Spec**: Rewrite `csv-import.spec.ts` to match the structure above.
3.  **Verify**: Run the new test suite to ensure all tests pass.
