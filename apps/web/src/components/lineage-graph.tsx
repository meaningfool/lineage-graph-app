"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";
import ReactFlow, {
	Background,
	Handle,
	Position,
	ReactFlowProvider,
	useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

interface NodeData {
	label: string;
	properties?: {
		[key: string]: any;
	};
	isSelected?: boolean;
	isFocusNode?: boolean;
	nodeType?: "source" | "computed" | "metric";
	role?: string;
}

// Custom node component that displays label only (properties shown in side panel)
function CustomNode({ data }: { data: NodeData }) {
	const isSelected = data.isSelected || false;
	const isFocusNode = data.isFocusNode || false;
	const nodeType = data.nodeType || "computed";

	// Get type-specific classes
	const getTypeClasses = (type: string) => {
		switch (type) {
			case "source":
				return "node-source";
			case "metric":
				return "node-metric";
			case "computed":
			default:
				return "node-computed";
		}
	};

	// Build CSS classes based on state
	const baseClasses =
		"px-3 py-2 shadow-sm rounded-sm border min-w-[150px] max-w-[200px] cursor-pointer transition-colors";
	const typeClasses = getTypeClasses(nodeType);
	const selectedClasses = isSelected ? "selected-node" : "";
	const focusClasses = isFocusNode ? "focus-node" : "";

	return (
		<div
			className={`${baseClasses} ${typeClasses} ${selectedClasses} ${focusClasses}`}
		>
			<Handle
				type="target"
				position={Position.Left}
				className="h-1.5 w-1.5 opacity-0"
			/>
			<div className="flex flex-col gap-0.5">
				<div className="font-medium text-gray-900 text-xs">{data.label}</div>
			</div>
			<Handle
				type="source"
				position={Position.Right}
				className="h-1.5 w-1.5 opacity-0"
			/>
		</div>
	);
}

// Helper function to map LineageGraph roles to node types
const mapRoleToNodeType = (role: string): "source" | "computed" | "metric" => {
	switch (role?.toUpperCase()) {
		case "INPUT":
			return "source";
		case "STEP":
			return "computed";
		case "OUTPUT":
			return "metric";
		default:
			return "computed";
	}
};

// Define nodeTypes outside component to prevent recreation on every render
const nodeTypes = {
	custom: CustomNode,
};

interface LineageGraphProps {
	nodes: Node[];
	edges: Edge[];
	edgeType?: "default" | "straight" | "step" | "smoothstep";
	onViewLineage?: (nodeId: string) => void;
	isLineageView?: boolean;
	focusNodeId?: string | null;
}

// Inner component that uses the ReactFlow context
function LineageGraphInner({
	nodes,
	edges,
	edgeType = "smoothstep",
	onViewLineage,
	isLineageView,
	focusNodeId,
}: LineageGraphProps) {
	const { fitView } = useReactFlow();
	const [sidePanelVisible, setSidePanelVisible] = useState(false);
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);

	const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
		setSidePanelVisible(true);
		setSelectedNode(node);
	};

	const handleCloseSidePanel = () => {
		setSidePanelVisible(false);
		setSelectedNode(null); // Deselect node when manually closing side panel
	};

	const handlePaneClick = () => {
		setSelectedNode(null);
		setSidePanelVisible(false);
	};

	// Handle selection when nodes change
	useEffect(() => {
		if (selectedNode) {
			// Check if the selected node exists in the new graph by ID
			const nodeStillExists = nodes.find((n) => n.id === selectedNode.id);

			if (nodeStillExists) {
				// Update the reference to the new node object (positions might have changed)
				setSelectedNode(nodeStillExists);
				// Side panel stays open
			} else {
				// Node doesn't exist in new graph, clear selection
				setSelectedNode(null);
				setSidePanelVisible(false);
			}
		}
	}, [nodes]);

	// Memoize nodes conversion to prevent unnecessary re-renders
	const customNodes = useMemo(
		() =>
			nodes.map((node) => ({
				...node,
				type: "custom",
				data: {
					...node.data,
					isSelected: selectedNode?.id === node.id,
					isFocusNode: focusNodeId === node.id,
					nodeType:
						mapRoleToNodeType((node.data as any).role) ||
						(node as any).nodeType ||
						(node as any).type, // Map role to nodeType
				},
			})),
		[nodes, selectedNode, focusNodeId],
	);

	// Memoize edges conversion to prevent unnecessary re-renders
	const customEdges = useMemo(
		() =>
			edges.map((edge) => ({
				...edge,
				type: edgeType, // Use dynamic edge type
				animated: false, // Remove animation
				style: { stroke: "#6b7280", strokeWidth: 2 }, // Plain line style
				markerEnd: {
					type: "arrowclosed" as any,
					width: 12,
					height: 12,
					color: "#6b7280",
				},
			})),
		[edges, edgeType],
	); // Add edgeType as dependency

	// Automatically fit view only when graph structure changes (not selection)
	useEffect(() => {
		// Small delay to ensure nodes are rendered before fitting view
		const timer = setTimeout(() => {
			fitView({
				padding: 0.2, // 20% padding around the graph
				duration: 500, // Smooth animation duration
				minZoom: 0.1, // Allow zooming out to see large graphs
				maxZoom: 1.5, // Prevent over-zooming for readability
			});
		}, 100);

		return () => clearTimeout(timer);
	}, [nodes, edges, edgeType, fitView]); // Use original nodes/edges, not customNodes

	console.log("LineageGraph nodes:", customNodes);
	console.log("LineageGraph edges:", customEdges);

	if (!customNodes.length) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-gray-500">No nodes to display</div>
			</div>
		);
	}

	return (
		<>
			<ReactFlow
				nodes={customNodes}
				edges={customEdges}
				nodeTypes={nodeTypes}
				onNodeClick={handleNodeClick}
				onPaneClick={handlePaneClick}
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

			{sidePanelVisible && (
				<div
					data-testid="side-panel"
					className="fixed top-0 right-0 z-50 h-full w-96 border-gray-300 border-l bg-white shadow-lg transition-transform duration-300 ease-in-out"
				>
					<div className="p-6">
						<div className="mb-4 flex items-start justify-between">
							<h3 className="flex-1 pr-2 font-semibold text-gray-900 text-xl">
								{selectedNode ? selectedNode.data.label : "Node Properties"}
							</h3>
							<button
								data-testid="close-side-panel"
								onClick={handleCloseSidePanel}
								className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
								aria-label="Close side panel"
							>
								<svg
									className="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						{selectedNode && selectedNode.data.properties && (
							<div className="space-y-2">
								{Object.entries(selectedNode.data.properties).map(
									([key, value]) => (
										<div
											key={key}
											data-testid={`property-${key}`}
											className="text-base"
										>
											<span className="font-medium text-gray-600 capitalize">
												{key.replace(/([A-Z])/g, " $1").trim()}:
											</span>
											<span className="ml-1 text-gray-500">
												{String(value)}
											</span>
										</div>
									),
								)}
							</div>
						)}
						{selectedNode && (
							<div className="mt-6">
								<button
									data-testid="view-lineage-button"
									onClick={() => {
										if (onViewLineage && selectedNode) {
											onViewLineage(selectedNode.id);
										}
									}}
									className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
								>
									View Lineage
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}

export function LineageGraph({
	nodes,
	edges,
	edgeType = "smoothstep",
	onViewLineage,
	isLineageView,
	focusNodeId,
}: LineageGraphProps) {
	return (
		<div className="w-full" style={{ height: "100vh", minHeight: "600px" }}>
			<ReactFlowProvider>
				<LineageGraphInner
					nodes={nodes}
					edges={edges}
					edgeType={edgeType}
					onViewLineage={onViewLineage}
					isLineageView={isLineageView}
					focusNodeId={focusNodeId}
				/>
			</ReactFlowProvider>
		</div>
	);
}
