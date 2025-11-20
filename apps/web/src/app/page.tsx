"use client";
import React, { useState, useCallback } from "react";
import type { Edge, Node } from "reactflow";
import { LineageGraph } from "@/components/lineage-graph";
import nodeData from "@/data/target-lineage.json";
import { getLayoutedElements } from "@/utils/layout";
import Header from "@/components/header"; // We might need to move Header here or use a Context

export default function Home() {
	// Load node data from file
	const defaultNodes: Node[] = nodeData.nodes.map((node) => ({
		id: node.id,
		type: "custom",
		position: { x: 0, y: 0 }, // Will be overridden by layout
		data: {
			label: node.label,
			properties: node.properties,
		},
	}));

	const defaultEdges: Edge[] = nodeData.edges.map((edge) => ({
		...edge,
		type: "smoothstep",
	}));

	// Initialize state with default data
	const [nodes, setNodes] = useState<Node[]>(defaultNodes);
	const [edges, setEdges] = useState<Edge[]>(defaultEdges);

	// Apply layout whenever nodes/edges change (or initially)
	// For now, we'll just layout the current state
	const layouted = getLayoutedElements(nodes, edges, "LR");

	const handleImport = useCallback((newNodes: any[]) => {
		// For Phase 1, we just replace nodes and clear edges
		const layoutedNew = getLayoutedElements(newNodes, [], "LR");
		setNodes(layoutedNew.nodes);
		setEdges([]);
	}, []);

	return (
		<div className="flex flex-col h-full w-full">
			<Header onImport={handleImport} />
			<LineageGraph nodes={layouted.nodes} edges={layouted.edges} />
		</div>
	);
}
