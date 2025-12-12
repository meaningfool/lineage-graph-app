# Test Coverage Audit

This document verifies that every existing E2E test related to the CSV Import Wizard is accounted for in the **Phase 2: Functional Wiring** plan.

## 1. Primary Suite: `csv-import.spec.ts`
This file contains the core wizard logic tests.

| Test Case | Plan Coverage | Notes |
| :--- | :--- | :--- |
| `import nodes and edges with mapped fields` | **Slice 4** | The standard "Happy Path" E2E test. |
| `allow uploading an edges file along with nodes` | **Slice 1** | Covers the upload interaction and validation. |
| `reset wizard state when modal is closed and reopened` | **Slice 2** | Ensures cleaning state from Step 2 -> 1. |
| `show error for malformed CSV` | **Slice 1** | Validates parsing error feedback in Step 1. |
| `reset wizard after successful import` | **Slice 4** | Ensures resetting after full completion. |
| `replace graph on second import` | **Slice 4** | Critical feature: "New Import" clears the old graph. |
| `show mapping step with ID, Title, and Type dropdowns` | **Slice 2** | UI Component verification for Nodes step. |
| `validate mapping requirements` | **Slice 2 & 3** | Split into Node validation (Slice 2) and Edge validation (Slice 3). |
| `drop nodes with invalid types and show summary` | **Slice 5** | Validates backend domain logic & error reporting. |
| `deduplicate nodes with duplicate IDs and show warning` | **Slice 5** | Validates deduplication strategies. |
| `limit warning messages to 10` | **Slice 5** | Validates UI resilience for large error lists. |
| `reject edges pointing to missing nodes` | **Slice 5** | Validates referential integrity (Source). |
| `reject edges pointing to missing target node` | **Slice 5** | Validates referential integrity (Target). |
| `reject edges pointing to nodes dropped due to validation errors` | **Slice 5** | Validates cascading failures. |
| `import edges with only source and target columns` | **Slice 4** | Verifies edge building without explicit IDs. |
| `silently deduplicate parallel edges` | **Slice 5** | Validates edge deduplication logic. |

## 2. Secondary Suite: `node-properties.spec.ts`
These tests rely on the wizard's "Additional Properties" mapping.

| Test Case | Plan Coverage | Notes |
| :--- | :--- | :--- |
| `display properties field in mapping step` | **Slice 6** | Verifies the "Pill" UI exists. |
| `display first property in node card` | **Slice 6** | E2E test: Map property -> See in graph. |
| `handle selection, visual cues...` | **Slice 6** | Relies on property mapping to populate panel. |
| `not import unselected properties` | **Slice 6** | Verifies unchecked Pills are NOT imported. |

~~**Note**: These tests use `lineagePage.selectProperty()`. This helper will need to be updated to interact with "Pills" instead of `MultiSelect`.~~

## 3. Downstream Suites: `error-display.spec.ts` & `graph-validation.spec.ts`
These tests use the wizard to set up their initial state but do not test the wizard mechanics directly.

*   **Coverage**: **Slice 4 (Happy Path Integration)**.
*   **Requirement**: The new wizard must produce a valid graph that downstream components can consume.
*   **Action**: No specific new tests needed, but **existing tests MUST pass** after the refactor.

## Conclusion
**100% of existing wizard functionality is mapped.**
*   Core Logic: Slices 1-5.
*   UI/Properties: Slice 6.
*   Downstream Compatibility: Maintained via Slice 4.
