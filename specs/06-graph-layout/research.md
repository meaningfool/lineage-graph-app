# Research: Graph Layout

## Current State
*   **Library**: Dagre (via `dagre` npm package).
*   **Implementation**: `apps/web/src/utils/layout.ts`.
*   **Config**: `rankdir: 'LR'`, `align: 'UL'`.
*   **Issue**: Dagre's default ranking doesn't strictly enforce the "Output Left, Input Right" business rule, especially for complex or disconnected graphs.

## Algorithm Evolution: Single Pass Sink-Anchored
*   **Previous Approaches**:
    *   **Dagre**: Failed to enforce strict "Output Left, Input Right" rules.
    *   **Component-Based**: Too complex to implement (requires decomposing graph into connected components).
    *   **Multi-Pass**: Hard to coordinate anchors (Output vs Input vs Island).
*   **Final Strategy**: **"Single Pass Sink-Anchored"**.
    *   **Core Idea**: All valid flows eventually lead to a "Sink" (Output or Dead-end Step). By traversing **Upstream** (Target -> Source) from these sinks, we can layer the entire graph in one pass.
    *   **Selective Reversal**: Invalid edges (`Output->Step`, `Step->Input`) are "virtually reversed" to participate in the flow.
    *   **Robustness**:
        *   **Ignored Edges**: `Input->Input` and `Output->Output` are ignored as they add no value to hierarchy.
        *   **Cycle Detection**: Essential to prevent infinite recursion in cyclic graphs.
    *   **Input Alignment**: Instead of anchoring Inputs, we *track* the maximum depth during traversal and force all Inputs to `MaxDepth` (or `MaxDepth + 1`) at the end. This handles "Input-Only" and "Disconnected Input" cases gracefully.
*   **Type-Based Positioning**:
    *   **OUTPUT Nodes**: Always **Layer 0** (Leftmost).
    *   **INPUT Nodes**: Always **Layer Max** (Rightmost).
    *   **STEP Nodes**: Distributed in intermediate layers based on distance.
*   **Visual vs. Data Flow**:
    *   **Data Flow**: `INPUT -> STEP -> OUTPUT`.
    *   **Visual Layout**: `OUTPUT (Left) <- STEP <- INPUT (Right)` (Reversed for lineage tracing).
*   **Coordinate Assignment**:
    *   **X**: `LayerIndex * COLUMN_WIDTH`.
    *   **Y**: Simple vertical stacking within layers.

## Testing Strategy
*   **E2E First**: Use Playwright to inject specific graph topologies via CSV and assert on node positions.
*   **Fixtures**:
    *   `basic_flow.csv`
    *   `chain_flow.csv`
    *   `convergent_flow.csv`
    *   `cycle_flow.csv`
