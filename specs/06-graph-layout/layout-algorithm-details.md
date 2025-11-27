# Graph Layout Algorithm: Multi-Pass Anchoring Strategy

> [!IMPORTANT]
> **CRITICAL CONTEXT**: This document details the custom "Longest Path Layering" algorithm used to layout the lineage graph. It specifically addresses how to handle **Invalid Graphs** (cycles, backward edges, orphans, islands) using a "Multi-Pass Anchoring" strategy.
>
> **Confusion Warning**: Be extremely careful with **Traversal Direction**.
> - **Global Flow**: Right to Left (`Input` at Right, `Output` at Left).
> - **Graph Edges**: `Source -> Target`.
> - **Traversal**: Sometimes we follow edges (`Source -> Target`), sometimes we go upstream (`Target -> Source`). Read carefully!

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

## Core Rule: Type Priority

Before any traversal, we enforce strict layer assignments based on node type:
- **OUTPUT Nodes**: Always **Layer 0**.
- **INPUT Nodes**: Always **Layer Max**.

This rule overrides any traversal logic. For example:
- `Input1 -> Input2`: Both are assigned Layer Max. They share the same layer.
- `Output1 -> Output2`: Both are assigned Layer 0. They share the same layer.

## The Algorithm: Multi-Pass Anchoring

We assign layers in 3 passes, anchoring nodes to the most significant fixed point available (`Output` > `Input` > `Sink`).

### Pass 1: Anchor to OUTPUT (Layer 0)

**Goal**: Layer all nodes reachable from an OUTPUT.
**Anchor**: OUTPUT nodes are fixed at **Layer 0**.
**Traversal**: **Target -> Source** (Incoming Edges in Flow Graph).
**Logic**:
- Start BFS/DFS from all OUTPUT nodes.
- Follow *incoming* edges upstream.
- `Layer = distance` (from Output).
- **Example**: `Output <- StepB <- StepA`.
  - Output: 0. StepB: 1. StepA: 2.
  - Visually: `StepA (L2) -> StepB (L1) -> Output (L0)`.

### Pass 2: Anchor to INPUT (Layer Max)

**Goal**: Layer remaining nodes reachable from an INPUT (e.g., Missing Output chains).
**Anchor**: INPUT nodes are fixed at **Layer Max** (e.g., 5).
**Traversal**: **Source -> Target** (Outgoing Edges in Flow Graph).
**Logic**:
- Start BFS/DFS from all INPUT nodes.
- Follow *outgoing* edges downstream.
- `Layer = maxLayers - 1 - distance` (from Input).
- **Example**: `Input -> StepA -> StepB`.
  - Input: L5. StepA: L4. StepB: L3.
  - Visually: `Input (L5) -> StepA (L4) -> StepB (L3)`.

### Pass 3: Anchor Islands (Layer 1)

**Goal**: Layer remaining isolated nodes (Islands with no Input/Output).
**Anchor**: **Sinks** (nodes with out-degree 0 in the unlayered set) are fixed at **Layer 1**.
**Traversal**: **Target -> Source** (Incoming Edges in Flow Graph).
**Logic**:
- Find Sinks in the unlayered set.
- Start BFS/DFS from these Sinks.
- Follow *incoming* edges upstream.
- `Layer = 1 + distance`.
- **Example**: `StepA -> StepB -> StepC` (Island).
  - `StepC` is Sink.
  - `StepC`: L1. `StepB`: L2. `StepA`: L3.
  - Visually: `StepA (L3) -> StepB (L2) -> StepC (L1)`.
  - **Note**: This aligns the island Right-to-Left, consistent with global flow.

## Summary of Directions

| Pass | Anchor | Traversal Direction | Formula |
| :--- | :--- | :--- | :--- |
| **1** | **Output** | **Target -> Source** (Upstream) | `Layer = dist` |
| **2** | **Input** | **Source -> Target** (Downstream) | `Layer = Max - 1 - dist` |
| **3** | **Island Sink** | **Target -> Source** (Upstream) | `Layer = 1 + dist` |

> [!WARNING]
> When implementing, ensure you use the **Flow Graph** (with reversed invalid edges) for all traversals. Do not use the raw graph edges directly.
