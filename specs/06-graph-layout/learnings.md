# Learnings: Graph Layout Implementation

## 1. E2E Infrastructure: Next.js & `data-testid`
**Context**: Playwright tests were failing with timeouts because they couldn't find elements by `data-testid`.
**Finding**: The Next.js configuration (`next.config.ts`) was incorrectly stripping `data-testid` attributes in **all environments**, including development.
**Fix**: Modified config to only apply `reactRemoveProperties` when `process.env.NODE_ENV === 'production'`.
**Lesson**: Always verify that test attributes are present in the actual DOM of the test environment (e.g., via `debug-html` test) before debugging complex timing issues.

## 2. Two-Layer Testing Strategy
**Context**: Testing a visual layout algorithm is complex because "correctness" involves both internal logic and final rendering.
**Strategy**:
1.  **Layer 1: Algorithm Logic**: Add a `data-layer` attribute to nodes in the DOM. This allows E2E tests to verify the *exact* computed layer index (e.g., `expect(node.getAttribute('data-layer')).toBe('2')`).
2.  **Layer 2: Visual Rendering**: Assert on the relative X-coordinates of nodes (e.g., `expect(nodeA.x).toBeLessThan(nodeB.x)`).
**Benefit**: Decouples logic verification from pixel-perfect rendering, making tests more robust and easier to debug.

## 3. Handling Floating Cycles (Pseudo-Sink Strategy)
**Context**: "Floating Cycles" are isolated graph components with no Inputs or Outputs (e.g., `A -> B -> C -> A`).
**Problem**: The standard "Sink-Anchored" algorithm relies on starting traversal from Outputs or Dead-ends. Floating cycles have neither, so they remain "unvisited" and default to Layer 1, resulting in a confusing vertical stack of nodes.
**Solution**: **Greedy Deterministic Leader**.
- After the main traversal, identify all unvisited nodes.
- Sort them by ID (for stability).
- Pick the first node as a "Pseudo-Sink".
- Anchor it to **Layer 1** and run the upstream traversal.
- **Result**: The cycle is "unrolled" into a linear flow (e.g., `B -> C -> A`), which is much easier to read.

## 4. Visualizing Dense Graphs (Edge Routing)
**Context**: Complex graphs with cycles and backward edges.
**Problem**: The default `SmoothStep` edge type creates significant visual clutter. Edges often overlap perfectly or run parallel in tight groups, making it impossible to trace individual connections.
**Solution**: **Bezier Curves**.
- Switched to `getBezierPath` with a custom `curvature` of **0.35**.
- **Benefit**: Curves naturally separate from each other, reducing overlap. The smoother lines make it easier for the eye to follow the "flow" compared to rigid right angles.

## 5. Implementing Right-to-Left (RTL) Flow
**Context**: The business requirement is for data to flow from Right (Input) to Left (Output).
**Challenges**:
- ReactFlow and standard path utilities often assume Left-to-Right (LTR).
- **Handle Positions**: Must be explicitly swapped. Source handles on the **Left**, Target handles on the **Right**.
- **Edge Calculation**: Logic for "Backward" edges must be inverted.
    - LTR Backward: `sourceX > targetX`
    - RTL Backward: `sourceX < targetX`
- **Bezier Control Points**: Must be adjusted to arc "outward" from the new handle positions (e.g., `sourceX - 30` instead of `+ 30`).
