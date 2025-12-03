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
export function detectSelfCycles(edges: GraphEdge[], nodeLabels: Map<string, string>): Map<string, string[]> {
    const edgeErrors = new Map<string, string[]>();

    edges.forEach(edge => {
        if (edge.source === edge.target) {
            const edgeKey = `${edge.source}-${edge.target}`;
            const currentErrors = edgeErrors.get(edgeKey) || [];
            const label = nodeLabels.get(edge.source) || edge.source;
            const msg = `Self-cycle: ${label} connects to itself`;
            console.log(`[SelfCycleValidator] Error: ${msg}`);
            currentErrors.push(msg);
            edgeErrors.set(edgeKey, currentErrors);
        }
    });

    return edgeErrors;
}
