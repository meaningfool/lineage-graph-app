# Phase 2: Functional Wiring (TDD Slices)

This document outlines the strict TDD plan to wire the new `ImportWizardDialog`. It ensures **100% coverage** of existing tests and preserves existing logic (like edge source/target exclusion).

## Strategy
*   **New Hook**: Implement `useNewImportWizard`.
*   **Strict TDD**: Copy/Adapt tests for each slice.
*   **Validation**:
    *   **Form Validation** (Required Fields): Happens per step (Slice 2 & 3).
    *   **Domain Validation** (Orphans, Cycles): Happens at the end (Slice 4/5).

---

## Slice 1: Upload & File Validation
**Goal**: Wire Step 1 (Upload). Validates file selection and basic correctness.

| Source Test (Line #) | Test Name | Adaptation Notes |
| :--- | :--- | :--- |
| `171` | `should show error for malformed CSV` | Verify error UI. Verify dropzones clear. |
| `64` (Partial) | `should allow uploading an edges file...` | Test upload only. Verify Dropzone content & "Next" enabled. |
| *New* | `should disable next button if only nodes uploaded` | Ensure missing edge file blocks progress (Mandatory). |

---

## Slice 2: Node Mapping & Reset (Happy Path)
**Goal**: Wire Step 2 (Nodes). Map required fields. **Handle basic Reset**.

| Source Test (Line #) | Test Name | Adaptation Notes |
| :--- | :--- | :--- |
| `126` | `should reset wizard state when modal is closed...` | Verify closing from Step 2 resets to Step 1. |
| `318` | `should show mapping step with ID...` | Verify dropdowns. Ignore "Pills" for now. |
| `357` (Partial) | `should validate mapping requirements` (Nodes) | Verify "Next" disabled until ID/Title/Type set. |

---

## Slice 3: Edge Mapping (Happy Path)
**Goal**: Wire Step 3 (Edges). Map required fields. Preserve exclusion logic.

| Source Test (Line #) | Test Name | Adaptation Notes |
| :--- | :--- | :--- |
| `391` (Partial) | `should validate mapping requirements` (Edges) | Verify "Next" disabled until Source/Target set. |
| *New* | `should disable selected source column in target dropdown` | Verify `disabled={col === mapping.source}` logic. |

---

## Slice 4: Happy Path Integration & Lifecycle
**Goal**: Full E2E flow. Reset after success. Graph Replacement.

| Source Test (Line #) | Test Name | Adaptation Notes |
| :--- | :--- | :--- |
| `13` | `should import nodes and edges with mapped fields` | Navigate 4 steps -> Verify graph. |
| `202` | `should reset wizard after successful import` | Verify reset after Step 4 completion. |
| `246` | `should replace graph on second import` | Verify "New Import" clears old graph. |
| `618` | `should import edges with only source and target columns` | Happy path variant (no Edge ID). |

---

## Slice 5: Domain Validation & Error Handling
**Goal**: Handle invalid data distributions (Orphans, Duplicates). Show warnings.

| Source Test (Line #) | Test Name | Adaptation Notes |
| :--- | :--- | :--- |
| `402` | `should drop nodes with invalid types...` | Verify "Success" screen shows warnings. |
| `440` | `should deduplicate nodes with duplicate IDs...` | Verify "Success" screen shows warnings. |
| `477` | `should limit warning messages to 10` | Verify warning list structure on Success. |
| `513`, `546` | `should reject edges pointing to missing nodes` | Verify "Success" screen shows warnings. |
| `581` | `should reject edges pointing to nodes dropped...` | Verify warning cascading. |
| `652` | `should silently deduplicate parallel edges` | Verify clean success. |

---

## Slice 6: Advanced (Properties)
**Goal**: Wire the "Pill" UI for Node Properties.

| Source Test (Line #) | Test Name | Adaptation Notes |
| :--- | :--- | :--- |
| *New* | `should map node properties using pills` | Wire the Pill UI. Verify imported properties in graph. |
