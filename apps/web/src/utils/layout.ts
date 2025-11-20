import dagre from "dagre";
import type { Edge, Node } from "reactflow";

// Layout utility function using dagre
export const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = "LR",
) => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 100, // Increase horizontal spacing between nodes
		ranksep: 150, // Increase vertical spacing between ranks
		align: "UL", // Align nodes to upper-left (this helps with centering)
	});

	// Add nodes to dagre with more accurate dimensions
	nodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: 200, height: 250 }); // Increase node size for better spacing
	});

	// Add edges to dagre
	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	// Calculate layout
	dagre.layout(dagreGraph);

	// Get positioned nodes with proper centering
	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);

		// Ensure we have valid coordinates
		const x = nodeWithPosition.x - nodeWithPosition.width / 2;
		const y = nodeWithPosition.y - nodeWithPosition.height / 2;

		// Add some offset to ensure nodes are visible
		const adjustedX = Math.max(50, x);
		const adjustedY = Math.max(50, y);

		console.log(
			`Node ${node.id}: x=${x}, y=${y}, adjustedX=${adjustedX}, adjustedY=${adjustedY}`,
		);

		return {
			...node,
			position: {
				x: adjustedX,
				y: adjustedY,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
};
