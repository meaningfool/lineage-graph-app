# Phase 2: Functional Wiring (TDD Slices)

This document outlines the strict TDD plan to wire the new `ImportWizardDialog` using a **Strict Isolation Strategy**.

## Test Architecture (Strict Isolation)

### 1. Folder Structure
All new tests will be grouped in a dedicated folder to prevent mixing with legacy tests.
```
apps/web/e2e/
├── csv-import.spec.ts (Legacy - DO NOT TOUCH)
├── ... (Other Legacy Tests)
├── fixtures/ (Shared Data - REUSE STRICTLY)
├── pages/
│   ├── LineagePage.ts (Legacy - DO NOT TOUCH)
│   ├── NewWizardPage.ts (New - Duplicate of LineagePage)
└── new-wizard/ (NEW FOLDER)
    ├── import-wizard.spec.ts (Replaces csv-import)
    ├── graph-validation.spec.ts (Duplicate)
    ├── error-display.spec.ts (Duplicate)
    ├── node-properties.spec.ts (Duplicate)
    ├── graph-layout.spec.ts (Duplicate)
    ├── subtree-highlighting.spec.ts (Duplicate)
    ├── state-management.spec.ts (Duplicate)
    └── camera-control.spec.ts (Duplicate)
```

### 2. Isolation Rules
*   **Page Object**: Create `NewWizardPage.ts` by strictly duplicating `LineagePage.ts`. Adapt it to the new wizard flow.
*   **Test Suites**: All 8 suites (1 primary + 7 downstream) must be duplicated into `e2e/new-wizard/` and adapted to use `NewWizardPage`.
*   **Legacy Code**: Do not modify any file outside of `e2e/new-wizard/`, `e2e/pages/NewWizardPage.ts`, or the new hook `useNewImportWizard`.

### 3. Workflow
For each slice:
1.  **Duplicate/Writer Test**: specific test cases into `e2e/new-wizard/...`.
2.  **Verify Red**: Run the test to confirm it fails.
3.  **Implement**: Write the minimal code in `useNewImportWizard`/Components to pass.

---

## Slice 1: Upload & File Validation
**Goal**: Wire Step 1 (Upload). Validates file selection.

### 1. Tests to Create (Incremental Population)
*   **Target File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts` (Create new file)
*   **Actions**:
    1.  **Copy** `should show error for malformed CSV` from `csv-import.spec.ts`.
    2.  **Copy** `should allow uploading an edges file along with nodes` from `csv-import.spec.ts`.
    3.  **Write New** `should disable next button if only nodes uploaded`.

### 2. Implementation
*   **Hook**: Create `useNewImportWizard`. Implement `files` state and `setFile`.
*   **UI**: Wire `UploadStep` to hook.

---

## Slice 2: Node Mapping & Reset
**Goal**: Wire Step 2 (Nodes). Map required fields.

### 1. Tests to Create
*   **Target File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts` (Append)
*   **Actions**:
    1.  **Copy** `should reset wizard state when modal is closed...` from `csv-import.spec.ts`.
    2.  **Copy** `should show mapping step with ID, Title, and Type dropdowns` from `csv-import.spec.ts`.
    3.  **Copy** `should validate mapping requirements` from `csv-import.spec.ts` (Adapt: Assert Node validation only).

### 2. Implementation
*   **Hook**: Implement `mapping` state (Properties partial) and `reset`.
*   **UI**: Wire `MappingNodesStep`.

---

## Slice 3: Edge Mapping
**Goal**: Wire Step 3 (Edges). Exclusion logic.

### 1. Tests to Create
*   **Target File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts` (Append)
*   **Actions**:
    1.  **Copy** `should validate mapping requirements` from `csv-import.spec.ts` (Adapt: Assert Edge validation only).
    2.  **Write New** `should disable selected source column in target dropdown`.

### 2. Implementation
*   **Hook**: Implement Edge mapping logic.
*   **UI**: Wire `MappingEdgesStep`.

---

## Slice 4: Happy Path Integration & Regression
**Goal**: Full E2E flow. Verify Valid Graphs.

### 1. Tests to Create
*   **Target File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts` (Append)
    *   **Copy** `should import nodes and edges with mapped fields` from `csv-import.spec.ts`.
    *   **Copy** `should reset wizard after successful import` from `csv-import.spec.ts`.
    *   **Copy** `should replace graph on second import` from `csv-import.spec.ts`.
    *   **Copy** `should import edges with only source and target columns` from `csv-import.spec.ts`.

    *   **Copy** `should import edges with only source and target columns` from `csv-import.spec.ts`.

### 2. Implementation
*   **Hook**: Implement `handleImport` -> calls `buildGraphFromCsv`.
*   **UI**: Wire `SuccessStep` to show results.

---

## Slice 5: Domain Validation & Error Handling (Wizard)
**Goal**: Verify that invalid data triggers warnings **inside the Wizard Success Step** (Not a dialog alert).

### 1. Tests to Create (Porting Details)
*   **Target File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts` (Append)

    *   **Test**: `should drop nodes with invalid types and show summary`
        *   *Legacy Flow*: Single Upload -> Next -> Mapping -> **Dialog Text Check**.
        *   *New Wizard Flow*: Upload -> Next -> Map Nodes -> Next -> Map Edges -> Next -> **Success Step**.
        *   *Verification Change*: Assert warnings are visible within the `SuccessStep` component (e.g., inside a warning list container), not just generic dialog text.

    *   **Test**: `should deduplicate nodes with duplicate IDs and show warning`
        *   *New Wizard Flow*: (Same as above)
        *   *Verification Change*: Verify "Duplicate Node ID" warning appears in Success Step.

    *   **Test**: `should limit warning messages to 10`
        *   *Verification Change*: Verify warning list items count in Success Step equals 10 + "more" message.

    *   **Test**: `should reject edges pointing to missing nodes`
        *   *Verification Change*: Verify "Source '...' not found" warning in Success Step.

    *   **Test**: `should reject edges pointing to missing target node`
        *   *Verification Change*: Verify "Target '...' not found" warning in Success Step.

    *   **Test**: `should reject edges pointing to nodes dropped due to validation errors`
        *   *Verification Change*: Verify cascading drop warning in Success Step.

    *   **Test**: `should silently deduplicate parallel edges`
        *   *Verification Change*: Verify final graph edge count matches expectation (Silent = No warning).

### 2. Implementation
*   **Hook**: Update `useNewImportWizard` to capture `warnings` from `buildGraphFromCsv` and expose them in the return object.
*   **UI**: Update `ImportWizardDialog.tsx` (Success Step) to accept and render a list of warnings (reusing legacy styles if possible).

---

## Slice 6: Advanced (Properties)
**Goal**: Wired Properties (Pills).

### 1. Tests to Create (Porting Details)
*   **Target File**: `apps/web/e2e/new-wizard/node-properties.spec.ts` (Create)
    *   **Action**: Duplicate `e2e/node-properties.spec.ts` content.
    *   **New Wizard Flow**:
        *   Navigate to Step 2 (Nodes Mapping).
        *   **Interaction Change**: Instead of selecting a "Property" dropdown option:
            *   Locate the "Properties (Optional)" extraction section (Pill Selector).
            *   Click the chip/pill for "description".
    *   **Verification Change**: Verify the `mappedColumns` state correctly includes "description" in the properties list.

*   **Target File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts` (Append)
    *   **New Test**: `should map node properties using pills`
        *   Upload `nodes_with_desc.csv`.
        *   Toggle "description" pill in Step 2.
        *   Finish import.
        *   Verify the resulting graph node has the "description" property.

### 2. Implementation
*   **Hook**: Update `mapping` state to support `properties: string[]`. Add `toggleProperty` action.
*   **UI**: Implement `PillSelector` component in `MappingNodesStep`.

---

## Slice 7: Feature Regression (Post-Wizard)
**Goal**: Verify new wizard against existing feature suites, using a "Fast Import" strategy to bypass UI complexity.

### Strategy (The Bypass)
*   **Do not port legacy tests file-by-file.**
*   **Create a `fastImport` helper** in `NewWizardPage` that automates the entire flow (Open -> Upload -> Map Defaults -> finish).
*   **Write new, focused tests** that verify the *outcome* (Graph state) rather than the wizard mechanics.

### 1. Tests to Create
*   **Target File**: `apps/web/e2e/new-wizard/graph-validation.spec.ts` (Create)
    *   **Action**: Re-implement critical scenarios using `fastImport`. (Validates graph visualization of errors).

*   **Target File**: `apps/web/e2e/new-wizard/error-display.spec.ts` (Create)
    *   **Action**: Re-implement critical scenarios using `fastImport`. (Validates error panel/toggle).

*   **Target File**: `apps/web/e2e/new-wizard/graph-layout.spec.ts` (Create)
    *   **Action**: Re-implement critical scenarios using `fastImport`.

*   **Target File**: `apps/web/e2e/new-wizard/subtree-highlighting.spec.ts` (Create)
    *   **Action**: Re-implement critical scenarios using `fastImport`.

*   **Target File**: `apps/web/e2e/new-wizard/camera-control.spec.ts` (Create)
    *   **Action**: Re-implement critical scenarios using `fastImport`.

*   **Target File**: `apps/web/e2e/new-wizard/state-management.spec.ts` (Create)
    *   **Action**: Re-implement critical scenarios using `fastImport`.
