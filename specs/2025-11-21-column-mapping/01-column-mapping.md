# Feature: Column Mapping Wizard

## Overview
Allow users to map their CSV columns to the expected fields (`id`, `title`, `type` for nodes; `source`, `target` for edges). This enables users with non-standard CSV formats to import their data without preprocessing.

## Motivation
Users may have CSVs with different column names (e.g., `node_id` instead of `id`, `name` instead of `title`). Forcing a specific schema is inflexible and creates friction.

## Requirements
1. **Wizard Step**: Add a new "Column Mapping" step between file upload and import.
2. **Nodes Mapping**: Users select which column maps to `id`, `title`, `type`.
3. **Edges Mapping**: Users select which column maps to `source`, `target`.
4. **Validation**: Ensure all required fields are mapped before proceeding.
5. **Auto-Detection**: Attempt to auto-map columns with matching names (case-insensitive).

## User Flow
1. User uploads Nodes CSV and Edges CSV.
2. System displays column mapping UI showing detected columns.
3. User maps each required field to a column.
4. User proceeds to validation and import.

## Design Considerations
- **Error Handling**: If required mappings are missing, disable "Next" button.

## TDD Cycles

### Cycle 1: ID Mapping UI & Validation (Non-Functional)
*   **Goal**: Add mapping step with ID dropdown and robust validation.
*   **Red**:
    *   **New Test**: `should show mapping step with ID dropdown`
        *   Upload `mapping-nodes-nonstandard.csv`.
        *   Verify "Column Mapping" step appears with ID dropdown.
    *   **New Test**: `should validate mapping requirements`
        *   Upload file.
        *   Verify "Next" button is **disabled** initially.
        *   Select `node_id` for ID.
        *   Verify "Next" button is **enabled**.
        *   **Reversibility Check**: Select empty/default option.
        *   Verify "Next" button is **disabled** again.
    *   **Update Existing Tests**:
        *   Update all 12 existing tests to: Upload -> **Select `id`** -> Click Next.
*   **Green**: 
    *   Add `mapping` step.
    *   Implement ID dropdown.
    *   Implement validation logic with reversibility.

### Cycle 2: Title & Type Mapping UI (Non-Functional)
*   **Goal**: Add Title and Type dropdowns with combined validation.
*   **Red**:
    *   **Update Test**: `should validate mapping requirements`
        *   Update the test from Cycle 1 to include Title and Type.
        *   Map ID only -> Verify "Next" **disabled**.
        *   Map ID + Title -> Verify "Next" **disabled**.
        *   Map ID + Title + Type -> Verify "Next" **enabled**.
        *   Unmap Type -> Verify "Next" **disabled**.
    *   **Update Existing Tests**:
        *   Update all 12 tests to also select `title` and `type`.
*   **Green**: 
    *   Add Title and Type dropdowns.
    *   Update validation logic to require all three fields.

### Cycle 3: Functional Node Mapping
*   **Goal**: Actually use the mapped columns during import.
*   **Red**:
    *   **New Test**: `should import nodes with mapped fields`
        *   Upload `mapping-nodes-nonstandard.csv`.
        *   Map fields correctly.
        *   Import.
        *   Verify imported node has correct ID (`node_id`), Label (`name`), and Type (`node_type`).
*   **Green**: 
    *   Update parsing logic to use the selected columns for ID, Title, and Type.

### Cycle 4: Edge Mapping (UI + Functional)
*   **Goal**: Add edge mapping with validation and failure mode checks.
*   **Red**:
    *   **Update Test**: `should validate mapping requirements`
        *   Update test to include edge files.
        *   Upload Nodes + Edges.
        *   Map all Node fields -> Verify "Next" **disabled** (because edges unmapped).
        *   Map Source only -> Verify "Next" **disabled**.
        *   Map Source + Target -> Verify "Next" **enabled**.
    *   **New Test**: `should prevent mapping same column to source and target`
        *   Upload edges file.
        *   Map `from` to Source.
        *   Map `from` to Target.
        *   Verify "Next" **disabled** (or show error).
    *   **Update Existing Tests**:
        *   Update edge-related tests to map `source` and `target`.
*   **Green**: 
    *   Add Edge mapping UI.
    *   Implement Edge validation (required fields + distinct columns check).
    *   Implement Edge mapping logic.
