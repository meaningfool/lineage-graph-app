# Slice 3: Cycle Detection

## Goal
Ensure the lineage graph is a Directed Acyclic Graph (DAG). Cycles should be detected and highlighted.

## Validation Logic
- **Rule**: Detect any cycles in the graph structure.
- **Algorithm**: Depth-First Search (DFS).

## User Experience
- **Visual**:
    - Highlight **edges** involved in the cycle in **red**.
    - (Optional) Highlight nodes involved in the cycle.
- **Interaction**:
    - Display a global warning or toast: "Cycle detected in graph."

## Testing Strategy (E2E)
- **Test Case**: `should detect and highlight cycles`
- **Steps**:
    1. Import a CSV with a simple cycle (A -> B -> A).
    2. Verify the graph renders.
    3. Assert that the edges A->B and B->A are styled red.
    4. Assert that a warning message is visible.
