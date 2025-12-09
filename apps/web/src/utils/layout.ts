import type { Edge, Node } from "reactflow";
import { assignCoordinates, assignLayers } from "@/lib/graph-layout-utils";

// Layout utility function using custom algorithm
export const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	_direction = "LR",
) => {
	if (nodes.length === 0) {
		return { nodes: [], edges };
	}

	console.log("--- CUSTOM LAYOUT ACTIVE ---");

	// 1. Assign layers to nodes based on type (Single Pass Algorithm)
	const layeredNodes = assignLayers(nodes, edges);

	// 2. Convert layers to x/y coordinates
	const layoutedNodes = assignCoordinates(layeredNodes, 250);

	return { nodes: layoutedNodes, edges };
};
