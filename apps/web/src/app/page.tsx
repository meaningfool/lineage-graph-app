"use client";
import { useCallback, useState } from "react";
import type { Edge, Node } from "reactflow";
import Header from "@/components/header"; // We might need to move Header here or use a Context
import { LineageGraph } from "@/components/lineage-graph";
import { getLayoutedElements } from "@/utils/layout";

export default function Home() {
	// Load node data from file
	// TODO: Remove this once we have a proper data loading mechanism
	// For now, we start with an empty graph
	// const defaultNodes: Node[] = nodeData.nodes.map((node) => ({
	// 	id: node.id,
	// 	type: "custom",
	// 	position: { x: 0, y: 0 }, // Will be overridden by layout
	// 	data: {
	// 		label: node.label,
	// 		properties: node.properties,
	// 	},
	// }));

	// const defaultEdges: Edge[] = nodeData.edges.map((edge) => ({
	// 	...edge,
	// 	type: "smoothstep",
	// }));

	// Initialize state with empty data
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [graphId, setGraphId] = useState<string>("initial");

	// Apply layout whenever nodes/edges change (or initially)
	// For now, we'll just layout the current state
	const layouted = getLayoutedElements(nodes, edges, "LR");

	const handleImport = useCallback((newNodes: Node[], newEdges: Edge[]) => {
		// For Phase 1, we just replace nodes and clear edges
		const layoutedNew = getLayoutedElements(newNodes, newEdges, "LR");
		setNodes(layoutedNew.nodes);
		setEdges(layoutedNew.edges);
		setGraphId(Date.now().toString()); // Force remount on new import
	}, []);

	return (
		<div className="flex h-full w-full flex-col">
			<Header onImport={handleImport} />
			<div className="p-2" />
			<LineageGraph
				key={graphId}
				nodes={layouted.nodes}
				edges={layouted.edges}
			/>
		</div>
	);
}
