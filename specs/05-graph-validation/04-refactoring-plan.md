# Refactoring Plan: Graph Validation Architecture

## Overview
This specification details the refactoring steps to address technical debt identified in [post03-code-quality-review.md](./post03-code-quality-review.md). Each refactoring is broken down into concrete implementation steps with explicit test impact analysis.

## Architecture Decisions

- **Component Directory**: New graph components will be placed in `apps/web/src/components/graph/`
- **Validation Directory**: Validators will be nested under `apps/web/src/lib/graph-validation/` for clear grouping
- **Implementation Order**: Slice 2 → Slice 3 → Slice 1 (components first, mapper second, validation strategies last)
- **Test Strategy**: Zero new E2E tests required; existing tests provide adequate coverage through end-to-end verification

## Refactoring Slices

### Slice 1: Extract Graph Validation Strategies

**Goal:** Break down the monolithic `validateGraph` function into focused, testable validator functions using a pipeline pattern.

#### Current Structure
- File: [`apps/web/src/lib/graph-validation.ts`](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/lib/graph-validation.ts)
- Lines: 162
- Single function performing 4 distinct validations

#### Proposed Structure

**1.1 Create Utility Functions**
- **New File**: `apps/web/src/lib/graph-validation/degree-calculator.ts`
  ```typescript
  export function buildDegreeMap(nodes: GraphNode[], edges: GraphEdge[]): {
    inDegree: Map<string, number>;
    outDegree: Map<string, number>;
  }
  ```

**1.2 Create Individual Validators**
- **New File**: `apps/web/src/lib/graph-validation/self-cycle-validator.ts`
  - Function: `detectSelfCycles(edges: GraphEdge[]): Map<string, string[]>`
  - Logic: Slice 3.1 self-cycle detection
  
- **New File**: `apps/web/src/lib/graph-validation/node-connectivity-validator.ts`
  - Function: `validateNodeConnectivity(nodes, inDegree, outDegree): Map<string, string[]>`
  - Logic: Slice 2.1, 2.2, 2.3 (Input/Output/Step rules)
  
- **New File**: `apps/web/src/lib/graph-validation/multi-cycle-validator.ts`
  - Function: `detectMultiNodeCycles(nodes, edges): Map<string, string[]>`
  - Logic: Slice 3.2 DFS cycle detection

**1.3 Refactor Main Function**
- **Modified File**: `apps/web/src/lib/graph-validation.ts`
  - Keep main `validateGraph` as orchestrator
  - Lines: ~40 (down from 162)
  ```typescript
  export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]) {
    const { inDegree, outDegree } = buildDegreeMap(nodes, edges);
    
    const edgeErrors = new Map<string, string[]>();
    const nodeErrors = new Map<string, string[]>();
    
    // Run validators
    mergeErrors(edgeErrors, detectSelfCycles(edges));
    mergeErrors(nodeErrors, validateNodeConnectivity(nodes, inDegree, outDegree));
    mergeErrors(edgeErrors, detectMultiNodeCycles(nodes, edges));
    
    return { nodeErrors, edgeErrors };
  }
  ```

#### Test Impact

**Existing E2E Tests** (No changes required)
- `apps/web/e2e/graph-validation.spec.ts`
  - All existing tests continue to work
  - Tests validate end-to-end behavior, not internal structure
  - **Action**: Run full suite to verify no regressions

**New Unit Tests** (Optional, for future consideration)
- While we're focusing on E2E tests now, the extracted validators are unit-testable
- Could add `apps/web/src/lib/graph-validation/__tests__/` directory later

---

### Slice 2: Extract Custom Edge and Node Components

**Goal:** Separate UI components from the main graph container for better reusability and testability.

#### Current Structure
- File: [`apps/web/src/components/lineage-graph.tsx`](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/lineage-graph.tsx)
- Lines: 316
- Contains: `LineageGraph`, `CustomNode`, `CustomEdge`, inline logic

#### Proposed Structure

**2.1 Extract CustomNode**
- **New File**: `apps/web/src/components/graph/custom-node.tsx`
  - Export: `CustomNode` component (lines 26-84 from original)
  - Export: `NodeData` interface

**2.2 Extract CustomEdge**
- **New File**: `apps/web/src/components/graph/custom-edge.tsx`
  - Export: `CustomEdge` component (lines 87-222 from original)
  - Import from new edge-path utility

**2.3 Create Edge Path Utility**
- **New File**: `apps/web/src/lib/edge-path-utils.ts`
  ```typescript
  export interface EdgePathParams {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
    isSelfLoop?: boolean;
  }
  
  export interface PathResult {
    path: string;
    labelX: number;
    labelY: number;
  }
  
  export function calculateEdgePath(params: EdgePathParams): PathResult {
    // Self-loop logic
    // Backward horizontal logic
    // Default smoothstep
  }
  ```

**2.4 Simplify Main Component**
- **Modified File**: `apps/web/src/components/lineage-graph.tsx`
  - Lines: ~90 (down from 316)
  - Imports: `CustomNode`, `CustomEdge`
  - Remove: Inline component definitions
  - Remove: Commented code (lines 102-127)

#### Test Impact

**Existing E2E Tests** (No changes required)
- `apps/web/e2e/graph-validation.spec.ts`
  - All tests continue to work (component extraction is internal refactoring)
  - Visual rendering behavior unchanged
  - **Action**: Run full suite to verify edge styling and tooltips

**Potential New E2E Tests** (Future enhancement)
- Could add specific tests for edge path rendering:
  - Test backward horizontal edges render with arch
  - Test self-loops render correctly
  - Test tooltip positioning on different edge types
- **Action for now**: Skip (existing tests already verify visual output via screenshots)

---

### Slice 3: Extract ReactFlow Mapper

**Goal:** Separate domain-to-UI mapping logic from the wizard orchestration.

#### Current Structure
- File: [`apps/web/src/hooks/use-csv-import-wizard.ts`](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/hooks/use-csv-import-wizard.ts)
- Lines: 241
- `handleFinalImport` contains inline mapping logic (lines 166-186)

#### Proposed Structure

**3.1 Create ReactFlow Mapper**
- **New File**: `apps/web/src/lib/reactflow-mapper.ts`
  ```typescript
  import type { Node, Edge } from "reactflow";
  import type { GraphNode, GraphEdge } from "./csv-graph-importer";
  
  export interface ValidationResults {
    nodeErrors: Map<string, string[]>;
    edgeErrors: Map<string, string[]>;
  }
  
  export function mapToReactFlow(
    nodes: GraphNode[],
    edges: GraphEdge[],
    validation: ValidationResults
  ): { nodes: Node[]; edges: Edge[] } {
    // Mapping logic from lines 166-186
  }
  ```

**3.2 Simplify Hook**
- **Modified File**: `apps/web/src/hooks/use-csv-import-wizard.ts`
  - Lines: ~220 (down from 241)
  - Replace inline mapping with:
    ```typescript
    const validation = validateGraph(result.nodes, result.edges);
    const { nodes, edges } = mapToReactFlow(result.nodes, result.edges, validation);
    onImport(nodes, edges);
    ```

#### Test Impact

**Existing E2E Tests** (No changes required)
- `apps/web/e2e/graph-validation.spec.ts`
  - All tests continue to work
  - Import flow unchanged from user perspective
  - **Action**: Run full suite to verify import workflow

---

## Implementation Order

1. **Slice 2** (Component Extraction) - Lowest risk, purely structural
2. **Slice 3** (Mapper Extraction) - Medium risk, straightforward refactoring
3. **Slice 1** (Validation Strategies) - Highest complexity, most lines changed

## Verification Strategy

### After Each Slice
1. Run full E2E test suite: `npm test e2e/graph-validation.spec.ts`
2. Verify all tests pass (currently 6 tests across all slices)
3. Manual smoke test with complex fixture (`nodes_complex.csv`, `edges_complex.csv`)

### Final Verification
1. Run all E2E tests across the application
2. Visual inspection with multiple fixture sets
3. Commit with message: `refactor: improve graph validation architecture`

## Test Summary

| Test File | Tests Affected | Changes Required | New Tests |
|-----------|----------------|------------------|-----------|
| `graph-validation.spec.ts` | All 6 tests | None (run verification only) | 0 |

**Total Test Changes**: 0 test modifications, 0 new tests required

> **Note**: The refactoring maintains existing E2E test coverage. All changes are internal and preserve public interfaces. Future enhancements could add focused E2E tests for edge rendering variations, but current screenshot-based tests already verify visual correctness.

