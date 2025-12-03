import React, { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import ReactFlow, {
	Background,
	ReactFlowProvider,
	MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomNode } from "./graph/custom-node";
import { CustomEdge } from "./graph/custom-edge";
import { NodeDetailsPanel } from "./ui/node-details-panel";

// Define nodeTypes outside component to prevent recreation on every render
const nodeTypes = {
	custom: CustomNode,
};

const edgeTypes = {
	custom: CustomEdge,
};

interface LineageGraphProps {
	nodes: Node[];
	edges: Edge[];
}

export function LineageGraph({ nodes, edges }: LineageGraphProps) {
	const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

	// Memoize nodes conversion to prevent unnecessary re-renders
	const customNodes = useMemo(
		() =>
			nodes.map((node) => ({
				...node,
				type: "custom",
			})),
		[nodes],
	);

	// Memoize edges conversion to prevent unnecessary re-renders
	const customEdges = useMemo(
		() =>
			edges.map((edge) => {
				const hasErrors =
					edge.data?.validationErrors && edge.data.validationErrors.length > 0;
				const isSelfLoop = edge.source === edge.target;

				return {
					...edge,
					type: "custom", // Use our custom edge
					animated: false, // Remove animation
					data: {
						...edge.data,
						isSelfLoop, // Pass this flag
					},
					style: {
						stroke: hasErrors ? "#ef4444" : "#6b7280",
						strokeWidth: 2,
					},
					markerEnd: {
						type: MarkerType.ArrowClosed, // Use closed arrow for solid triangle
						width: 12,
						height: 12,
						color: hasErrors ? "#ef4444" : "#6b7280",
					},
				};
			}),
		[edges],
	);

	const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
		setSelectedNodeId(node.id);
	}, []);

	const onPaneClick = React.useCallback(() => {
		setSelectedNodeId(null);
	}, []);

	const selectedNode = useMemo(() =>
		customNodes.find(n => n.id === selectedNodeId),
		[customNodes, selectedNodeId]
	);

	// console.log("LineageGraph nodes:", customNodes);
	// console.log("LineageGraph edges:", customEdges);

	if (!customNodes.length) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-gray-500">No nodes to display</div>
			</div>
		);
	}

	return (
		<div className="w-full relative" style={{ height: "100vh", minHeight: "600px" }}>
			{selectedNode && (
				<NodeDetailsPanel
					node={selectedNode}
					onClose={() => setSelectedNodeId(null)}
				/>
			)}
			<ReactFlowProvider>
				<ReactFlow
					nodes={customNodes}
					edges={customEdges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					fitView
					fitViewOptions={{ padding: 0.2 }}
					minZoom={0.1}
					maxZoom={2}
					defaultViewport={{ x: 0, y: 0, zoom: 1 }}
					proOptions={{ hideAttribution: true }}
				>
					<Background
						variant={"dots" as any}
						gap={20}
						size={1.5}
						color="#9ca3af"
					/>
				</ReactFlow>
			</ReactFlowProvider>
		</div>
	);
}
