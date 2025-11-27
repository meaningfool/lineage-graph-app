# Graph Layout Refinement Plan

## Goal
Implement a custom "Longest Path Layering" algorithm to improve the visualization of the lineage graph. The layout should place Output nodes on the left (Layer 0), Input nodes on the right (Final Layer), and Step nodes in intermediate layers based on their longest path from an Output.

## Strategy: E2E-Driven TDD
We will implement this feature in strict "vertical slices," driven by E2E tests. For each slice:
1.  **Define the Test**: Create an E2E test case with specific CSV data (Nodes/Edges) and expected visual assertions (e.g., "Node A is to the left of Node B").
2.  **Verify Failure (Red)**: Run the test to confirm it fails with the current Dagre layout.
3.  **Implement Logic (Green)**: Implement the minimum necessary logic in `graph-layout-utils.ts` to make the test pass.
4.  **Refactor**: Clean up and optimize.

## Slice 1: Core Layering (Acyclic)
**Goal**: Correctly layer simple, acyclic flows.

### Test Cases (CSV)
1.  **Basic Flow**: `Output -> Input`
    *   Expect: `Output.x < Input.x`
2.  **Chain Flow**: `Output -> Step1 -> Step2 -> Input`
    *   Expect: `Output.x < Step1.x < Step2.x < Input.x`
3.  **Convergent Flow (Longest Path)**:
    *   `Output1 -> StepA`
    *   `StepA -> StepB`
    *   `Output2 -> StepB`
    *   `StepB -> Input`
    *   Expect: `Output1.x < StepA.x < StepB.x` AND `Output2.x < StepB.x`.
    *   Crucially, `StepB` should be pushed to Layer 2 (after `StepA`), not Layer 1 (after `Output2`).

### Implementation
*   `computeLayers(nodes, edges)`:
    *   Identify Output nodes (Layer 0).
    *   DFS with memoization to calculate `depth = 1 + max(predecessor_depth)`.
    *   Force Input nodes to `max_depth + 1`.

## Slice 2: Cycle Resilience
**Goal**: Prevent infinite recursion and layout crashes when cycles exist (Validation Errors).

### Test Cases (CSV)
1.  **Self-Cycle**: `StepA -> StepA`
    *   Expect: Render without crash. `StepA` positioned reasonably.
2.  **Feedback Loop**: `StepA -> StepB -> StepA`
3.  **Convergent Cycle**:
    *   `Output1 -> StepA`
    *   `Output2 -> StepB`
    *   `StepA -> StepB`
    *   `StepB -> StepA`
    *   Expect: Render without crash. `StepA` and `StepB` positions should be stable and determined by their distance from `Output1` and `Output2`. Ideally `StepA` (dist 1 from Out1) and `StepB` (dist 1 from Out2) might end up in the same layer, or one pushed if the cycle breaking favors one direction. The key is stability and visibility.

### Implementation
*   **Cycle Breaking**:
    *   Enhance DFS to detect back-edges (node already in recursion stack).
    *   Ignore back-edges for depth calculation (return 0 or current depth).

## Slice 3: Disconnected Components
**Goal**: Handle graphs with multiple disconnected subgraphs.

### Test Cases (CSV)
1.  **Isolated Components**:
    *   `Output1 -> Input1`
    *   `Output2 -> Input2`
    *   Expect: Both visible, likely stacked vertically.

### Implementation
*   Ensure `computeLayers` iterates over ALL nodes, not just those reachable from the first Output.
*   `computeCoordinates` handles vertical spacing for distinct components (optional for now, Dagre might handle vertical separation if we feed it ranked nodes, or we implement simple row stacking).

## Verification
*   Run `npx playwright test e2e/graph-layout.spec.ts`
*   Visual check of the "Import CSV" feature with the provided test files.
