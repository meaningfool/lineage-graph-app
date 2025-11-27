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

**Why?** This allows us to treat "backward" edges as part of the valid flow for layering purposes, effectively "unwinding" them visually.

## The Algorithm: Single Pass + Post-Processing

We assign layers in a single upstream pass, anchored to "Sinks", followed by a strict enforcement of Input placement.

### 1. Identify Sinks
In the **Flow Graph**, identify nodes that act as sinks (destinations):
- **OUTPUT Nodes**: Always Sinks. **Base Layer = 0**.
- **Dead-end STEP Nodes**: Step nodes with **no outgoing edges** in the Flow Graph. **Base Layer = 1**.
- **INPUT Nodes**: **NEVER** treated as sinks for traversal (even if they have no outgoing edges). They are handled in Post-Processing.

### 2. Single Pass Traversal (Upstream)
**Goal**: Layer all nodes reachable upstream from a Sink.
**Traversal**: **Target -> Source** (Incoming Edges in Flow Graph).
**Logic**:
- Start BFS/DFS from all identified Sinks.
- `Layer = BaseLayer + Distance`.
- **Example**: `StepA -> StepB -> Output`.
  - Output (Sink): L0.
  - StepB: L1.
  - StepA: L2.

### 3. Post-Processing: Input Alignment
**Goal**: Ensure all Inputs are at the far right, regardless of connectivity.
**Logic**:
- Determine `GlobalMaxLayer` (the highest layer assigned during traversal).
- **Force ALL INPUT Nodes** to `GlobalMaxLayer` (or `GlobalMaxLayer + 1` if distinct separation is desired).
- If an Input was already layered (e.g., `Input -> Output`), move it to Max.
- If an Input was unlayered (e.g., `Input1 -> Input2`), assign it to Max.

**Result**:
- `Input1 -> Input2`: Both forced to Layer Max.
- `Input -> Step`: Step at L1, Input moved to Max.
- `Step -> Step` (Island): Sink Step at L1, upstream Step at L2.

## Summary of Logic

| Step | Action | Direction | Rule |
| :--- | :--- | :--- | :--- |
| **1** | **Identify Sinks** | N/A | Output=0, Dead-end Step=1. Inputs ignored. |
| **2** | **Traverse** | **Target -> Source** (Upstream) | `Layer = Base + Dist` |
| **3** | **Post-Process** | N/A | **All Inputs = GlobalMaxLayer** |

> [!WARNING]
> When implementing, ensure you use the **Flow Graph** (with reversed invalid edges) for the traversal.
