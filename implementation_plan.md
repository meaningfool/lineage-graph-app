# Implementation Plan - Error Interaction & Navigation

## Goal
Enhance error visibility and interactivity. This involves:
1.  **Selection**: Clicking an error selects the node/edge.
2.  **Visualization**: Errors "pulse" on the graph for easy spotting.
3.  **Navigation**: Camera automatically focuses on the selected error.

## User Review Required
> [!NOTE]
> **Visual Changes**: We are introducing a "Red Pulse" animation for invalid nodes and edges.
> **New Behavior**: Edges can now be "selected" (visually highlighted) via the Error Panel.

## Proposed Changes

### Spec 2: Interaction & Visualization

#### [MODIFY] [LineageGraph.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/lineage-graph.tsx)
- Add `handleErrorClick(error: GraphError)`:
    - If Node: `setSelectedNodeId(id)`.
    - If Edge: `setSelectedEdgeId(id)` (New State).
- Pass `selectedEdgeId` to `CustomEdge`.

#### [MODIFY] [CustomNode.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/graph/custom-node.tsx)
- Add conditional styling: If `data.validationErrors.length > 0`, apply `animate-pulse` (or custom shadow/ring).

#### [MODIFY] [CustomEdge.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/graph/custom-edge.tsx)
- Add conditional styling: If `data.validationErrors.length > 0`, apply pulse effect.
- Add "Selected" styling if `id === selectedEdgeId`.

### Spec 3: Navigation (Camera)

#### [MODIFY] [LineageGraph.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/lineage-graph.tsx)
- Update `handleErrorClick` to *also* trigger camera movement:
    - `reactFlowInstance.fitView({ nodes: [...], duration: 800 })`.

### Testing Infrastructure

#### [MODIFY] [LineagePage.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/e2e/pages/LineagePage.ts)
- Add `clickErrorItem(text: string)`.
- Add assertions for "Pulse" class/style.

## Verification Plan

### Automated Tests
*   **New Tests**:
    *   `e2e/error-display.spec.ts`: Test Node Selection, Pulse Visualization, and Edge Selection.
    *   `e2e/error-navigation.spec.ts`: Test Camera Focus.
*   **Regression Tests**:
    *   `e2e/node-properties.spec.ts`: Verify manual selection still works.

### Manual Verification
1.  Import file with errors.
2.  Verify "Red Pulse" on invalid nodes/edges.
3.  Click Node Error -> Verify Selection + Panel Open + Camera Focus.
4.  Click Edge Error -> Verify Edge Highlight + Camera Focus.
