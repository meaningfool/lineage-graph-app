import type { Edge, Node } from "reactflow";
import {
	computeMaxLayers,
	assignLayers,
	assignCoordinates,
} from "@/lib/graph-layout-utils";

// Layout utility function using custom algorithm
export const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = "LR",
) => {
	if (nodes.length === 0) {
		return { nodes: [], edges };
	}

	console.log("--- CUSTOM LAYOUT ACTIVE ---");

	// 1. Compute max layers needed (undirected traversal)
	const maxLayers = computeMaxLayers(nodes, edges);

	// 2. Assign layers to nodes based on type
	const layeredNodes = assignLayers(nodes, edges, maxLayers);

	// 3. Convert layers to x/y coordinates
	const layoutedNodes = assignCoordinates(layeredNodes, 250);

	return { nodes: layoutedNodes, edges };
};
