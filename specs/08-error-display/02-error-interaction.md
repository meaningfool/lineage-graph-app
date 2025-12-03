# Spec: Error Interaction

## Goal
Make the Error Panel interactive. Clicking an error item should navigate the user to the source of the error in the graph. This involves selecting the node (if applicable) and focusing the camera on the entity. Crucially, the Error Panel must coexist with the Node Properties Panel.

## Slices

### Slice 1: Node Error Navigation
**Goal**: Clicking a node error selects the node and focuses the camera.
**Changes**:
- Add `onItemClick` prop to `ErrorListPanel`.
- Implement handler in `LineageGraph`:
    - If item is a Node:
        - Call `setSelectedNodeId(id)`.
        - Call `reactFlowInstance.fitView()` with `nodes: [{id}]` option (or `setCenter`).
- Update `ErrorListPanel` to call `onItemClick` when an item is clicked.

**Test Scenarios**:
- **Scenario 1: Select Node from Error [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Error Panel open. Node A has an error.
    - **Action**: Click the error item for Node A.
    - **Assertion**: 
        - Node A is visually selected (blue ring).
        - Node Properties Panel opens (on the RIGHT).
        - Error Panel remains open (on the LEFT).

**Existing Tests Impact**:
- `e2e/node-properties.spec.ts`: **Regression Check**. This test verifies that clicking a node *manually* on the canvas opens the property panel.
    - **Risk**: We are modifying `LineageGraph` to handle selection programmatically. We must ensure `onNodeClick` (the existing handler) still works as expected.
    - **Mitigation**: Run `e2e/node-properties.spec.ts` to confirm no regression. The logic for `onNodeClick` should remain independent or reuse the same state setter `setSelectedNodeId`.

### Slice 2: Edge Error Navigation
**Goal**: Clicking an edge error focuses the camera on the edge.
**Changes**:
- Update handler in `LineageGraph`:
    - If item is an Edge:
        - Call `reactFlowInstance.fitView()` with `nodes: [sourceNode, targetNode]` to frame the edge.
        - *Note: We do not select edges as they don't have properties.*

**Test Scenarios**:
- **Scenario 1: Focus Edge from Error [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Error Panel open. Edge A->B has an error.
    - **Action**: Click the error item for Edge A->B.
    - **Assertion**: 
        - Camera moves (verify viewport transform changes).
        - No node is selected (unless one was already selected).

**Existing Tests Impact**:
- **No Change**. Edge selection is a new concept (visually focusing). Existing tests do not interact with edges in this way.

### Slice 3: Panel Coexistence & Layout
**Goal**: Ensure the layout gracefully handles both panels being open simultaneously.
**Changes**:
- CSS/Layout adjustments to `LineageGraph` container.
- Ensure the graph canvas is not obscured too much (maybe adjust `fitView` padding to account for panels).
- Verify z-indexes so panels don't overlap incorrectly.

**Test Scenarios**:
- **Scenario 1: Dual Panel Visibility [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Open Error Panel. Click a Node Error.
    - **Action**: Observe UI.
    - **Assertion**: 
        - Error Panel is visible on Left.
        - Node Properties Panel is visible on Right.
        - Graph is visible in the middle.
        - **Crucial**: Ensure `e2e/node-properties.spec.ts` would still pass (i.e., property panel is not obscured).

**Existing Tests Impact**:
- `e2e/node-properties.spec.ts`: **Visual Regression Risk**. If the Error Panel (left) somehow shifts the layout or z-index such that the Property Panel (right) is obscured or pushed off-screen, existing tests will fail.
    - **Verification**: We will run `e2e/node-properties.spec.ts` with the Error Panel *closed* (default state) to ensure baseline passes. Then, in `e2e/error-display.spec.ts`, we explicitly test the "Dual Panel" state. Since the Error Panel is closed by default, the risk to existing tests is low, provided the CSS changes don't affect the default layout.
