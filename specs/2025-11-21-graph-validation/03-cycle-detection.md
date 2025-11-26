# Slice 3: Cycle Detection

## Goal
Ensure the lineage graph is a Directed Acyclic Graph (DAG). Cycles should be detected and highlighted to prevent infinite loops in processing and visualization.

## Vertical Slicing Strategy

### Slice 3.1: Self-Cycle Detection
- **Goal**: Detect the simplest cycle where a node connects directly to itself (A -> A).
- **Rule**: `edge.source === edge.target`.
- **Error Message**: "Cycle detected: Node connects to itself".
- **Test Case**:
    - **Setup**: `nodes_self_cycle.csv`, `edges_self_cycle.csv`.
    - **Scenario**: Node A connects to A.
    - **Assertion**: The **edge** A->A has a red stroke.

### Slice 3.2: Multi-Node Cycle Detection
- **Goal**: Detect cycles involving multiple nodes (e.g., A -> B -> A, or A -> B -> C -> A).
- **Rule**: Use Depth-First Search (DFS) to detect back-edges in the graph traversal.
- **Error Message**: "Cycle detected: Edge is part of a cycle".
- **Test Case**:
    - **Setup**: `nodes_cycle.csv`, `edges_cycle.csv`.
    - **Scenario**: A -> B -> C -> A.
    - **Assertion**: All **edges** in the cycle (A->B, B->C, C->A) have red strokes.

## Implementation Plan

### Domain Layer
- **File**: `src/lib/graph-validation.ts`
- **Logic**:
    - Update `validateGraph` to return both Node errors and **Edge errors**.
    - For Slice 3.1: Identify edges where `source === target`.
    - For Slice 3.2: Identify back-edges during DFS.

### UI Layer
- **Component**: `LineageGraph` in `lineage-graph.tsx`.
- **Visuals**:
    - Update `customEdges` memoization to check for validation errors on edges.
    - Apply `stroke: "#ef4444"` (red) to edges with errors.

## Verification
- **Automated**: E2E tests checking the `stroke` attribute of the edge SVG elements.
- **Visual**: Screenshots of the graph with red edges.
