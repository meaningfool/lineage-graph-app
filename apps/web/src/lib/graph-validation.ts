import type { GraphNode, GraphEdge } from "./csv-graph-importer";

/**
 * Validates the graph structure and returns a map of errors for each node.
 * 
 * @param nodes List of nodes in the graph
 * @param edges List of edges in the graph
 * @returns Map<NodeId, ErrorMessages[]>
 */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): { nodeErrors: Map<string, string[]>, edgeErrors: Map<string, string[]> } {
    const nodeErrors = new Map<string, string[]>();
    const edgeErrors = new Map<string, string[]>();

    // 1. Build Degree Maps
    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();

    // Initialize degrees
    nodes.forEach(node => {
        inDegreeMap.set(node.id, 0);
        outDegreeMap.set(node.id, 0);
    });

    // Calculate degrees & Detect Self-Cycles (Slice 3.1)
    edges.forEach(edge => {
        outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
        inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);

        // Slice 3.1: Self-Cycle Detection
        if (edge.source === edge.target) {
            const edgeKey = `${edge.source}-${edge.target}`;
            const currentErrors = edgeErrors.get(edgeKey) || [];
            currentErrors.push("Cycle detected: Node connects to itself");
            edgeErrors.set(edgeKey, currentErrors);
        }
    });

    // 2. Validate Nodes
    nodes.forEach(node => {
        const inDegree = inDegreeMap.get(node.id) || 0;
        const outDegree = outDegreeMap.get(node.id) || 0;
        const currentErrors = nodeErrors.get(node.id) || [];

        if (node.type === 'INPUT') {
            // Slice 2.1: Input Node Rules
            // Must have 0 incoming AND > 0 outgoing
            if (inDegree > 0 || outDegree === 0) {
                currentErrors.push("Input node must have at least one outgoing connection and no incoming connections");
            }
        } else if (node.type === 'OUTPUT') {
            // Slice 2.2: Output Node Rules
            // Must have > 0 incoming AND 0 outgoing
            if (inDegree === 0 || outDegree > 0) {
                currentErrors.push("Output node must have at least one incoming connection and no outgoing connections");
            }
        } else if (node.type === 'STEP') {
            // Slice 2.3: Step Node Rules
            // Must have > 0 incoming AND > 0 outgoing
            if (inDegree === 0 || outDegree === 0) {
                currentErrors.push("Step node must have at least one incoming connection and at least one outgoing connection");
            }
        }

        if (currentErrors.length > 0) {
            nodeErrors.set(node.id, currentErrors);
        }
    });

    // 3. Detect Multi-Node Cycles (Slice 3.2)
    // We use DFS to find back-edges.
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function detectCycleDFS(nodeId: string, path: string[]) {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        // Find outgoing edges from this node
        const outgoingEdges = edges.filter(e => e.source === nodeId);

        for (const edge of outgoingEdges) {
            const neighbor = edge.target;

            if (!visited.has(neighbor)) {
                detectCycleDFS(neighbor, [...path]);
            } else if (recursionStack.has(neighbor)) {
                // Cycle Detected!
                // The edge from nodeId -> neighbor closes the cycle.
                // We want to mark ALL edges in the cycle.
                // The cycle path is: neighbor -> ... -> nodeId -> neighbor

                // Find the index of neighbor in the current path
                const cycleStartIndex = path.indexOf(neighbor);
                if (cycleStartIndex !== -1) {
                    const cycleNodes = path.slice(cycleStartIndex);

                    // Mark edges connecting these nodes
                    for (let i = 0; i < cycleNodes.length; i++) {
                        const source = cycleNodes[i];
                        const target = cycleNodes[(i + 1) % cycleNodes.length] || neighbor; // Wrap around to neighbor for the last segment? 
                        // Wait, cycleNodes is [B, C, A]. 
                        // Edges are B->C, C->A. 
                        // And the current edge is A->neighbor (which is B).
                        // So we need to mark B->C, C->A, and A->B.

                        // Let's iterate through the cycle nodes and mark edges between them.
                        // The last edge is current edge (nodeId -> neighbor).
                    }

                    // Simpler: Just mark the back-edge and let the user trace it?
                    // Spec says "All edges in the cycle".

                    // Let's mark the back-edge first (nodeId -> neighbor)
                    const backEdgeKey = `${nodeId}-${neighbor}`;
                    const backErrors = edgeErrors.get(backEdgeKey) || [];
                    if (!backErrors.includes("Cycle detected")) {
                        backErrors.push("Cycle detected");
                        edgeErrors.set(backEdgeKey, backErrors);
                    }

                    // Now mark the rest of the path from neighbor to nodeId
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

                    // Also mark the last node in cycleNodes to the current node?
                    // cycleNodes contains the path from neighbor to current node (inclusive).
                    // So we need edges:
                    // cycleNodes[0] -> cycleNodes[1]
                    // ...
                    // cycleNodes[last] -> neighbor (Wait, neighbor IS cycleNodes[0])
                    // No, path is [A, B, C]. neighbor is A.
                    // cycleNodes is [A, B, C].
                    // We need edges: A->B, B->C.
                    // And the current edge C->A (nodeId -> neighbor).

                    // So loop i from 0 to length-2 to get A->B, B->C.
                    // Then add C->A (which is the back edge we already handled).
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

    return { nodeErrors, edgeErrors };
}
