import React, { useMemo, useState } from "react";
import type { Edge, Node, EdgeProps } from "reactflow";
import ReactFlow, {
	Background,
	Handle,
	MarkerType,
	Position,
	ReactFlowProvider,
	NodeToolbar,
	BaseEdge,
	EdgeLabelRenderer,
	getSmoothStepPath,
	getBezierPath,
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

// Custom Edge Component
function CustomEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
	data,
}: EdgeProps) {
	const [isHovered, setIsHovered] = useState(false);
	const hasErrors = data?.validationErrors && data.validationErrors.length > 0;

	// Use Bezier for self-loops (sourceX approx targetX and sourceY approx targetY, or same node ID if we had it, but coords are enough proxy)
	// Actually, checking if source and target are close might be flaky.
	// Better: The parent component knows if it's a self loop.
	// But we don't pass source/target IDs here easily without prop drilling.
	// However, ReactFlow passes source and target IDs in EdgeProps!
	// Wait, EdgeProps has source and target? No, it has sourceX, sourceY etc.
	// It DOES have source and target string IDs.
	// Let's check the type definition or just assume standard props.
	// Standard EdgeProps: id, source, target, sourceX, sourceY, targetX, targetY, ...

	// Check for self-loop based on coordinates or passed data?
	// Let's use getBezierPath for everything if it's a self-loop, or just default to smoothstep.
	// But the user specifically said self-cycle is not readable.
	// If we use Bezier for self-loops, it draws a loop.
	// If we use SmoothStep for self-loops, it draws a box.

	// Let's try to detect self-loop by checking if source and target are the same.
	// But we don't have source/target IDs in the destructured props above.
	// Let's add them.

	// Actually, let's just use Bezier for everything for now? No, user likes smoothstep (orthogonal).
	// Let's use getBezierPath if it looks like a self loop (distance is small? No).
	// Let's rely on the fact that for a self-loop, ReactFlow usually handles it if we use the right path function.
	// But `getSmoothStepPath` on a self-loop (Right to Left) might be weird.

	// Let's use `getBezierPath` if `data.isSelfLoop` is true. We can pass that from parent.

	const isSelfLoop = data?.isSelfLoop;

	let edgePath = '';
	let labelX = 0;
	let labelY = 0;

	// Detect backward edge on same horizontal level (approx)
	// sourceX > targetX means backward (Right to Left)
	// Math.abs(sourceY - targetY) < 50 means roughly same row
	const isBackwardHorizontal = sourceX > targetX && Math.abs(sourceY - targetY) < 50;

	if (isSelfLoop) {
		// Draw a loop that goes up and over the node
		const controlPoint1X = sourceX + 30;
		const controlPoint1Y = sourceY - 60;
		const controlPoint2X = targetX - 30;
		const controlPoint2Y = targetY - 60;

		edgePath = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;

		// Approximate label position (top of the arch)
		// Cubic bezier peak is approx 0.75 of the control point height
		labelX = (sourceX + targetX) / 2;
		labelY = sourceY - (60 * 0.75);
	} else if (isBackwardHorizontal) {
		// Draw a curve that goes UP and over the intermediate nodes
		// Similar to self-loop but wider
		// We use a higher offset to clear the nodes clearly

		const offset = 80; // Higher than self-loop (60)
		const controlPoint1X = sourceX;
		const controlPoint1Y = sourceY - offset;
		const controlPoint2X = targetX;
		const controlPoint2Y = targetY - offset;

		edgePath = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;

		labelX = (sourceX + targetX) / 2;
		labelY = sourceY - (offset * 0.75);
	} else {
		[edgePath, labelX, labelY] = getSmoothStepPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition,
		});
	}

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

			{/* Invisible path for wider hover area */}
			<path
				d={edgePath}
				fill="none"
				stroke="transparent"
				strokeWidth={20}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				style={{ cursor: 'pointer' }}
			/>

			{/* Tooltip */}
			{hasErrors && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 10}px)`, // Shift up to be above the line
							pointerEvents: 'all',
							opacity: isHovered ? 1 : 0,
							transition: 'opacity 0.2s',
							zIndex: 10,
						}}
						className="nodrag nopan"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						<div className="px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-md whitespace-nowrap">
							{data.validationErrors.map((err: string, i: number) => (
								<div key={i}>{err}</div>
							))}
							{/* Arrow pointing down */}
							<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}

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
				const hasErrors = edge.data?.validationErrors && edge.data.validationErrors.length > 0;
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
						strokeWidth: 2
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
					edgeTypes={edgeTypes}
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
