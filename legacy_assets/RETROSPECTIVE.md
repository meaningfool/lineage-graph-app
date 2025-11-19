# Retrospective: Architecture & Lessons Learned

## Architecture: Visuals vs. Logic

One of the key architectural patterns that emerged was the clear separation between **visual layout** and **structural logic**.

### 1. Visual Layout (Dagre)
*   **Tool:** `dagre`
*   **Purpose:** Strictly for calculating the `x` and `y` coordinates of nodes to render them nicely in ReactFlow.
*   **Usage:** We used `dagre` to generate a "Directed Acyclic Graph" layout (Left-to-Right or Top-to-Bottom). It is excellent for this visual task but lacks deep graph analysis capabilities.

### 2. Structural Logic (Graphology)
*   **Tool:** `graphology`
*   **Purpose:** For deep analysis of the graph structure, validation, and traversal.
*   **Why we added it:** We needed robust abstractions that Dagre didn't provide.
*   **Key Abstractions Used:**
    *   **`DirectedGraph`**: The core data structure to model the lineage relationships.
    *   **`hasCycle`**: Crucial for validating that the lineage is acyclic (a requirement for data lineage).
    *   **`bfsFromNode` (Breadth-First Search)**: Used to traverse the graph to find all upstream dependencies (sources) or downstream impacts (consumers) of a specific node.
    *   **`subgraph`**: Used to extract a focused portion of the graph (e.g., "show me only the lineage related to this specific metric").

**Lesson:** Keep using this separation. Use Dagre for the "View" and Graphology for the "Model/Logic". Do not try to force Dagre to do logic, and do not try to use Graphology for layout (unless you use a layout plugin).
