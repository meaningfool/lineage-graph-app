# Spec: Error Interaction & Visualization

## Goal
Enhance the interactivity and visibility of errors in the graph. Users should be able to select nodes via the Error Panel, and errors on the graph should be visually distinct (pulsing) to aid rapid identification.

## Slice 1: Node Error Selection
**Goal**: Clicking a node error in the panel selects the corresponding node in the graph, opening its property panel.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Select Node from Error
        *   **File**: `e2e/error-display.spec.ts`
        *   **Setup**: Import `nodes_errors_display.csv`. Open Error Panel.
        *   **Action**: Click the error item for "Node 1".
        *   **Assertion**:
            *   "Node 1" is visually selected (ring).
            *   Node Properties Panel opens on the right.
            *   *Constraint*: The graph does NOT auto-pan (camera stays static).
*   **Existing Test Updates**:
    *   *None*.

**Implementation**:
*   **Components**:
    *   `ErrorListPanel`: Add `onItemClick` prop.
    *   `LineageGraph`: Implement `handleErrorClick`.
*   **Testing Infrastructure**:
    *   `e2e/pages/LineagePage.ts`: Add `clickErrorItem(text: string)` helper.
*   **Logic**:
    *   If Node Error: Call `setSelectedNodeId(id)`.
    *   *Note*: Ensure `LineageGraph` layout handles the Property Panel opening without obscuring the Error Panel (Coexistence).

**Impact Analysis**:
*   **Shared Components**: `LineageGraph` (Selection state).
*   **Affected Tests**: `e2e/node-properties.spec.ts` (Regression check for manual selection).

## Slice 2: Active vs. Passive Error Visualization
**Goal**: Distinguish between "Passive" errors (static red border) and the "Active" error being investigated (animated ripple). This ensures users can focus on one issue at a time without visual noise, and fixes the "sticky pulse" issue.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Exclusive Pulse (Active State)
        *   **File**: `e2e/error-display.spec.ts`
        *   **Setup**: Import `nodes_errors_display.csv`.
        *   **Action 1**: Click error for "Node 1".
        *   **Assertion 1**: "Node 1" has the ripple/pulse effect.
        *   **Action 2**: Click error for "Node 5" (or another error node).
        *   **Assertion 2**:
            *   "Node 5" has the ripple/pulse effect.
            *   **Crucial**: "Node 1" does *not* have the ripple/pulse effect (it reverts to static red border).
*   **Existing Test Updates**:
    *   **`e2e/error-display.spec.ts`**: Update "With Errors" scenario.
        *   **Assertion**: Verify that nodes with errors have a **static red border** by default (no pulse).

**Implementation**:
*   **Components**:
    *   `CustomNode`:
        *   Passive (hasError): Apply `border-red-500` (static).
        *   Active (hasError + isFocused): **Flashing Outer Ring**.
            *   Visual: A wide, red outer ring (outside the border) that flashes (opacity pulse).
            *   Duration: Limited time (e.g., 3 seconds).
    *   `CustomEdge`:
        *   Passive: Red stroke (static).
        *   Active: **Flashing Outer Stroke**.
            *   Visual: A wider red stroke underneath the main edge that flashes.
            *   Duration: Limited time (e.g., 2 seconds).
        *   **Restart**: Clicking the error again (when already selected) must **restart** the animation.
*   **Styling**:
    *   Define `flash` keyframes in Tailwind/CSS.
    *   Use CSS `animation-iteration-count` to limit the duration.
    *   **Node**: Use a separate `div` (not pseudo-element) for the ring to allow restarting via React `key`.
    *   **Edge**: Render a second `<path>` element behind the main one for the "outer stroke".
    *   **Logic**: Pass a `flashTrigger` timestamp in `data` to force re-mounting of the animated elements.

**Impact Analysis**:
*   **Shared Components**: `CustomNode`, `CustomEdge`.
*   **Affected Tests**: None.

## Slice 3: Edge Error Selection
**Goal**: Clicking an edge error in the panel triggers a distinct "Red Pulse" on the edge to highlight it.

**Test Scenarios**:
*   **New Tests**:
    *   **Scenario**: Select Edge from Error
        *   **File**: `e2e/error-display.spec.ts`
        *   **Setup**: Import `edges_errors_display.csv`.
        *   **Action**: Click the error item for an edge.
        *   **Assertion**:
            *   The specific edge displays the "Red Pulse" animation (or intensifies it).
            *   *Note*: No property panel opens for edges.
*   **Existing Test Updates**:
    *   None.

**Implementation**:
*   **Components**:
    *   `LineageGraph`: Add state `selectedEdgeId`.
    *   `CustomEdge`: React to `selected` prop to apply the "Red Pulse" styling.
*   **Logic**:
    *   `handleErrorClick`: If Edge Error, set `selectedEdgeId`.

**Impact Analysis**:
*   **Shared Components**: `LineageGraph`, `CustomEdge`.
*   **Affected Tests**: None (new behavior).
