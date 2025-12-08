# Spec: Lineage Isolation

## Goal
Allow users to focus on a specific node and its direct lineage (upstream and downstream dependencies) within the graph. This improves legibility for complex graphs by visually emphasizing the relevant subtree and dimming unrelated nodes.

## Slice 1: Focus Toggle UI (Details Panel)
**Goal**: Add the "Focus" control to the Node Details Panel and manage the focus state.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Toggle Focus Button
        *   **Setup**: Import a graph, click a node to open details.
        *   **Action**: Click "Focus Subtree".
        *   **Assertion**: Button text changes to "Clear Focus".
    *   **Scenario**: Clear Focus Button
        *   **Setup**: Focus is active (button says "Clear Focus").
        *   **Action**: Click "Clear Focus".
        *   **Assertion**: Button text changes to "Focus Subtree".

**Implementation**:
*   **Components**:
    *   `NodeDetailsPanel`: Add toggle button.
    *   `LineageGraph`: Add `focusedNodeId` state (string | null).
*   **State**: `focusedNodeId` passed down to `NodeDetailsPanel`.

**Impact Analysis**:
*   **Shared Components**: `NodeDetailsPanel` (UI change only), `LineageGraph` (state addition).

## Slice 2: Highlighting Logic
**Goal**: Implement the visual dimming and graph traversal logic.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Focus Highlights Subtree
        *   **Setup**: Chain A->B->C, separate D. Focus B.
        *   **Action**: Activate focus on B.
        *   **Assertion**: A, B, C are opaque. D is semi-transparent.
    *   **Scenario**: Deactivate Focus Restores Opacity
        *   **Setup**: Focus active on B (D is dimmed).
        *   **Action**: Deactivate focus.
        *   **Assertion**: Node D returns to full opacity (opaque).
*   **Existing Test Updates**:
    *   Visual regression tests might need updates if they capture the "dimmed" state, but default state should be unaffected.

**Implementation**:
*   **Logic**:
    *   `getUpstreamNodes(nodeId, edges)`: Recursive/BFS traversal upstream.
    *   `getDownstreamNodes(nodeId, edges)`: Recursive/BFS traversal downstream.
    *   `highlightedSet`: Union of upstream + downstream + focusNode.
*   **Components**:
    *   `CustomNode` / `CustomEdge`: Receive `dimmed` prop. Apply `opacity: 0.1` (or CSS class) if true.

**Impact Analysis**:
*   **Shared Components**: `CustomNode`, `CustomEdge` (will receive new props).

## Slice 3: Graph Degeneracy
**Goal**: Ensure robust handling of cycles, self-loops, and complex structures.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Focus in Cycle
        *   **Setup**: A->B->A (Cycle). Focus A.
        *   **Action**: Activate focus.
        *   **Assertion**: Both A and B are highlighted (traversal handles visited nodes).
    *   **Scenario**: Focus Self-Loop
        *   **Setup**: A->A. Focus A.
        *   **Assertion**: A is highlighted.

**Implementation**:
*   **Logic**: Ensure traversal algorithms use `visited` sets to prevent infinite loops.

**Impact Analysis**:
*   **Risk**: Infinite recursion if `visited` check is missed.

## Slice 4: Interaction Refinements
**Goal**: Improve UX by allowing background click to dismiss focus.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Background Dismissal
        *   **Setup**: Focus active.
        *   **Action**: Click canvas background (pane).
        *   **Assertion**: Focus clears, all nodes opaque.
    *   **Scenario**: Panning while Focused
        *   **Setup**: Focus active.
        *   **Action**: Drag canvas.
        *   **Assertion**: Focus remains active, graph moves.

**Implementation**:
*   **Components**:
    *   `LineageGraph`: Add `onPaneClick` handler to React Flow instance to set `focusedNodeId(null)`.

**Impact Analysis**:
*   **UX**: Ensures "escape hatch" for users.
