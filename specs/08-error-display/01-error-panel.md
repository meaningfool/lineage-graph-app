# Spec: Functional Error Panel

## Goal
Implement the visual components for displaying graph validation errors: a toggle button with a count badge and a side panel listing the errors. This spec focuses on the "read-only" aspect of the feature—displaying the information correctly without yet implementing the navigation/interaction logic.

## Slices

### Slice 1: Error Toggle & Badge
**Goal**: Display a floating button on the graph that shows the total number of errors.
**Changes**:
- Create `ErrorToggle` component.
- Update `LineageGraph` to calculate total error count from nodes and edges.
- Render `ErrorToggle` in `LineageGraph` (positioned top-left to avoid conflict with Node Properties on the right).

**Test Scenarios**:
- **Scenario 1: No Errors [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Import a clean CSV (e.g., `fixtures/nodes_valid_basic.csv`).
    - **Action**: Render graph.
    - **Assertion**: Error Toggle is NOT visible (or visible with 0 count). *Decision: Hidden when 0 errors.*
- **Scenario 2: With Errors [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Import `fixtures/nodes_errors_display.csv` (contains 3 node errors) and `fixtures/edges_errors_display.csv` (contains 2 edge errors).
    - **Action**: Render graph.
    - **Assertion**: Error Toggle is visible. Badge displays "5".

**Existing Tests Impact**:
- `e2e/node-properties.spec.ts`: **No Change**. This test uses valid fixtures (`nodes_with_desc.csv`), so the error toggle will remain hidden. Even if it were visible, it is positioned in the top-left, while node properties tests interact with nodes (center) and the property panel (right), so no interference is expected.

### Slice 2: Error Panel Shell
**Goal**: Create the side panel container and manage its open/close state.
**Changes**:
- Create `ErrorListPanel` component (initially just a shell with title and close button).
- Add `isErrorPanelOpen` state to `LineageGraph`.
- Wire up `ErrorToggle` click to set `isErrorPanelOpen(true)`.
- Wire up `ErrorListPanel` close button to set `isErrorPanelOpen(false)`.

**Test Scenarios**:
- **Scenario 1: Opening the Panel [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Graph loaded with errors.
    - **Action**: Click Error Toggle.
    - **Assertion**: `ErrorListPanel` is visible on the LEFT side.
- **Scenario 2: Closing the Panel [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Panel is open.
    - **Action**: Click Close button (X) inside the panel.
    - **Assertion**: `ErrorListPanel` is NOT visible.

**Existing Tests Impact**:
- `e2e/node-properties.spec.ts`: **No Change**. The error panel is closed by default. Existing tests do not interact with the error toggle, so the panel will remain closed and will not obscure any elements.

### Slice 3: Error List Content
**Goal**: Populate the panel with the actual list of errors from the graph.
**Changes**:
- Update `ErrorListPanel` to accept an array of errors.
- In `LineageGraph`, aggregate errors from all nodes and edges into a flat list: `{ id, type, message, label }`.
- Render the list in the panel. Each item should show:
    - The Error Message (e.g., "Cycle detected").
    - The ID/Label of the entity (e.g., "Node A").
    - An icon indicating Node vs Edge.

**Test Scenarios**:
- **Scenario 1: List Accuracy [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Import `fixtures/nodes_errors_display.csv` (Node A has "Missing Type").
    - **Action**: Open Error Panel.
    - **Assertion**: Panel contains an item with text "Missing Type" and "Node A".
- **Scenario 2: Multiple Errors [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Import data where one node has multiple errors.
    - **Action**: Open Error Panel.
    - **Assertion**: Panel lists all errors for that node.

**Existing Tests Impact**:
- **No Change**. This slice only affects the internal content of the new `ErrorListPanel`. No interaction with the main graph or other panels.
