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

## 3. The "Single Pass Sink-Anchored" Algorithm
**Context**: We needed a robust layout algorithm that handles valid flows, invalid graphs (loops, dead-ends), and floating cycles in a single pass.
**Key Components**:
1.  **Sink Identification**: The algorithm anchors traversal at "Sinks" (Outputs and Dead-end Steps).
2.  **Upstream Traversal**: It traverses **Upstream** (`Target -> Source`) from sinks to assign layers. This handles the Right-to-Left visual flow naturally by following the graph topology.
3.  **Degenerate Cases**:
    -   **Input-Only**: Early exit assigns Layer 0 immediately.
    -   **Strict Separation**: Inputs are forced to `MaxLayer + 1` if `MaxLayer` is occupied by non-inputs, preventing ambiguity.
4.  **Floating Cycles (Pseudo-Sink Strategy)**:
    -   *Problem*: Isolated cycles (e.g., `A->B->C->A`) have no sinks and remain unvisited.
    -   *Solution*: **Greedy Deterministic Leader**. We sort unvisited nodes by ID, pick the first as a "Pseudo-Sink", anchor it to Layer 1, and unroll the cycle upstream. This turns a vertical stack into a readable horizontal flow.
