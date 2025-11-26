import type { GraphNode, GraphEdge } from "./csv-graph-importer";

/**
 * Validates the graph structure and returns a map of errors for each node.
 * 
 * @param nodes List of nodes in the graph
 * @param edges List of edges in the graph
 * @returns Map<NodeId, ErrorMessages[]>
 */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
    const errors = new Map<string, string[]>();

    // 1. Build Degree Maps
    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();

    // Initialize degrees
    nodes.forEach(node => {
        inDegreeMap.set(node.id, 0);
        outDegreeMap.set(node.id, 0);
    });

    // Calculate degrees
    edges.forEach(edge => {
        outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
        inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
    });

    // 2. Validate Nodes
    nodes.forEach(node => {
        const inDegree = inDegreeMap.get(node.id) || 0;
        const outDegree = outDegreeMap.get(node.id) || 0;
        const nodeErrors = errors.get(node.id) || [];

        if (node.type === 'INPUT') {
            // Slice 2.1: Input Node Rules
            // Must have 0 incoming AND > 0 outgoing
            if (inDegree > 0 || outDegree === 0) {
                nodeErrors.push("Input node must have at least one outgoing connection and no incoming connections");
            }
        } else if (node.type === 'OUTPUT') {
            // Slice 2.2: Output Node Rules
            // Must have > 0 incoming AND 0 outgoing
            if (inDegree === 0 || outDegree > 0) {
                nodeErrors.push("Output node must have at least one incoming connection and no outgoing connections");
            }
        } else if (node.type === 'STEP') {
            // Slice 2.3: Step Node Rules
            // Must have > 0 incoming AND > 0 outgoing
            if (inDegree === 0 || outDegree === 0) {
                nodeErrors.push("Step node must have at least one incoming connection and at least one outgoing connection");
            }
        }

        if (nodeErrors.length > 0) {
            errors.set(node.id, nodeErrors);
        }
    });

    return errors;
}
