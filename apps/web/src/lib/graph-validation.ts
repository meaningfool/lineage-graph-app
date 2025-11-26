import type { GraphNode, GraphEdge } from "./csv-graph-importer";
import { buildDegreeMap } from "./graph-validation/degree-calculator";
import { detectSelfCycles } from "./graph-validation/self-cycle-validator";
import { validateNodeConnectivity } from "./graph-validation/node-connectivity-validator";
import { detectMultiNodeCycles } from "./graph-validation/multi-cycle-validator";

/**
 * Validates the graph structure and returns a map of errors for each node.
 * 
 * @param nodes List of nodes in the graph
 * @param edges List of edges in the graph
 * @returns Map<NodeId, ErrorMessages[]>
 */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): { nodeErrors: Map<string, string[]>, edgeErrors: Map<string, string[]> } {
    const { inDegree, outDegree } = buildDegreeMap(nodes, edges);

    const edgeErrors = new Map<string, string[]>();
    const nodeErrors = new Map<string, string[]>();

    // Run validators
    mergeErrors(edgeErrors, detectSelfCycles(edges));
    mergeErrors(nodeErrors, validateNodeConnectivity(nodes, inDegree, outDegree));
    mergeErrors(edgeErrors, detectMultiNodeCycles(nodes, edges));

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
