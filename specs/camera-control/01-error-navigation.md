# Spec: Error Navigation (Camera)

## Goal
Improve the user's ability to locate errors in large graphs by automatically focusing the camera on the relevant entity when an error is clicked.

## Slice 1: Focus on Selection
**Goal**: When a user clicks an error in the panel, the camera should smoothly pan and zoom to center the affected node or edge.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Camera Focus on Node Error
        *   **File**: `e2e/error-navigation.spec.ts`
        *   **Setup**: Import `nodes_errors_display.csv`. Open Error Panel.
        *   **Action**: Click "Node 1" error.
        *   **Assertion**:
            *   Viewport transform changes (verify `x`, `y`, `zoom` values change).
            *   Node 1 is centered in the viewport.
    *   **Scenario**: Camera Focus on Edge Error
        *   **File**: `e2e/error-navigation.spec.ts`
        *   **Setup**: Import `edges_errors_display.csv`.
        *   **Action**: Click Edge error.
        *   **Assertion**:
            *   Viewport transform changes.
            *   The edge (source + target nodes) is framed in the viewport.

**Implementation**:
*   **Components**:
    *   `LineageGraph`: Update `handleErrorClick` (or a new effect) to trigger `reactFlowInstance.fitView()`.
*   **Logic**:
    *   Use `fitView` with `nodes: [...]` option and `duration: 800` for smooth transition.
    *   Ensure padding accounts for open panels (Error Panel on left, Property Panel on right).

**Impact Analysis**:
*   **Shared Components**: `LineageGraph` (Camera control).
*   **Affected Tests**: None (additive behavior).
