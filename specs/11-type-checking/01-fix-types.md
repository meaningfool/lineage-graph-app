# Implementation Plan - Type Checking Fixes

## Goal
Eliminate technical debt enabling strict type checking and linting to run in the CI/CD pipeline (pre-commit hooks).

## User Review Required
> [!IMPORTANT]
> This refactor touches core data parsing logic. Regression testing of CSV Import is critical.

## Proposed Changes

### Slice 1: CSV Nodes (Type Safety)
#### [MODIFY] [csv-graph-importer.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/lib/csv-graph-importer.ts)
- Define `RawNodeRow` interface.
- Update `nodesData` parameter from `any[]` to `unknown[]` (or specific row type).
- Implement safe parsing/validation for Nodes loop.

### Slice 2: CSV Edges (Type Safety)
#### [MODIFY] [csv-graph-importer.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/lib/csv-graph-importer.ts)
- Define `RawEdgeRow` interface.
- Update `edgesData` parameter from `any[]` to `unknown[]`.
- Implement safe parsing/validation for Edges loop.

### Slice 3: Multi-Select Trigger (Accessibility)
#### [MODIFY] [multi-select.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/ui/multi-select.tsx)
- The main Trigger (`Button` with `role="combobox"`) is triggering `useSemanticElements`.
- Verify `PopoverTrigger` usage. Ensure `Button` is semantically correct or adjust `role`. Note: radix-ui typically handles this, but manual role overrides might be conflicting.

### Slice 4: Multi-Select List (Accessibility)
#### [MODIFY] [multi-select.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/ui/multi-select.tsx)
- The Listbox (`CommandList` / `CommandGroup`) and Options (`CommandItem`).
- `role="listbox"` on `div` (line 1003) -> Should be `ul` or managed component.
- `role="option"` on `CommandItem` (line 1055) -> Ensure underlying element is valid for this role.
- `role="button"` on "remove" icons (line 898, 963) -> Replace `div` with `button` element.

## Verification Plan
### Automated Tests
- `pnpm check-types` (must find 0 errors).
- `pnpm check` (biome).
- `npm run test:e2e` (Ensure CSV Import still works).
