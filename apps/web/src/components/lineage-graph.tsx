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

import { ErrorToggle } from "./ui/error-toggle";
import { ErrorListPanel, type GraphError } from "./ui/error-list-panel";

// ... existing imports

export function LineageGraph({ nodes, edges }: LineageGraphProps) {
	const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
	const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
	const [isErrorPanelOpen, setIsErrorPanelOpen] = React.useState(false);
	const [flashTrigger, setFlashTrigger] = React.useState(0);

	// Calculate error list
	const errorList = useMemo<GraphError[]>(() => {
		const seenMessages = new Set<string>();
		const uniqueErrors: GraphError[] = [];

		const addError = (error: GraphError) => {
			if (!seenMessages.has(error.message)) {
				seenMessages.add(error.message);
				uniqueErrors.push(error);
			}
		};

		nodes.forEach(n => {
			if (n.data?.validationErrors) {
				n.data.validationErrors.forEach((msg: string) => {
					addError({
						id: n.id,
						type: "node",
						message: msg,
						label: n.data.label
					});
				});
			}
		});

		edges.forEach(e => {
			if (e.data?.validationErrors) {
				e.data.validationErrors.forEach((msg: string) => {
					addError({
						id: e.id,
						type: "edge",
						message: msg,
						label: e.data?.label || e.id
					});
				});
			}
		});

		return uniqueErrors;
	}, [nodes, edges]);

	const totalErrors = errorList.length;

	// Memoize nodes conversion to prevent unnecessary re-renders
	const customNodes = useMemo(
		() =>
			nodes.map((node) => ({
				...node,
				type: "custom",
				selected: node.id === selectedNodeId,
				data: {
					...node.data,
					flashTrigger, // Pass flash trigger
				},
			})),
		[nodes, selectedNodeId, flashTrigger],
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
					selected: edge.id === selectedEdgeId,
					data: {
						...edge.data,
						isSelfLoop, // Pass this flag
						flashTrigger, // Pass flash trigger
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
		[edges, selectedEdgeId, flashTrigger],
	);

	const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
		setSelectedNodeId(node.id);
		setSelectedEdgeId(null); // Clear edge selection
		setFlashTrigger(prev => prev + 1); // Trigger flash on click
	}, []);

	const onPaneClick = React.useCallback(() => {
		setSelectedNodeId(null);
		setSelectedEdgeId(null);
	}, []);

	const selectedNode = useMemo(() =>
		customNodes.find(n => n.id === selectedNodeId),
		[customNodes, selectedNodeId]
	);

	const handleErrorClick = React.useCallback((error: GraphError) => {
		if (error.type === "node") {
			setSelectedNodeId(error.id);
			setSelectedEdgeId(null);
		} else if (error.type === "edge") {
			setSelectedEdgeId(error.id);
			setSelectedNodeId(null); // Optional: clear node selection?
		}
		setFlashTrigger(prev => prev + 1); // Always trigger flash on error click
	}, []);

	if (!customNodes.length) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-gray-500">No nodes to display</div>
			</div>
		);
	}

	return (
		<div className="w-full relative" style={{ height: "100vh", minHeight: "600px" }}>
			<ErrorToggle
				errorCount={totalErrors}
				onClick={() => setIsErrorPanelOpen(true)}
			/>
			{isErrorPanelOpen && (
				<ErrorListPanel
					errors={errorList}
					onClose={() => setIsErrorPanelOpen(false)}
					onItemClick={handleErrorClick}
				/>
			)}
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
