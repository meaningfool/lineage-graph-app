import type { GraphNode, GraphEdge } from "./csv-graph-importer";
import { buildDegreeMap } from "./graph-validation/degree-calculator";
import { detectSelfCycles } from "./graph-validation/self-cycle-validator";
import { validateNodeConnectivity } from "./graph-validation/node-connectivity-validator";
import { detectMultiNodeCycles } from "./graph-validation/multi-cycle-validator";

/**
 * Graph Validation Orchestrator
 * 
 * This function acts as the central hub for all graph validation logic.
 * It follows the "Strategy Pattern" where specific validation rules are 
 * encapsulated in separate validator functions.
 * 
 * Architecture:
 * 1. Pre-calculation: Expensive operations (like degree calculation) are done once.
 * 2. Composition: Independent validators are called sequentially.
 * 3. Aggregation: Errors from all validators are merged into a single result.
 * 
 * @param nodes List of nodes in the graph
 * @param edges List of edges in the graph
 * @returns Map<NodeId, ErrorMessages[]> and Map<EdgeId, ErrorMessages[]>
 */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): { nodeErrors: Map<string, string[]>, edgeErrors: Map<string, string[]> } {
    // --- 1. Pre-calculation Phase ---
    // We calculate node degrees (in-degree and out-degree) once upfront.
    // This avoids re-calculating them inside every validator that needs them.
    const { inDegree, outDegree } = buildDegreeMap(nodes, edges);

    const edgeErrors = new Map<string, string[]>();
    const nodeErrors = new Map<string, string[]>();

    // Helper to get node labels for context
    const nodeLabels = new Map(nodes.map(n => [n.id, n.title || n.id]));
    console.log("[GraphValidation] Node Labels:", Array.from(nodeLabels.entries()));

    // --- 2. Validation Phase ---
    // We run each validator independently. They don't know about each other.
    // This makes it easy to add/remove rules without breaking the pipeline.

    // Validator A: Check for edges that connect a node to itself (A -> A)
    mergeErrors(edgeErrors, detectSelfCycles(edges, nodeLabels));

    // Validator B: Check business rules for Input/Output/Step nodes
    // (e.g., "Input nodes must have no incoming edges")
    mergeErrors(nodeErrors, validateNodeConnectivity(nodes, inDegree, outDegree));

    // Validator C: Check for complex cycles involving multiple nodes (A -> B -> C -> A)
    // This uses Depth-First Search (DFS) and is more computationally expensive.
    mergeErrors(edgeErrors, detectMultiNodeCycles(nodes, edges, nodeLabels));

    return { nodeErrors, edgeErrors };
}

function mergeErrors(target: Map<string, string[]>, source: Map<string, string[]>) {
    source.forEach((errors, key) => {
        const current = target.get(key) || [];
        // Avoid duplicates
        const newErrors = errors.filter(err => !current.includes(err));
        if (newErrors.length > 0) {
            target.set(key, [...current, ...newErrors]);
        }
    });
}
