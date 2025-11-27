# Research: Graph Layout

## Current State
*   **Library**: Dagre (via `dagre` npm package).
*   **Implementation**: `apps/web/src/utils/layout.ts`.
*   **Config**: `rankdir: 'LR'`, `align: 'UL'`.
*   **Issue**: Dagre's default ranking doesn't strictly enforce the "Output Left, Input Right" business rule, especially for complex or disconnected graphs.

## Legacy Algorithm (Reference)
*   **Source**: `apps/web/src/utils/lineagegraph.ts` (Commit `ac2eace`).
*   **Logic**: "Longest Path Layering".
    *   **Layer 0**: Output Nodes.
    *   **Layer N**: Step Nodes at `1 + max(predecessor_depth)`.
    *   **Final Layer**: Input Nodes forced to rightmost.
*   **Cycle Handling**: Recursive DFS with visited stack to ignore back-edges.

## Chosen Approach
*   **Custom Layering**: We will implement the "Longest Path" logic manually to assign X-coordinates (Layers).
*   **Coordinate Assignment**:
    *   **X**: `LayerIndex * COLUMN_WIDTH`.
    *   **Y**: Simple vertical stacking within layers (`NodeIndex * ROW_HEIGHT`).
*   **Integration**: Replace Dagre's `layout()` call with our custom function. We might still use Dagre for edge routing if needed, or just use straight/bezier edges from React Flow.

## Testing Strategy
*   **E2E First**: Use Playwright to inject specific graph topologies via CSV and assert on node positions.
*   **Fixtures**:
    *   `basic_flow.csv`
    *   `chain_flow.csv`
    *   `convergent_flow.csv`
    *   `cycle_flow.csv`
