"use client";
import React from "react";
import type { Edge, Node } from "reactflow";
import { LineageGraph } from "@/components/lineage-graph";
import nodeData from "@/data/target-lineage.json";
import { getLayoutedElements } from "@/utils/layout";

export default function Home() {
	// Load node data from file
	const initialNodes: Node[] = nodeData.nodes.map((node) => ({
		id: node.id,
		type: "default",
		position: { x: 0, y: 0 }, // Will be overridden by layout
		data: {
			label: node.label,
			properties: node.properties,
		},
	}));

	const initialEdges: Edge[] = nodeData.edges.map((edge) => ({
		...edge,
		type: "smoothstep",
	}));

	// Apply automatic layout
	const { nodes, edges } = getLayoutedElements(
		initialNodes,
		initialEdges,
		"LR",
	);

	return (
		<div className="h-full w-full">
			<LineageGraph nodes={nodes} edges={edges} />
		</div>
	);
}
