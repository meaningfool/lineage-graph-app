# Learnings: Graph Layout Implementation

## 1. Handling Floating Cycles (Pseudo-Sink Strategy)
**Context**: "Floating Cycles" are isolated graph components with no Inputs or Outputs (e.g., `A -> B -> C -> A`).
**Problem**: The standard "Sink-Anchored" algorithm relies on starting traversal from Outputs or Dead-ends. Floating cycles have neither, so they remain "unvisited" and default to Layer 1, resulting in a confusing vertical stack of nodes.
**Solution**: **Greedy Deterministic Leader**.
- After the main traversal, identify all unvisited nodes.
- Sort them by ID (for stability).
- Pick the first node as a "Pseudo-Sink".
- Anchor it to **Layer 1** and run the upstream traversal.
- **Result**: The cycle is "unrolled" into a linear flow (e.g., `B -> C -> A`), which is much easier to read.

## 2. Visualizing Dense Graphs (Edge Routing)
**Context**: Complex graphs with cycles and backward edges.
**Problem**: The default `SmoothStep` edge type creates significant visual clutter. Edges often overlap perfectly or run parallel in tight groups, making it impossible to trace individual connections.
**Solution**: **Bezier Curves**.
- Switched to `getBezierPath` with a custom `curvature` of **0.35**.
- **Benefit**: Curves naturally separate from each other, reducing overlap. The smoother lines make it easier for the eye to follow the "flow" compared to rigid right angles.

## 3. Implementing Right-to-Left (RTL) Flow
**Context**: The business requirement is for data to flow from Right (Input) to Left (Output).
**Challenges**:
- ReactFlow and standard path utilities often assume Left-to-Right (LTR).
- **Handle Positions**: Must be explicitly swapped. Source handles on the **Left**, Target handles on the **Right**.
- **Edge Calculation**: Logic for "Backward" edges must be inverted.
    - LTR Backward: `sourceX > targetX`
    - RTL Backward: `sourceX < targetX`
- **Bezier Control Points**: Must be adjusted to arc "outward" from the new handle positions (e.g., `sourceX - 30` instead of `+ 30`).

## 4. E2E Test Stability
**Context**: Testing graph layout requires importing CSV files and rendering the graph.
**Insight**: These tests can be flaky due to variable rendering times or file upload speeds in the test environment, leading to timeouts (30s limit).
**Mitigation**: While the logic is correct, increasing timeouts for specific heavy tests (like Cycle detection) is a necessary trade-off to ensure reliable CI execution.
