# Graph Layout Refinement Plan

## Goal
Implement a custom "Longest Path Layering" algorithm to improve the visualization of the lineage graph. The layout should place Output nodes on the left (Layer 0), Input nodes on the right (Final Layer), and Step nodes in intermediate layers.

## Core Algorithm Principles

### 1. Node Type Determines Absolute Position
- **OUTPUT nodes**: Always Layer 0 (leftmost)
- **INPUT nodes**: Always Layer max (rightmost)
- **STEP nodes**: Intermediate layers (1 to max-1)

### 2. Edges Treated as Undirected for Layer Calculation
**Critical Decision**: To handle invalid graphs (backward edges, orphaned nodes), we treat edges as **undirected** when calculating longest paths and total layers needed.

**Why**: 
- Graphs with validation errors still need to render
- Backward edges would break layer calculation if treated directionally
- Ensures we always have enough layers for all nodes in a chain

### 3. Implementation Strategy
```typescript
// 1. Calculate max layers (undirected traversal)
maxLayers = longestUndirectedPath(allNodes, allEdges);

// 2. Position nodes by type
OUTPUTs → Layer 0
INPUTs → Layer maxLayers
STEPs → Distributed across Layers 1 to (maxLayers-1)
```

---

## Strategy: E2E-Driven TDD
We will implement this feature in strict "vertical slices," driven by E2E tests. For each slice:
1. **Define the Test**: Create an E2E test case with specific CSV data (Nodes/Edges) and expected visual assertions
2. **Verify Failure (Red)**: Run the test to confirm it fails with the current Dagre layout
3. **Implement Logic (Green)**: Implement the minimum necessary logic in `graph-layout-utils.ts`
4. **Refactor**: Clean up and optimize

---

## Slice 1: Basic Flows (Valid Graphs)

**Goal**: Correctly layer simple, valid acyclic flows.

### Test Cases (CSV)

**1. Chain Flow**: `Output → Step1 → Step2 → Input`
```csv
# nodes.csv: Output, Step1, Step2, Input
# edges.csv: Output→Step1, Step1→Step2, Step2→Input
```
- Expect: `Output.x < Step1.x < Step2.x < Input.x`
- Layers: 4

**2. Convergent Flow (Longest Path)**
```csv
# Output1 → StepA → StepB → Input
# Output2 → StepB
```
- Expect: `StepB` at Layer 2 (longest path from Output1)
- Expect: `Output1.x < StepA.x < StepB.x < Input.x`
- Layers: 4

**3. Divergent Flow**
```csv
# Output → StepA → StepB → Input1
#              ↓
#             Input2
```
- Expect: Both Input1 and Input2 at Layer 3 (final layer)
- Layers: 4

### Implementation
- `computeMaxLayers(nodes, edges)`: Use undirected BFS/DFS to find longest path
- `assignLayers(nodes, maxLayers)`:
  - OUTPUTs → Layer 0
  - INPUTs → Layer maxLayers
  - STEPs → TBD (simple distribution for now)

---

## Slice 2: Invalid Graphs (Edge Direction Violations)

**Goal**: Handle graphs with edges that violate data flow semantics.

**Edge Direction Semantics**:
- **Data Flow**: INPUT → STEP → OUTPUT (data originates at INPUT, ends at OUTPUT)
- **Valid edges**: 
  - `source=INPUT, target=STEP` ✅
  - `source=STEP, target=OUTPUT` ✅
  - `source=STEP, target=STEP` ✅
- **Invalid edges** (violate flow):
  - `source=OUTPUT, target=*` (OUTPUT can't be source)
  - `source=*, target=INPUT` (INPUT can't be target)

### Test Cases (CSV)

**1. Invalid Source Direction**
```csv
# Output1 → S1 → S2 → S3 → S4 → Input1
# (invalid: source=Output1, target=S1 violates OUTPUT rule)
```
- Expect: Still renders, 6 layers total
- Expect: `Output1` at Layer 0, `Input1` at Layer 5
- S1, S2, S3, S4 distributed in Layers 1-4

**2. Complex Divergent with Invalid Edge**
```csv
# Valid branch:   Input1 → S1 → S2 → Output1
# Invalid branch: Input2 → T2 → T3 → T4 → T5 (no OUTPUT!)
#                 (T5 → Input2 would be invalid target)
```
- Total nodes in longest chain: 7
- Expect: 7 layers allocated
- Expect: Valid branch fits appropriately
- Expect: Invalid branch handled gracefully

### Implementation
- **Undirected traversal**: Treat all edges as bidirectional for layer counting
- **Orphan handling**: Nodes not reachable via valid edges get placed in middle layers
- **Type-based guarantee**: OUTPUTs always Layer 0, INPUTs always Layer max

---

## Slice 3: Cycles (Self-Loops & Feedback)

**Goal**: Prevent infinite recursion when cycles exist.

### Test Cases (CSV)

**1. Self-Cycle**: `StepA → StepA`
- Expect: Render without crash
- StepA positioned in middle layer

**2. Feedback Loop**: `StepA ↔ StepB`
- Expect: Both positioned in middle layers

**3. Cycle in Valid Flow**
```csv
# Output → StepA ↔ StepB → Input
```
- Expect: 4 layers (Output, StepA, StepB, Input)
- Cycle doesn't affect layer count

### Implementation
- Track visited nodes during undirected traversal to avoid infinite loops
- Cycles don't add to path length (already counted)

---

## Slice 4: Disconnected Components

**Goal**: Handle graphs with multiple disconnected subgraphs.

### Test Cases (CSV)

**1. Two Isolated Flows**
```csv
# Component 1: Output1 → Input1
# Component 2: Output2 → Step → Input2
```
- Expect: Max layers = 3 (from Component 2)
- Both components visible, likely stacked vertically

### Implementation
- Find connected components (undirected)
- Max layers = longest component
- Components positioned independently (ReactFlow handles vertical spacing)

---

## Verification
- Run `npx playwright test e2e/graph-layout.spec.ts`
- Visual check via "Import CSV" feature with test fixtures
- Ensure no crashes on invalid graphs

