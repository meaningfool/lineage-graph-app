import type { GraphEdge, GraphNode } from "../csv-graph-importer";

/**
 * Multi-Node Cycle Validator
 *
 * Purpose: Detects complex cycles involving 2 or more nodes (e.g., A -> B -> C -> A).
 *
 * Algorithm: Depth-First Search (DFS)
 * - We traverse the graph recursively.
 * - We track the current "recursion stack" (path we are currently exploring).
 * - If we encounter a node that is already in the recursion stack, we found a cycle.
 *
 * Note: We explicitly exclude self-loops here because they are handled by the
 * cheaper `detectSelfCycles` validator.
 */
export function detectMultiNodeCycles(
	nodes: GraphNode[],
	edges: GraphEdge[],
	nodeLabels: Map<string, string>,
): Map<string, { message: string; relatedIds?: string[] }[]> {
	const edgeErrors = new Map<
		string,
		{ message: string; relatedIds?: string[] }[]
	>();
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function detectCycleDFS(nodeId: string, path: string[]) {
		visited.add(nodeId);
		recursionStack.add(nodeId);
		path.push(nodeId);

		// Find outgoing edges from this node (excluding self-loops)
		const outgoingEdges = edges.filter(
			(e) => e.source === nodeId && e.source !== e.target,
		);

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
					const fullCycleIds = [...cycleNodes, neighbor];

					// Construct the cycle path string for the error message
					// e.g., "Node A -> Node B -> Node C -> Node A"
					const cyclePathLabels = fullCycleIds.map(
						(id) => nodeLabels.get(id) || id,
					);
					const pathString = cyclePathLabels.join(" -> ");
					const errorMessage = `Cycle detected: ${pathString}`;
					const errorObj = { message: errorMessage, relatedIds: fullCycleIds };

					// Mark edges connecting these nodes
					// 1. Mark the back-edge (nodeId -> neighbor)
					const backEdgeKey = `${nodeId}-${neighbor}`;
					const backErrors = edgeErrors.get(backEdgeKey) || [];
					if (!backErrors.some((e) => e.message === errorMessage)) {
						backErrors.push(errorObj);
						edgeErrors.set(backEdgeKey, backErrors);
					}

					// 2. Mark the rest of the path from neighbor to nodeId
					for (let i = 0; i < cycleNodes.length - 1; i++) {
						const s = cycleNodes[i];
						const t = cycleNodes[i + 1];
						const key = `${s}-${t}`;
						const errs = edgeErrors.get(key) || [];
						if (!errs.some((e) => e.message === errorMessage)) {
							errs.push(errorObj);
							edgeErrors.set(key, errs);
						}
					}
				}
			}
		}

		recursionStack.delete(nodeId);
	}

	nodes.forEach((node) => {
		if (!visited.has(node.id)) {
			detectCycleDFS(node.id, []);
		}
	});

	return edgeErrors;
}
