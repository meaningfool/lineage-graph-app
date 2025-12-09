import type { GraphNode } from "../csv-graph-importer";

/**
 * Node Connectivity Validator
 * 
 * Purpose: Enforces structural rules based on the Node Type (Input, Output, Step).
 * 
 * Rules:
 * - INPUT: Must start the flow (0 incoming, >0 outgoing).
 * - OUTPUT: Must end the flow (>0 incoming, 0 outgoing).
 * - STEP: Must be in the middle (>0 incoming, >0 outgoing).
 * 
 * This validator relies on the pre-calculated Degree Maps for efficiency.
 */
export function validateNodeConnectivity(
    nodes: GraphNode[],
    inDegree: Map<string, number>,
    outDegree: Map<string, number>
): Map<string, { message: string, relatedIds?: string[] }[]> {
    const nodeErrors = new Map<string, { message: string, relatedIds?: string[] }[]>();

    nodes.forEach(node => {
        const inDeg = inDegree.get(node.id) || 0;
        const outDeg = outDegree.get(node.id) || 0;
        const currentErrors = nodeErrors.get(node.id) || [];

        const label = node.title || node.id;

        if (node.type === 'INPUT') {
            // Slice 2.1: Input Node Rules
            // Must have 0 incoming AND > 0 outgoing
            if (inDeg > 0 || outDeg === 0) {
                currentErrors.push({ message: `${label}: Input node must have at least one outgoing connection and no incoming connections` });
            }
        } else if (node.type === 'OUTPUT') {
            // Slice 2.2: Output Node Rules
            // Must have > 0 incoming AND 0 outgoing
            if (inDeg === 0 || outDeg > 0) {
                currentErrors.push({ message: `${label}: Output node must have at least one incoming connection and no outgoing connections` });
            }
        } else if (node.type === 'STEP') {
            // Slice 2.3: Step Node Rules
            // Must have > 0 incoming AND > 0 outgoing
            if (inDeg === 0 || outDeg === 0) {
                currentErrors.push({ message: `${label}: Step node must have at least one incoming connection and at least one outgoing connection` });
            }
        }

        if (currentErrors.length > 0) {
            nodeErrors.set(node.id, currentErrors);
        }
    });

    return nodeErrors;
}
