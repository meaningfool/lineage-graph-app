import React, { useMemo } from "react";
import { useState } from "react";
import type { Edge, Node } from "reactflow";
import ReactFlow, {
	Background,
	Handle,
	MarkerType,
	Position,
	ReactFlowProvider,
	NodeToolbar,
} from "reactflow";
import "reactflow/dist/style.css";

interface NodeData {
	label: string;
	properties?: {
		[key: string]: any;
	};
	validationErrors?: string[];
}

// Custom node component that displays label and all properties
function CustomNode({ data }: { data: NodeData }) {
	const [isHovered, setIsHovered] = useState(false);
	const hasErrors = data.validationErrors && data.validationErrors.length > 0;
	const borderColor = hasErrors ? "border-red-500" : "border-gray-200";

	return (
		<div
			className={`min-w-[150px] max-w-[200px] rounded-sm border ${borderColor} bg-white px-3 py-2 shadow-sm relative group`}
			style={{ borderColor: hasErrors ? "#ef4444" : undefined }}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Tooltip using NodeToolbar to escape clipping */}
			{hasErrors && (
				<NodeToolbar
					isVisible={isHovered}
					position={Position.Top}
					offset={10}
				>
					<div className="px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-md whitespace-nowrap">
						{data.validationErrors?.map((err, i) => (
							<div key={i}>{err}</div>
						))}
						{/* Arrow */}
						<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
					</div>
				</NodeToolbar>
			)}

			<Handle
				type="target"
				position={Position.Left}
				className="h-1.5 w-1.5 opacity-0"
			/>
			<div className="flex flex-col gap-0.5">
				<div className="border-gray-100 border-b pb-0.5 font-medium text-gray-900 text-xs">
					{data.label}
				</div>
				{data.properties && (
					<div className="space-y-0.5">
						{Object.entries(data.properties).map(([key, value]) => (
							<div key={key} className="text-xs">
								<span className="font-medium text-gray-600 text-xs capitalize">
									{key.replace(/([A-Z])/g, " $1").trim()}:
								</span>
								<span className="ml-1 text-gray-500 text-xs">{value}</span>
							</div>
						))}
					</div>
				)}
			</div>
			<Handle
				type="source"
				position={Position.Right}
				className="h-1.5 w-1.5 opacity-0"
			/>
		</div>
	);
}

// Define nodeTypes outside component to prevent recreation on every render
const nodeTypes = {
	custom: CustomNode,
};

interface LineageGraphProps {
	nodes: Node[];
	edges: Edge[];
}

export function LineageGraph({ nodes, edges }: LineageGraphProps) {
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
			edges.map((edge) => ({
				...edge,
				type: "smoothstep", // Use smoothstep for balanced structure and flow
				animated: false, // Remove animation
				style: { stroke: "#6b7280", strokeWidth: 2 }, // Plain line style
				markerEnd: {
					type: MarkerType.ArrowClosed, // Use closed arrow for solid triangle
					width: 12,
					height: 12,
					color: "#6b7280",
				},
			})),
		[edges],
	);

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
		<div className="w-full" style={{ height: "100vh", minHeight: "600px" }}>
			<ReactFlowProvider>
				<ReactFlow
					nodes={customNodes}
					edges={customEdges}
					nodeTypes={nodeTypes}
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
