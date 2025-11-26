# Code Quality Review: Graph Validation Feature

## Overview
This document analyzes the code changes introduced during the Graph Validation feature implementation (Slices 1, 2, and 3). The goal is to identify areas where the code has grown too complex or deviated from architectural best practices, and to propose refactoring steps.

## Analyzed Files
1.  `apps/web/src/lib/graph-validation.ts` (Domain Logic)
2.  `apps/web/src/components/lineage-graph.tsx` (UI Component)
3.  `apps/web/src/hooks/use-csv-import-wizard.ts` (Integration Hook)

## Findings & Recommendations

### 1. Domain Logic: `graph-validation.ts`

**Current State:**
The `validateGraph` function has become a "God Function". It performs multiple distinct responsibilities sequentially:
*   Building degree maps (in-degree, out-degree).
*   Detecting self-cycles (Slice 3.1).
*   Validating node-specific rules (Input, Output, Step) (Slice 2).
*   Detecting multi-node cycles using DFS (Slice 3.2).

**Issues:**
*   **Cognitive Load:** The function is long (162 lines) and mixes different types of validation logic.
*   **Testability:** Testing specific rules (e.g., just cycle detection) requires running the entire validation pipeline.
*   **Extensibility:** Adding new rules (e.g., "Disconnected Subgraphs") will further bloat this function.

**Recommendation: Strategy Pattern for Validation**
Refactor `validateGraph` to use a pipeline of small, focused validator functions.

```typescript
// Proposed Structure
type Validator = (
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    context: ValidationContext
) => ValidationResult;

const validators: Validator[] = [
    detectSelfCycles,
    validateNodeConnectivity, // (Input/Output/Step rules)
    detectMultiNodeCycles,
];

export function validateGraph(nodes, edges) {
    const context = {
        inDegreeMap: buildInDegreeMap(nodes, edges),
        outDegreeMap: buildOutDegreeMap(nodes, edges),
    };
    
    return validators.reduce((result, validator) => {
        const validationResult = validator(nodes, edges, context);
        return mergeResults(result, validationResult);
    }, { nodeErrors: new Map(), edgeErrors: new Map() });
}
```

**Benefits:**
- Each validator can be tested in isolation.
- New validators can be added without modifying existing code.
- Degree maps are calculated once and shared across validators.

---

### 2. UI Component: `lineage-graph.tsx`

**Current State:**
This file defines the main `LineageGraph` component but also includes the full definitions of `CustomNode` and `CustomEdge`.
*   `CustomEdge` contains complex logic for path calculation:
    *   Standard `getSmoothStepPath`
    *   `getBezierPath` for self-loops
    *   Custom SVG path generation for "backward horizontal" edges.
    *   Tooltip positioning logic.

**Issues:**
*   **File Length:** The file is over 300 lines long.
*   **Coupling:** The edge rendering logic is tightly coupled with the graph container.
*   **Reusability:** `CustomEdge` cannot be easily reused or tested in isolation.
*   **Comments:** Lines 102-127 contain extensive commented-out reasoning that should be removed.

**Recommendation: Component Extraction**
*   Extract `CustomNode` to `src/components/graph/custom-node.tsx`.
*   Extract `CustomEdge` to `src/components/graph/custom-edge.tsx`.
*   Move the path calculation logic into a utility function `getSmartEdgePath` in `src/lib/edge-path-utils.ts`.

```typescript
// Proposed: src/lib/edge-path-utils.ts
export function getSmartEdgePath(params: EdgePathParams): PathResult {
    const { sourceX, sourceY, targetX, targetY, isSelfLoop } = params;
    
    if (isSelfLoop) {
        return calculateSelfLoopPath(params);
    }
    
    if (isBackwardHorizontal(sourceX, sourceY, targetX, targetY)) {
        return calculateArchPath(params);
    }
    
    return getSmoothStepPath(params);
}
```

**Benefits:**
- Smaller, focused components.
- Path calculation logic can be unit tested.
- Easier to add new edge types (e.g., zigzag, step).

---

### 3. Integration Hook: `use-csv-import-wizard.ts`

**Current State:**
The `handleFinalImport` function is orchestrating too many low-level details:
1.  Parsing CSVs.
2.  Validating mappings.
3.  Building the domain graph.
4.  Running `validateGraph`.
5.  **Mapping Domain Types to ReactFlow Types** (lines 166-186).

**Issues:**
*   **Bloated Orchestrator:** The hook knows too much about *how* to convert data formats.
*   **Type Mapping Leakage:** The logic to convert `GraphNode` -> `ReactFlow.Node` is inline and duplicated conceptually.
*   **Single Responsibility Violation:** The hook should orchestrate, not transform.

**Recommendation: Extract Mapper**
Create a dedicated mapper in `src/lib/reactflow-mapper.ts`.

```typescript
// Proposed: src/lib/reactflow-mapper.ts
export function mapToReactFlow(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    validation: { nodeErrors: Map<string, string[]>, edgeErrors: Map<string, string[]> }
): { nodes: Node[], edges: Edge[] } {
    const reactFlowNodes = nodes.map(n => ({
        id: n.id,
        type: "custom",
        data: {
            label: n.title,
            validationErrors: validation.nodeErrors.get(n.id) || []
        },
        position: { x: 0, y: 0 },
    }));

    const reactFlowEdges = edges.map(e => {
        const edgeKey = `${e.source}-${e.target}`;
        return {
            id: `e-${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            data: {
                validationErrors: validation.edgeErrors.get(edgeKey) || []
            }
        };
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
}
```

Then simplify the hook:
```typescript
const graphResult = buildGraphFromCsv(...);
const validation = validateGraph(graphResult.nodes, graphResult.edges);
const { nodes, edges } = mapToReactFlow(graphResult.nodes, graphResult.edges, validation);
onImport(nodes, edges);
```

**Benefits:**
- Cleaner separation of concerns.
- Mapping logic can be tested independently.
- Easier to support multiple graph rendering libraries in the future.

---

## Summary of Action Items

| Priority | File | Action | Estimated LOC Impact |
|----------|------|--------|---------------------|
| High | `graph-validation.ts` | Extract validators into separate functions | -60, +80 (net +20) |
| Medium | `lineage-graph.tsx` | Extract `CustomNode` and `CustomEdge` to separate files | -200, +220 (net +20) |
| Medium | `lineage-graph.tsx` | Remove commented code (lines 102-127) | -25 |
| Low | `use-csv-import-wizard.ts` | Extract ReactFlow mapper to `reactflow-mapper.ts` | -20, +40 (net +20) |

**Overall Impact:** These changes will add approximately 60 lines of code but improve modularity, testability, and maintainability significantly.

## Next Steps

These refactorings are not blocking but should be prioritized before implementing the next major feature (e.g., Node Properties or Advanced Layouts) to avoid compounding technical debt.
