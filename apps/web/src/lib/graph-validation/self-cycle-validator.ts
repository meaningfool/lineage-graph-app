import type { GraphEdge } from "../csv-graph-importer";

/**
 * Self-Cycle Validator
 * 
 * Purpose: Detects the simplest form of cycle: a node connecting directly to itself.
 * 
 * Rule: A node cannot have an edge where source === target.
 * 
 * @returns Map where key is "source-target" and value is list of error messages.
 */
export function detectSelfCycles(edges: GraphEdge[]): Map<string, string[]> {
    const edgeErrors = new Map<string, string[]>();

    edges.forEach(edge => {
        if (edge.source === edge.target) {
            const edgeKey = `${edge.source}-${edge.target}`;
            const currentErrors = edgeErrors.get(edgeKey) || [];
            currentErrors.push("Cycle detected: Node connects to itself");
            edgeErrors.set(edgeKey, currentErrors);
        }
    });

    return edgeErrors;
}
