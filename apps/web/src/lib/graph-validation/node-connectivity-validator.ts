import type { GraphNode } from "../csv-graph-importer";

export function validateNodeConnectivity(
    nodes: GraphNode[],
    inDegree: Map<string, number>,
    outDegree: Map<string, number>
): Map<string, string[]> {
    const nodeErrors = new Map<string, string[]>();

    nodes.forEach(node => {
        const inDeg = inDegree.get(node.id) || 0;
        const outDeg = outDegree.get(node.id) || 0;
        const currentErrors = nodeErrors.get(node.id) || [];

        if (node.type === 'INPUT') {
            // Slice 2.1: Input Node Rules
            // Must have 0 incoming AND > 0 outgoing
            if (inDeg > 0 || outDeg === 0) {
                currentErrors.push("Input node must have at least one outgoing connection and no incoming connections");
            }
        } else if (node.type === 'OUTPUT') {
            // Slice 2.2: Output Node Rules
            // Must have > 0 incoming AND 0 outgoing
            if (inDeg === 0 || outDeg > 0) {
                currentErrors.push("Output node must have at least one incoming connection and no outgoing connections");
            }
        } else if (node.type === 'STEP') {
            // Slice 2.3: Step Node Rules
            // Must have > 0 incoming AND > 0 outgoing
            if (inDeg === 0 || outDeg === 0) {
                currentErrors.push("Step node must have at least one incoming connection and at least one outgoing connection");
            }
        }

        if (currentErrors.length > 0) {
            nodeErrors.set(node.id, currentErrors);
        }
    });

    return nodeErrors;
}
