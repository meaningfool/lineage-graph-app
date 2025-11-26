import type { GraphEdge } from "../csv-graph-importer";

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
