# Feature: Property Configuration

## Overview
This feature allows users to manually configure which columns from the CSV should be imported as node properties. We will integrate this into the existing **Column Mapping** step using a **Multi-Select** component.

## Slice 1: Isolation Test (Risk Mitigation)
### Intention
Verify the `MultiSelect` component works in isolation before integrating it into the complex wizard state.

### Tests (E2E)
-   **Scenario**: `should render multi-select in debug modal` **(NEW - TEMPORARY)**
    -   **Action**: Click temporary "Debug Multi-Select" button.
    -   **Assert**: Dialog opens with `MultiSelect` component.
    -   **Action**: Select/Deselect options.
    -   **Assert**: State updates correctly.

### Implementation Details
-   Create `DebugMultiSelectButton` and `DebugMultiSelectDialog`.
-   **Cleanup Task**: Delete these components and the temporary test after Slice 2 is verified.

## Slice 2: UI Integration & State
### Intention
Integrate the component into the **Column Mapping** step.

### Tests (E2E)
-   **Scenario**: `should display properties field in mapping step` **(NEW)**
    -   **Setup**: Upload `nodes_with_desc.csv`.
    -   **Assert**: "Properties" field appears below "Type".
    -   **Assert**: Dropdown contains "description" (from fixture).
    -   **Assert**: Default selection is **Empty**.

### Implementation Details
-   Add `MultiSelect` to `StepMapping.tsx`.
-   Update `useCSVImportWizard` state.

## Slice 3: Import Logic & Verification
### Intention
Ensure selected properties are imported and displayed in the **Side Panel**.

### Tests (E2E)
-   **Scenario**: `should import selected property into side panel` **(RENAME & EDIT `should display first property in node card`)**
    -   *Reason*: Properties are now in the panel, not the card.
    -   *Update*: Select "description" during mapping.
    -   **Assert**: "description" appears in Side Panel.

-   **Scenario**: `should handle selection, visual cues, and long content` **(EDIT)**
    -   *Update*: Select properties during mapping to ensure data exists for the test.

-   **Other Scenarios**: No other tests in `node-properties.spec.ts` are affected.

### Implementation Details
-   Update `csv-graph-importer.ts` to filter properties.
