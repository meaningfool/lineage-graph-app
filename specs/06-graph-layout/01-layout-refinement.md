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

**1. Chain Flow**: `Input → Step1 → Step2 → Output`
```csv
# nodes.csv: Input, Step1, Step2, Output
# edges.csv: Input→Step1, Step1→Step2, Step2→Output
```
- Expect: `Output.x < Step1.x < Step2.x < Input.x`
- Layers: 4

**2. Convergent Flow (Longest Path)**
```csv
# Input1 → StepA → StepB → Output1
# Input2 → StepB → Output1
```
- Expect: `StepB` at Layer 2 (longest path from Input1)
- Expect: `Output1.x < StepB.x < StepA.x < Input1.x` (visual left to right)
- Expect: `Output1.x < StepB.x < Input2.x` (visual left to right)
- Layers: 4

**3. Divergent Flow**
```csv
# Input1 → StepA → StepB → Output1
#              ↓
#           Output2
```
- Expect: Both Output1 and Output2 at Layer 0 (leftmost layer)
- Expect: `Output1.x < StepB.x < StepA.x < Input1.x`
- Expect: `Output2.x < StepA.x < Input1.x`
- Layers: 4

### Implementation
- `computeMaxLayers(nodes, edges)`: Use undirected BFS/DFS to find longest path
- `assignLayers(nodes, maxLayers)`:
  - OUTPUTs → Layer 0
  - INPUTs → Layer maxLayers
  - STEPs → Use longest undirected path from any OUTPUT/INPUT to determine layer
    - For each STEP, calculate distance from nearest OUTPUT and INPUT
    - Position proportionally between Layer 0 and Layer max

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
# Input1 → S1 → S2 → S3 → S4 ← Output1 (backward!)
# (invalid: source=Output1, target=S4 violates OUTPUT rule)
```
- Expect: Still renders, 6 layers total (undirected counting)
- Expect: `Output1` at Layer 0 (leftmost), `Input1` at Layer 5 (rightmost)
- S1, S2, S3, S4 distributed in middle Layers 1-4

**2. Orphaned Chain (Missing OUTPUT)**
```csv
# Component with valid flow:   Input1 → S1 → S2 → Output1 (4 nodes)
# Component with orphaned end: Input2 → T1 → T2 → T3 (4 nodes, no OUTPUT!)
```
**What's invalid**: T3 has no outgoing edge to any OUTPUT node, violating flow semantics

**Expected behavior**:
- Undirected traversal: Longest chain across both components = 4 nodes
- Layers allocated: 4 (Output at L0, Steps at L1-L2, Input at L3)
- **Valid component**: Output1(L0) ← S2(L1) ← S1(L2) ← Input1(L3)
- **Orphaned component**: 
  - Output1 positioned at L0 (type-based, even though not connected)
  - T3, T2, T1 positioned at L1, L2, L3 based on distance from Input2
  - T3 ends up in middle layer (no OUTPUT to connect to)
- Both components visible and properly spaced

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
```csv
# Input → StepA → StepB → Output
#         StepA ← StepB (creates cycle)
```
- Expect: 4 layers, both StepA and StepB in middle (Layers 1-2)
- Cycle doesn't increase layer count (undirected traversal detects and breaks it)

**3. Cycle of Length 3**
```csv
# Input → StepA → StepB → StepC → Output
# StepA → StepB (already exists)
# StepB → StepC (already exists)  
# StepC → StepA (creates 3-node cycle)
```
- Expect: 5 layers total (Output-L0, StepA/B/C in L1-L3, Input-L4)
- Cycle (StepA ↔ StepB ↔ StepC) doesn't increase layer count
- Undirected traversal detects cycle and prevents infinite loop

### Implementation
- Track visited nodes during undirected traversal to avoid infinite loops
- Cycles don't add to path length (already counted)

---

---

## Notes on Disconnected Components

The algorithm naturally handles disconnected components via undirected traversal:
- Each component is traversed independently
- Max layers = longest component across all components
- All OUTPUTs go to Layer 0, all INPUTs to Layer max
- ReactFlow handles vertical spacing automatically

**No special test needed** - existing tests with single components are sufficient.

---

## Verification
- Run `npx playwright test e2e/graph-layout.spec.ts`
- Visual check via "Import CSV" feature with test fixtures
- Ensure no crashes on invalid graphs

