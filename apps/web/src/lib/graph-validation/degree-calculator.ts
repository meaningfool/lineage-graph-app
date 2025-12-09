import type { GraphEdge, GraphNode } from "../csv-graph-importer";

/**
 * Degree Calculator Utility
 *
 * Purpose: Efficiently calculates the number of incoming and outgoing edges for every node.
 *
 * Why separate this?
 * - Performance: We iterate through edges ONCE (O(E)) instead of filtering edges for every node (O(N*E)).
 * - Reusability: Multiple validators (Connectivity, Orphans, etc.) need this data.
 */
export function buildDegreeMap(
	nodes: GraphNode[],
	edges: GraphEdge[],
): {
	inDegree: Map<string, number>;
	outDegree: Map<string, number>;
} {
	const inDegree = new Map<string, number>();
	const outDegree = new Map<string, number>();

	// Initialize degrees
	nodes.forEach((node) => {
		inDegree.set(node.id, 0);
		outDegree.set(node.id, 0);
	});

	// Calculate degrees
	edges.forEach((edge) => {
		outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
		inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
	});

	return { inDegree, outDegree };
}
