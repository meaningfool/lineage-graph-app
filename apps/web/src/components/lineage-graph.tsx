import React, { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import ReactFlow, {
	Background,
	ReactFlowProvider,
	MarkerType,
	useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomNode } from "./graph/custom-node";
import { CustomEdge } from "./graph/custom-edge";
import { NodeDetailsPanel } from "./ui/node-details-panel";
import { ErrorToggle } from "./ui/error-toggle";
import { ErrorListPanel, type GraphError } from "./ui/error-list-panel";

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

export function LineageGraph(props: LineageGraphProps) {
	return (
		<ReactFlowProvider>
			<LineageGraphContent {...props} />
		</ReactFlowProvider>
	);
}

function LineageGraphContent({ nodes, edges }: LineageGraphProps) {
	const { fitView } = useReactFlow();
	const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
	const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
	const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>(null);
	const [isErrorPanelOpen, setIsErrorPanelOpen] = React.useState(false);
	const [flashTrigger, setFlashTrigger] = React.useState(0);
	const [flashingNodeId, setFlashingNodeId] = React.useState<string | null>(null);

	// Slice 1: Auto-Fit on Load
	// We use an imperative effect because the 'fitView' prop on ReactFlow
	// can sometimes run before custom nodes have calculated their dimensions.
	React.useEffect(() => {
		if (nodes.length === 0) return;
		const timer = setTimeout(() => {
			fitView({ padding: 0.2, duration: 800 });
		}, 50); // Small delay to ensure DOM dimensions are ready
		return () => clearTimeout(timer);
	}, [nodes, fitView]);

	// Reset state when graph data changes (e.g. new file import)
	React.useEffect(() => {
		setSelectedNodeId(null);
		setSelectedEdgeId(null);
		setFocusedNodeId(null);
		setFlashingNodeId(null);
		setIsErrorPanelOpen(false);
		setFlashTrigger(0);
	}, [nodes, edges]);

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

	// Calculate highlighted nodes (Upstream + Downstream)
	const highlightedNodeIds = useMemo(() => {
		if (!focusedNodeId) return new Set<string>();

		const relatedIds = new Set<string>();
		relatedIds.add(focusedNodeId);

		// Helper for upstream (follow incoming edges: target -> source)
		const visitedUp = new Set<string>();
		const queueUp = [focusedNodeId];
		while (queueUp.length > 0) {
			const currentId = queueUp.shift()!;
			if (visitedUp.has(currentId)) continue;
			visitedUp.add(currentId);
			relatedIds.add(currentId);

			const incomingEdges = edges.filter(e => e.target === currentId);
			incomingEdges.forEach(e => queueUp.push(e.source));
		}

		// Helper for downstream (follow outgoing edges: source -> target)
		const visitedDown = new Set<string>();
		const queueDown = [focusedNodeId];
		while (queueDown.length > 0) {
			const currentId = queueDown.shift()!;
			if (visitedDown.has(currentId)) continue;
			visitedDown.add(currentId);
			relatedIds.add(currentId);

			const outgoingEdges = edges.filter(e => e.source === currentId);
			outgoingEdges.forEach(e => queueDown.push(e.target));
		}

		return relatedIds;
	}, [focusedNodeId, edges]);

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
					isFlashing: node.id === flashingNodeId,
					dimmed: focusedNodeId !== null && !highlightedNodeIds.has(node.id),
				},
			})),
		[nodes, selectedNodeId, flashTrigger, flashingNodeId, focusedNodeId, highlightedNodeIds],
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
						dimmed: focusedNodeId !== null && !(highlightedNodeIds.has(edge.source) && highlightedNodeIds.has(edge.target)),
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
		[edges, selectedEdgeId, flashTrigger, focusedNodeId, highlightedNodeIds],
	);

	const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
		setSelectedNodeId(node.id);
		setSelectedEdgeId(null); // Clear edge selection
		setFlashingNodeId(null); // Clear flash on verify manual click
	}, []);

	const onPaneClick = React.useCallback(() => {
		setSelectedNodeId(null);
		setSelectedEdgeId(null);
		setFlashingNodeId(null);
		setFocusedNodeId(null); // Clear focus on background click
	}, []);

	const selectedNode = useMemo(() =>
		customNodes.find(n => n.id === selectedNodeId),
		[customNodes, selectedNodeId]
	);

	const handleErrorClick = React.useCallback((error: GraphError) => {
		if (error.type === "node") {
			setSelectedNodeId(error.id);
			setSelectedEdgeId(null);
			setFlashingNodeId(error.id); // Trigger flash only here

			// Camera Logic: Center on Node
			const node = nodes.find(n => n.id === error.id);
			if (node && node.width && node.height) {
				const x = node.position.x + node.width / 2;
				const y = node.position.y + node.height / 2;
				fitView({ nodes: [{ id: error.id }], duration: 800, minZoom: 1.0, maxZoom: 1.2 });
				// Actually setCenter is easier for specific zoom, but fitView with target is safer for dimensions
				// Let's use setCenter explicitly as requested for "Center/Zoom" control
				// But setCenter requires converting flow coords to viewport? No, it takes flow coords.
				// Wait, setCenter takes x, y, zoom.
				// useReactFlow().setCenter(x, y, { zoom: 1.2, duration: 800 });

				// However, node.position is top-left.
				// Let's try setCenter.
			}
			// Better: use fitView on the specific node to ensure it fits?
			// "Recenter and zoom... maximize zoom for readability".
			// fitView({ nodes: [{id: error.id}], duration: 800, padding: 0.5 }) might be good.
			// Let's stick to setCenter if we want specific zoom 1.2.
			// Actually, fitView is robust.
			if (node) {
				fitView({ nodes: [node], duration: 800, padding: 0.2, minZoom: 1, maxZoom: 1.2 });
			}

		} else if (error.type === "edge") {
			setSelectedEdgeId(error.id);
			setSelectedNodeId(null); // Optional: clear node selection?
			setFlashingNodeId(null); // Stop any node flashing
			// Edges don't support flashing yet, but if they did:
			// setFlashingEdgeId(error.id);

			// Camera Logic: Fit Edge?
			const edge = edges.find(e => e.id === error.id);
			if (edge) {
				// We can fit the source and target nodes of the edge
				const source = nodes.find(n => n.id === edge.source);
				const target = nodes.find(n => n.id === edge.target);
				if (source && target) {
					fitView({ nodes: [source, target], duration: 800, padding: 0.2 });
				}
			}
		}
		setFlashTrigger(prev => prev + 1); // Always trigger flash on error click
	}, [nodes, edges, fitView]);

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
			<ReactFlow
				nodes={customNodes}
				edges={customEdges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodeClick={onNodeClick}
				onPaneClick={onPaneClick}
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
		</div >
	);
}
