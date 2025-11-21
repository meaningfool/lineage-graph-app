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
- **Auto-mapping**: If a column name matches (e.g., `id`, `ID`, `Id`), pre-select it.
- **Unmapped Columns**: Track which columns are not mapped (they become properties in later features).
- **Error Handling**: If required mappings are missing, disable "Next" button.

## TDD Cycles
To be defined during implementation.
