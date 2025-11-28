# Graph Layout Algorithm: Single Pass Sink-Anchored Strategy

> [!IMPORTANT]
> **CRITICAL CONTEXT**: This document details the custom "Longest Path Layering" algorithm used to layout the lineage graph. It specifically addresses how to handle **Invalid Graphs** (cycles, backward edges, orphans, islands) using a simplified "Single Pass Sink-Anchored" strategy.
>
> **Confusion Warning**: Be extremely careful with **Traversal Direction**.
> - **Global Flow**: Right to Left (`Input` at Right, `Output` at Left).
> - **Graph Edges**: `Source -> Target`.
> - **Traversal**: We primarily go **Upstream** (`Target -> Source`).

## Core Concept: Selective Reversal

To handle invalid edges that violate the data flow (e.g., `Output -> Step`), we first build a **Flow Graph** where these edges are "virtually reversed".

- **Valid Edges** (Keep as-is):
  - `Input -> Step`
  - `Step -> Step`
  - `Step -> Output`
- **Invalid Edges** (Reverse):
  - `Output -> Step`  becomes `Step -> Output`
  - `Step -> Input`   becomes `Input -> Step`
  - `Output -> Input` becomes `Input -> Output`
- **Ignored Edges** (Exclude from Flow Graph):
  - `Input -> Input`
  - `Output -> Output`
  - **Why**: These cannot be made valid by reversal and add no value to the flow hierarchy. Ignoring them prevents traversal issues.

**Why?** This allows us to treat "backward" edges as part of the valid flow for layering purposes, effectively "unwinding" them visually.

## The Algorithm: Single Pass + Max Path Tracking

We assign layers in a single upstream pass, anchored to "Sinks", with real-time tracking of the longest path.

### 0. Early Exit: Input-Only Graph
**Check**: If the graph contains **ONLY INPUT nodes** (no Outputs, no Steps):
- **Action**: Assign all nodes to **Layer 0**.
- **Stop**: Do not proceed to traversal.
- **Why**: There are no sinks to anchor to, and no flow to traverse.

### 1. Identify Sinks
In the **Flow Graph**, identify nodes that act as sinks (destinations):
- **OUTPUT Nodes**: Always Sinks. **Base Layer = 0**.
- **Dead-end STEP Nodes**: Step nodes with **no outgoing edges** in the Flow Graph. **Base Layer = 1**.
- **INPUT Nodes**: **NEVER** treated as sinks for traversal.

### 2. Single Pass Traversal (Upstream) with Tracking
**Goal**: Layer all nodes reachable upstream from a Sink AND track the global maximum depth.
**Traversal**: **Target -> Source** (Incoming Edges in Flow Graph).
**Tracking Variables**:
- `GlobalMaxDepth`: The highest layer number assigned so far.
- `NodeAtMaxDepth`: The node (or type) that sits at `GlobalMaxDepth`.
- `Visited`: Set of visited nodes in the current path (to detect cycles).

**Logic**:
- Start BFS/DFS from all identified Sinks.
- **Cycle Detection**: Maintain a `visited` set for the current recursion stack (DFS) or path. If a node is re-visited in the same path, stop traversal for that branch (break the loop).
- `Layer = BaseLayer + MAX(Distance)`.
- **Update Tracking**:
  - If `Layer > GlobalMaxDepth`:
    - `GlobalMaxDepth = Layer`
    - `NodeAtMaxDepth = CurrentNode`
  - If `Layer == GlobalMaxDepth` AND `CurrentNode` is NOT an Input:
    - `NodeAtMaxDepth = CurrentNode` (Prioritize non-inputs to force separation if conflict).

### 3. Handle Floating Cycles (Pseudo-Sinks)
**Goal**: Unroll "Floating Cycles" (isolated components with no Inputs/Outputs) that were not visited in the main traversal.
**Strategy**: Greedy Deterministic Leader.

**Logic**:
- Identify all **Unvisited Nodes** (nodes with no layer assigned).
- **Sort** unvisited nodes by ID (alphanumeric) to ensure deterministic behavior.
- **Loop** while unvisited nodes exist:
  1. Pick the **First Node** as the **Pseudo-Sink**.
  2. Assign it to **Layer 1**.
  3. Traverse Upstream from this Pseudo-Sink (using the same logic as Step 2).
  4. Update the list of unvisited nodes (remove newly visited ones).
  5. Repeat.

**Result**: A cycle `A -> B -> C -> A` (where A is lowest ID) becomes:
- `A` (Layer 1)
- `C` (Layer 2) -> `A`
- `B` (Layer 3) -> `C`
- `A` -> `B` (Back edge)

### 4. Final Input Alignment
**Goal**: Ensure strict separation for Inputs.
**Logic**:
- Determine `FinalInputLayer`:
  - If `NodeAtMaxDepth` is **INPUT**: `FinalInputLayer = GlobalMaxDepth`.
  - If `NodeAtMaxDepth` is **NOT INPUT**: `FinalInputLayer = GlobalMaxDepth + 1`.
- **Force ALL INPUT Nodes**: Assign all Input nodes to `FinalInputLayer`.

**Result**:
- `Input -> Step -> Output`:
  - Max Depth = L2 (Input). Node = Input.
  - Final Input Layer = L2.
- `Step -> Output` + `Input` (Isolated):
  - Max Depth = L1 (Step). Node = Step.
  - Final Input Layer = L1 + 1 = L2.
  - Input forced to L2. (Strict separation).

## Summary of Logic

| Step | Action | Direction | Rule |
| :--- | :--- | :--- | :--- |
| **0** | **Early Exit** | N/A | If Input-Only, All Layer 0. Stop. |
| **1** | **Identify Sinks** | N/A | Output=0, Dead-end Step=1. |
| **2** | **Traverse** | **Target -> Source** | `Layer = Base + MAX(Dist)`. Track Max. |
| **3** | **Floating Cycles** | **Target -> Source** | Pick Unvisited Leader (Min ID) -> Layer 1. Traverse. |
| **4** | **Align Inputs** | N/A | `Inputs = MaxDepth (+1 if Non-Input at Max)` |

> [!WARNING]
> When implementing, ensure you use the **Flow Graph** (with reversed invalid edges) for the traversal.
