import { GraphNode, GraphEdge } from "./csv-graph-importer";

/**
 * Validates the graph structure and returns a map of errors for each node.
 * 
 * @param nodes List of nodes in the graph
 * @param edges List of edges in the graph
 * @returns Map<NodeId, ErrorMessages[]>
 */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
    const errors = new Map<string, string[]>();

    // 1. Build Degree Map
    const degreeMap = new Map<string, number>();

    // Initialize degrees
    nodes.forEach(node => {
        degreeMap.set(node.id, 0);
    });

    // Calculate degrees
    edges.forEach(edge => {
        const sourceDegree = degreeMap.get(edge.source) || 0;
        const targetDegree = degreeMap.get(edge.target) || 0;

        degreeMap.set(edge.source, sourceDegree + 1);
        degreeMap.set(edge.target, targetDegree + 1);
    });

    // 2. Check for Orphans
    nodes.forEach(node => {
        const degree = degreeMap.get(node.id) || 0;

        if (degree === 0) {
            const nodeErrors = errors.get(node.id) || [];
            nodeErrors.push("Orphan node: No connections found");
            errors.set(node.id, nodeErrors);
        }
    });

    return errors;
}
