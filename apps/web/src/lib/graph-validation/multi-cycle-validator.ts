import type { GraphNode, GraphEdge } from "../csv-graph-importer";

export function detectMultiNodeCycles(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
    const edgeErrors = new Map<string, string[]>();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function detectCycleDFS(nodeId: string, path: string[]) {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        // Find outgoing edges from this node (excluding self-loops)
        const outgoingEdges = edges.filter(e => e.source === nodeId && e.source !== e.target);

        for (const edge of outgoingEdges) {
            const neighbor = edge.target;

            if (!visited.has(neighbor)) {
                detectCycleDFS(neighbor, [...path]);
            } else if (recursionStack.has(neighbor)) {
                // Cycle Detected!
                // The edge from nodeId -> neighbor closes the cycle.

                // Find the index of neighbor in the current path
                const cycleStartIndex = path.indexOf(neighbor);
                if (cycleStartIndex !== -1) {
                    const cycleNodes = path.slice(cycleStartIndex);

                    // Mark edges connecting these nodes
                    // 1. Mark the back-edge (nodeId -> neighbor)
                    const backEdgeKey = `${nodeId}-${neighbor}`;
                    const backErrors = edgeErrors.get(backEdgeKey) || [];
                    if (!backErrors.includes("Cycle detected")) {
                        backErrors.push("Cycle detected");
                        edgeErrors.set(backEdgeKey, backErrors);
                    }

                    // 2. Mark the rest of the path from neighbor to nodeId
                    for (let i = 0; i < cycleNodes.length - 1; i++) {
                        const s = cycleNodes[i];
                        const t = cycleNodes[i + 1];
                        const key = `${s}-${t}`;
                        const errs = edgeErrors.get(key) || [];
                        if (!errs.includes("Cycle detected")) {
                            errs.push("Cycle detected");
                            edgeErrors.set(key, errs);
                        }
                    }
                }
            }
        }

        recursionStack.delete(nodeId);
    }

    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            detectCycleDFS(node.id, []);
        }
    });

    return edgeErrors;
}
