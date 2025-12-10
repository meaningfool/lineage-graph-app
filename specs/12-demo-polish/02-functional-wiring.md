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

### 1. Tests (Copy to `e2e/new-wizard/import-wizard.spec.ts`)
| Source `csv-import.spec.ts` | Test Name | Adaptation |
| :--- | :--- | :--- |
| `171` | `should show error for malformed CSV` | Verify error UI. |
| `64` | `should allow uploading an edges file...` | Test upload only. |
| *New* | `should disable next button if only nodes uploaded` | Ensure blocking. |

### 2. Implementation Details
*   **Hook**: Create `useNewImportWizard` with `step`, `files`, `errors` state.
*   **UI**: Wire `UploadStep` to Hook's `setFile`.

---

## Slice 2: Node Mapping & Reset
**Goal**: Wire Step 2 (Nodes). Map required fields.

### 1. Tests (Copy/Write in `e2e/new-wizard/import-wizard.spec.ts`)
| Source `csv-import.spec.ts` | Test Name | Adaptation |
| :--- | :--- | :--- |
| `126` | `should reset wizard state when modal is closed...` | Verify reset Step 2->1. |
| `318` | `should show mapping step with ID...` | Verify dropdowns. |
| `357` | `should validate mapping requirements` (Nodes) | Verify "Next" disabled. |

### 2. Implementation Details
*   **Hook**: Add `mapping` state. Add `reset()` function.
*   **UI**: Wire `MappingNodesStep` to Hook.

---

## Slice 3: Edge Mapping
**Goal**: Wire Step 3 (Edges). Unique exclusion logic.

### 1. Tests (Copy/Write in `e2e/new-wizard/import-wizard.spec.ts`)
| Source `csv-import.spec.ts` | Test Name | Adaptation |
| :--- | :--- | :--- |
| `391` | `should validate mapping requirements` (Edges) | Verify "Next" disabled. |
| *New* | `should disable selected source column in target` | Verify exclusion logic. |

### 2. Implementation Details
*   **Hook**: Add Edge mapping set logic.
*   **UI**: Wire `MappingEdgesStep`. Ensure `Select` respects exclusion.

---

## Slice 4: Happy Path Integration & Regression
**Goal**: Full E2E flow. Verify Valid Graphs.

### 1. Tests
**A. Copy to `e2e/new-wizard/import-wizard.spec.ts`**
| Source | Test Name | Adaptation |
| :--- | :--- | :--- |
| `13` | `should import nodes and edges...` | Full flow. |
| `202` | `should reset wizard after success` | Verify clean state. |
| `246` | `should replace graph on second import` | Verify replacement. |

**B. Duplicate Suites (to `e2e/new-wizard/`)**
*   `graph-validation.spec.ts`
*   `graph-layout.spec.ts`
*   `subtree-highlighting.spec.ts`
*   `camera-control.spec.ts`
*   `state-management.spec.ts`

### 2. Implementation Details
*   **Hook**: Implement `handleImport()`. Call `buildGraphFromCsv`.
*   **Page Object**: Ensure `importGraph` helper in `NewWizardPage` navigates the 4 steps correctly.

---

## Slice 5: Error Handling & Regression
**Goal**: Invalid data distributions.

### 1. Tests
**A. Copy to `e2e/new-wizard/import-wizard.spec.ts`**
| Source | Test Name | Adaptation |
| :--- | :--- | :--- |
| `402` | `should drop nodes with invalid types` | Verify Success/Warning. |
| `440` | `should deduplicate nodes` | Verify Warning. |
| `513` | `should reject edges pointing to missing nodes` | Verify Warning. |

**B. Duplicate Suites (to `e2e/new-wizard/`)**
*   `error-display.spec.ts`

### 2. Implementation Details
*   **Hook**: Ensure `onImport` returns warnings to UI.
*   **UI**: Pass warnings to `SuccessStep`.

---

## Slice 6: Advanced (Properties)
**Goal**: Wired Properties (Pills).

### 1. Tests
**A. Copy to `e2e/new-wizard/import-wizard.spec.ts`**
| Source | Test Name | Adaptation |
| :--- | :--- | :--- |
| *New* | `should map node properties using pills` | Verify property import. |

**B. Duplicate Suites (to `e2e/new-wizard/`)**
*   `node-properties.spec.ts` (Adapt to use Pills in `NewWizardPage.mapColumns`).

### 2. Implementation Details
*   **Hook**: Support `properties` array in mapping.
*   **UI**: Wire `PillSelector` in `MappingNodesStep`.
