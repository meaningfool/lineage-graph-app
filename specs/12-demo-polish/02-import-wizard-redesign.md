# Spec 2: Import Wizard Redesign

**Goal**: Redesign the CSV Import Wizard to provide a premium, visually engaging experience.

## Strategy
We separate **Visuals** from **Logic**.
1.  **Phase 1: Static UI Iteration**: Build the "shell" (HTML/CSS) to perfect the look and feel. No logic, no abstractions.
2.  **Phase 2: Wiring & Replacement**: incrementally wire the logic, using existing tests as a safety net.

## Implementation Plan

### Phase 1: Static UI (Design Lab)
*   **Goal**: Create a pixel-perfect "dumb" component that matches the [Design Reference](./wizard-design-reference.md).
*   **Approach**:
    *   Create `components/wizard/import-wizard-dialog.tsx`.
    *   Hardcode state (e.g., `step=1`, `step=2`) to manually cycle through screens.
    *   Iterate on layout and styling until approved.
    *   **NO** complex props or state management. Just markup.

### Phase 2: Functional Wiring (Slices)
*   **Goal**: incrementally wire the logic, validating each screen with targeted E2E tests before moving to the next.
*   **Slice 1: Upload Screen**
    *   **Test**: Duplicate `csv-import.spec.ts` -> `wizard-step-1-upload.spec.ts`. Focus on file selection and parsing events.
    *   **Dev**: Wire `react-dropzone` to the `useImportStore`.
    *   **Goal**: Verify files are accepted and parsed into headers.
*   **Slice 2: Required Mapping (Nodes & Edges)**
    *   **Test**: Create `wizard-step-2-mapping.spec.ts`. Verify *only* required fields (ID, Label, Type, Source, Target).
    *   **Dev**: Wire the `Select` components to the mapping state.
    *   **Constraint**: *Ignore* "Additional Properties" for now.
    *   **Goal**: Verify standard CSVs can be mapped successfully.
*   **Slice 3: Happy Path Integration**
    *   **Test**: Create `wizard-flow.spec.ts`. Run the full sequence: Upload -> Map (Basic) -> Success -> Graph Render.
    *   **Dev**: Wire the "Generate Graph" action in the Success step.
    *   **Goal**: Confirm the new wizard can actually generate a graph.
*   **Slice 4: Advanced Mapping (Properties)**
    *   **Test**: Update `wizard-flow.spec.ts` to include a CSV with extra columns. Check Node Details panel.
    *   **Dev**: Wire the `MultiSelect` component to the `data.properties` mapping logic.
    *   **Goal**: Enable rich metadata import.
*   **Slice 5: Error Handling**
    *   **Test**: Create `wizard-errors.spec.ts`. Test invalid CSVs, missing columns, and graph validation errors (cycles).
    *   **Dev**: Implement inline validation messages and error states.
*   **Slice 6: Replacement**
    *   **Dev**: Swap the main "Import" button to open the new, fully tested wizard. Remove legacy code.
