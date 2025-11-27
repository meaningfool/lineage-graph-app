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

// 3. Add data-layer attribute for testing
node.data.layer = calculatedLayer; // ✅ Testable in Playwright
```

### 4. Testing Strategy

**Two-layer verification** to ensure both algorithm and rendering are correct:

**Layer 1: Algorithm Correctness** (via `data-layer` attribute)
- Each node gets `data-layer` attribute from algorithm
- E2E tests assert: `await node.getAttribute('data-layer')`
- Example: `expect(stepA_layer).toBe('2')`

**Layer 2: Visual Positioning** (via x-coordinates)
- Each layer translates to x-coordinate: `x = layer * LAYER_WIDTH`
- E2E tests assert: `nodeA.x < nodeB.x < nodeC.x`
- Ensures rendering matches algorithm output

**Why both?**
- `data-layer`: Tests algorithm logic (computeLayers)
- `x-coordinates`: Tests visual rendering (assignCoordinates)
- Failures indicate which layer failed

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
**Assertions**:
- Total layers: 4
- `Output.x < Step2.x < Step1.x < Input.x` (visual left to right)
- Output at Layer 0, Step2 at Layer 1, Step1 at Layer 2, Input at Layer 3

**2. Convergent Flow (Longest Path)**
```csv
# Input1 → StepA → StepB → Output1
# Input2 → StepB → Output1
```
**Assertions**:
- Total layers: 4
- StepB at Layer 2 (longest path is Input1→StepA→StepB)
- `Output1.x < StepB.x < StepA.x < Input1.x`
- `Output1.x < StepB.x < Input2.x`
- Output1 at Layer 0
- StepB at Layer 2
- StepA at Layer 1, Input2 at Layer 3
- Input1 at Layer 3

**3. Divergent Flow**
```csv
# Input1 → StepA → StepB → Output1
#              ↓
#           Output2
```
**Assertions**:
- Total layers: 4
- Both Output1 and Output2 at Layer 0 (leftmost)
- `Output1.x < StepB.x < StepA.x < Input1.x`
- `Output2.x < StepA.x < Input1.x`
- Output1 at Layer 0, Output2 at Layer 0
- StepB at Layer 1, StepA at Layer 2
- Input1 at Layer 3

### Implementation
- `computeMaxLayers(nodes, edges)`: Use undirected BFS/DFS to find longest path
- `assignLayers(nodes, maxLayers)`:
  - OUTPUTs → Layer 0
  - INPUTs → Layer maxLayers
  - STEPs → Use longest undirected path from any OUTPUT/INPUT to determine layer
    - For each STEP, calculate distance from nearest OUTPUT and INPUT
    - Position proportionally between Layer 0 and Layer max
  - **Add `data-layer` attribute**: `node.data.layer = calculatedLayer` (for E2E testing)
- `assignCoordinates(nodes)`:
  - Convert layer to x-coordinate: `x = layer * LAYER_WIDTH`
  - Y-coordinate: Simple vertical stacking within layer

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
 **Assertions**:
 - Total layers: 6
 - `Output1.x < S4.x < S3.x < S2.x < S1.x < Input1.x`
 - Output1 at Layer 0, Input1 at Layer 5
 - S4 at Layer 1 (anchored to Output1)
 
 **2. Missing Output (Input Chain)**
 ```csv
 # Input1 → StepA → StepB
 ```
 **Assertions**:
 - Total layers: 3
 - `StepB.x < StepA.x < Input1.x`
 - Input1 at Layer 2 (Max), StepA at Layer 1, StepB at Layer 0
 - Anchored to Input (Right)
 
 **3. Missing Input (Output Chain)**
 ```csv
 # StepA → StepB → Output1
 ```
 **Assertions**:
 - Total layers: 3
 - `Output1.x < StepB.x < StepA.x`
 - Output1 at Layer 0, StepB at Layer 1, StepA at Layer 2
 - Anchored to Output (Left)
 
 **4. Isolated Chain (No Input, No Output)**
 ```csv
 # StepA → StepB → StepC
 ```
 **Assertions**:
 - Total layers: 3
 - `StepC.x < StepB.x < StepA.x`
 - StepC (Sink) at Layer 1, StepB at Layer 2, StepA (Source) at Layer 3
 - Anchored to Sink (Left), Flow Right -> Left
 
 **5. Mixed: Valid Chain + Missing Output**
 ```csv
 # Valid: Input1 → S1 → S2 → S3 → S4 → Output1 (Length 5 edges, 6 nodes)
 # Invalid: Input2 → T1 → T2 (Missing Output)
 ```
 **Assertions**:
 - Total layers: 6 (defined by valid chain)
 - **Valid Chain**: Output1 (L0) ... Input1 (L5)
 - **Invalid Chain**: 
   - Input2 at Layer 5 (Global Max, Right-aligned)
   - T1 at Layer 4, T2 at Layer 3
   - `T2.x < T1.x < Input2.x`
   - T2 ends at Layer 3 (Middle), not Layer 0
 
 **6. Mixed: Valid Chain + Missing Input**
 ```csv
 # Valid: Input1 → S1 → S2 → S3 → S4 → Output1
 # Invalid: T1 → T2 → Output2 (Missing Input)
 ```
 **Assertions**:
 - Total layers: 6
 - **Valid Chain**: Output1 (L0) ... Input1 (L5)
 - **Invalid Chain**:
   - Output2 at Layer 0 (Global Min, Left-aligned)
   - T2 at Layer 1, T1 at Layer 2
   - `Output2.x < T2.x < T1.x`
   - T1 starts at Layer 2, not Layer 5
 
 **7. Mixed: Valid Chain + Isolated Chain**
 ```csv
 # Valid: Input1 → S1 → S2 → S3 → S4 → Output1
 # Invalid: T1 → T2 → T3 (Isolated)
 ```
 **Assertions**:
 - Total layers: 6
 - **Valid Chain**: Output1 (L0) ... Input1 (L5)
 - **Invalid Chain**:
   - **Constraint**: Steps cannot be at Layer 0 (Output) or Layer 5 (Input).
   - **Flow**: Right to Left (T1 -> T2 -> T3).
   - T3 (Sink) at Layer 1 (Closest to Output).
```
   - T2 at Layer 2.
   - T1 (Source) at Layer 3.
   - `T3.x < T2.x < T1.x`
   - Chain is centered/left-aligned within the valid step layers (1-4).
 
 **8. Input-Input Connection**
 ```csv
 # Input1 → Input2
 ```
 **Assertions**:
 - Total layers: 2 (min layers for visibility, or just 1 if allowed)
 - `Input1.x == Input2.x` (Same Layer)
 - Both at Layer Max (Input Layer).
 
 **9. Output-Output Connection**
 ```csv
 # Output1 → Output2
 ```
 **Assertions**:
 - Total layers: 2
 - `Output1.x == Output2.x` (Same Layer)
 - Both at Layer 0 (Output Layer).

 **10. Input-Only Graph**
 ```csv
 # Input1, Input2 (No edges or disconnected)
 ```
 **Assertions**:
 - Total layers: 1
 - `Input1.x == Input2.x` (Same Layer)
 - Both at Layer 0 (Default for Input-Only).
 
 ### Implementation
  
 See [layout-algorithm-details.md](./layout-algorithm-details.md) for the detailed **Single Pass Sink-Anchored** strategy and **Selective Reversal** logic.

---

## Slice 3: Cycles (Self-Loops & Feedback)

**Goal**: Prevent infinite recursion when cycles exist.

### Test Cases (CSV)

**1. Self-Cycle**: `StepA → StepA`
**Assertions**:
- Graph renders without crash
- StepA positioned in middle layer (not Layer 0 or max)
- Self-loop edge visible

**2. Feedback Loop**: `StepA ↔ StepB`
```csv
# Input → StepA → StepB → Output
#         StepA ← StepB (creates cycle)
```
**Assertions**:
- Total layers: 4
- StepA at Layer 2, StepB at Layer 1 (or both in Layers 1-2)
- `Output.x < StepB.x < StepA.x < Input.x`
- Cycle doesn't increase layer count beyond undirected path length

**3. Cycle of Length 3 with Convergent Path**
```csv
# Input → StepA → StepB → StepC → Output1
# Output2 → StepA (convergent path - Output2 connects directly to StepA)
# StepA → StepB (already exists)
# StepB → StepC (already exists)  
# StepC → StepA (creates 3-node cycle)
```
**Assertions**:
- Total layers: 5
- Output1 at Layer 0, Output2 at Layer 0
- StepC at Layer 1, StepB at Layer 2, StepA at Layer 3
- Input at Layer 4
- `Output1.x < StepC.x < StepB.x < StepA.x < Input.x`
- `Output2.x < StepA.x` (convergent path)
- Cycle (StepA ↔ StepB ↔ StepC) doesn't increase layer count
- Both outputs share Layer 0

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

