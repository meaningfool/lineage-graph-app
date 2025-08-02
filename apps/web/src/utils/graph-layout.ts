import dagre from "dagre";
import type { Edge, Node } from "reactflow";
import type { LineageGraph } from "./lineagegraph";

/**
 * Apply graph layout to a LineageGraph and return ReactFlow-compatible nodes and edges
 */
export function applyGraphLayout(
	lineageGraph: LineageGraph,
	options?: {
		nodeSpacing?: number;
		rankSpacing?: number;
		nodeWidth?: number;
		nodeHeight?: number;
	},
): { nodes: Node[]; edges: Edge[] } {
	const {
		nodeSpacing = 100,
		rankSpacing = 150,
		nodeWidth = 200,
		nodeHeight = 120,
	} = options || {};

	const graph = lineageGraph.getGraph();

	// Convert LineageGraph to ReactFlow nodes
	const initialNodes: Node[] = graph.nodes().map((nodeKey) => {
		const attributes = graph.getNodeAttributes(nodeKey);
		return {
			id: nodeKey,
			type: "default",
			position: { x: 0, y: 0 }, // Will be overridden by layout
			data: {
				label: attributes.label,
				role: attributes.role, // Preserve role for node type styling
				properties: {
					// Extract properties from attributes (excluding label and role)
					...Object.fromEntries(
						Object.entries(attributes).filter(
							([key]) => key !== "label" && key !== "role",
						),
					),
				},
			},
		};
	});

	// Convert LineageGraph to ReactFlow edges
	const initialEdges: Edge[] = graph.edges().map((edgeKey) => {
		const [source, target] = graph.extremities(edgeKey);
		return {
			id: edgeKey,
			source,
			target,
			type: "smoothstep",
		};
	});

	// Apply dagre layout
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({
		rankdir: "LR", // Fixed to left-to-right
		nodesep: nodeSpacing,
		ranksep: rankSpacing,
		align: "UL",
	});

	// Add nodes to dagre
	initialNodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
	});

	// Add edges to dagre
	initialEdges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	// Calculate layout
	dagre.layout(dagreGraph);

	// Apply calculated positions to nodes
	const layoutedNodes = initialNodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);

		// Calculate final position with centering and minimum bounds
		const x = nodeWithPosition.x - nodeWithPosition.width / 2;
		const y = nodeWithPosition.y - nodeWithPosition.height / 2;

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

	return { nodes: layoutedNodes, edges: initialEdges };
}
