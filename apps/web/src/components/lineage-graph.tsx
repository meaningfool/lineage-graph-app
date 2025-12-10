import React, { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import ReactFlow, {
	Background,
	MarkerType,
	ReactFlowProvider,
	useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ValidationError } from "../lib/graph-validation";
import { CustomEdge } from "./graph/custom-edge";
import { CustomNode } from "./graph/custom-node";
import { ErrorListPanel, type GraphError } from "./ui/error-list-panel";
import { ErrorToggle } from "./ui/error-toggle";
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

export function LineageGraph(props: LineageGraphProps) {
	return (
		<ReactFlowProvider>
			<LineageGraphContent {...props} />
		</ReactFlowProvider>
	);
}

function LineageGraphContent({ nodes, edges }: LineageGraphProps) {
	const { fitView } = useReactFlow();
	const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
		null,
	);
	const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(
		null,
	);
	const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>(null);
	const [isErrorPanelOpen, setIsErrorPanelOpen] = React.useState(false);
	const [flashTrigger, setFlashTrigger] = React.useState(0);
	const [flashingNodeId, setFlashingNodeId] = React.useState<string | null>(
		null,
	);
	const [flashingEdgeIds, setFlashingEdgeIds] = React.useState<Set<string>>(
		new Set(),
	);

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
		setFlashingEdgeIds(new Set());
		setIsErrorPanelOpen(false);
		setFlashTrigger(0);
	}, []);

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

		nodes.forEach((n) => {
			if (n.data?.validationErrors) {
				(n.data.validationErrors as ValidationError[]).forEach((err) => {
					addError({
						id: n.id,
						type: "node",
						message: err.message,
						label: n.data.label,
						relatedIds: err.relatedIds,
					});
				});
			}
		});

		edges.forEach((e) => {
			if (e.data?.validationErrors) {
				(e.data.validationErrors as ValidationError[]).forEach((err) => {
					addError({
						id: e.id,
						type: "edge",
						message: err.message,
						label: e.data?.label || e.id,
						relatedIds: err.relatedIds,
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

		// Optimize layer lookup
		const nodeLayers = new Map<string, number>();
		nodes.forEach((n) => {
			if (typeof n.data?.layer === "number") {
				nodeLayers.set(n.id, n.data.layer);
			}
		});

		// Helper for upstream (follow incoming edges: target -> source)
		// STRICT RULE: Only follow if SourceLayer > TargetLayer (Sink-Anchored: High -> Low Flow)
		const visitedUp = new Set<string>();
		const queueUp = [focusedNodeId];
		while (queueUp.length > 0) {
			const currentId = queueUp.shift()!;
			if (visitedUp.has(currentId)) continue;
			visitedUp.add(currentId);
			relatedIds.add(currentId);

			const currentLayer = nodeLayers.get(currentId);
			const incomingEdges = edges.filter((e) => e.target === currentId);

			incomingEdges.forEach((e) => {
				const sourceLayer = nodeLayers.get(e.source);
				// Enforce Strict Inequality: Source > Target (Upstream goes to HIGHER layer)
				if (
					sourceLayer !== undefined &&
					currentLayer !== undefined &&
					sourceLayer > currentLayer
				) {
					queueUp.push(e.source);
				}
			});
		}

		// Helper for downstream (follow outgoing edges: source -> target)
		// STRICT RULE: Only follow if TargetLayer < SourceLayer (Downstream goes to LOWER layer)
		const visitedDown = new Set<string>();
		const queueDown = [focusedNodeId];
		while (queueDown.length > 0) {
			// biome-ignore lint/style/noNonNullAssertion: Guaranteed by queue logic
			const currentId = queueDown.shift()!;
			if (visitedDown.has(currentId)) continue;
			visitedDown.add(currentId);
			relatedIds.add(currentId);

			const currentLayer = nodeLayers.get(currentId);
			const outgoingEdges = edges.filter((e) => e.source === currentId);

			outgoingEdges.forEach((e) => {
				const targetLayer = nodeLayers.get(e.target);
				// Enforce Strict Inequality: Target < Source (Downstream goes to LOWER layer)
				if (
					targetLayer !== undefined &&
					currentLayer !== undefined &&
					targetLayer < currentLayer
				) {
					queueDown.push(e.target);
				}
			});
		}

		return relatedIds;
	}, [focusedNodeId, edges, nodes]);

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
		[
			nodes,
			selectedNodeId,
			flashTrigger,
			flashingNodeId,
			focusedNodeId,
			highlightedNodeIds,
		],
	);

	// Memoize edges conversion to prevent unnecessary re-renders
	const customEdges = useMemo(
		() =>
			edges.map((edge) => {
				const hasErrors =
					edge.data?.validationErrors && edge.data.validationErrors.length > 0;
				const isSelfLoop = edge.source === edge.target;
				const isFlashing = flashingEdgeIds.has(edge.id);

				return {
					...edge,
					type: "custom", // Use our custom edge
					animated: false, // Remove animation
					selected: edge.id === selectedEdgeId,
					data: {
						...edge.data,
						isSelfLoop, // Pass this flag
						flashTrigger, // Pass flash trigger
						isFlashing, // NEW: Pass flashing state to edge
						dimmed:
							focusedNodeId !== null &&
							!(
								highlightedNodeIds.has(edge.source) &&
								highlightedNodeIds.has(edge.target)
							),
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
		[
			edges,
			selectedEdgeId,
			flashTrigger,
			focusedNodeId,
			highlightedNodeIds,
			flashingEdgeIds,
		],
	);

	const onNodeClick = React.useCallback(
		(_event: React.MouseEvent, node: Node) => {
			setSelectedNodeId(node.id);
			setSelectedEdgeId(null); // Clear edge selection
			setFlashingNodeId(null); // Clear flash on verify manual click
			setFlashingEdgeIds(new Set());
		},
		[],
	);

	const onPaneClick = React.useCallback(() => {
		setSelectedNodeId(null);
		setSelectedEdgeId(null);
		setFlashingNodeId(null);
		setFlashingEdgeIds(new Set());
		setFocusedNodeId(null); // Clear focus on background click
	}, []);

	const selectedNode = useMemo(
		() => customNodes.find((n) => n.id === selectedNodeId),
		[customNodes, selectedNodeId],
	);

	const handleToggleFocus = React.useCallback(() => {
		if (selectedNodeId) {
			setFocusedNodeId((prev) =>
				prev === selectedNodeId ? null : selectedNodeId,
			);
		}
	}, [selectedNodeId]);

	const handleErrorClick = React.useCallback(
		(error: GraphError) => {
			if (error.type === "node") {
				setSelectedNodeId(error.id);
				setSelectedEdgeId(null);
				setFlashingNodeId(error.id); // Trigger flash only here
				setFlashingEdgeIds(new Set());

				// Camera Logic: Center on Node
				const node = nodes.find((n) => n.id === error.id);
				if (node) {
					fitView({
						nodes: [node],
						duration: 800,
						padding: 0.2,
						minZoom: 1,
						maxZoom: 1.2,
					});
				}
			} else if (error.type === "edge") {
				if (error.relatedIds && error.relatedIds.length > 0) {
					// Handle Cycle / Multi-Node Error
					const edgesToFlash = new Set<string>();
					const nodesToFit: Node[] = [];

					// Identify Nodes for fitting
					error.relatedIds.forEach((id) => {
						const n = nodes.find((node) => node.id === id);
						if (n) nodesToFit.push(n);
					});

					// Identify Edges for flashing
					for (let i = 0; i < error.relatedIds.length - 1; i++) {
						const source = error.relatedIds[i];
						const target = error.relatedIds[i + 1];
						// Find edge by source/target match
						const matchingEdges = edges.filter(
							(e) => e.source === source && e.target === target,
						);
						matchingEdges.forEach((e) => edgesToFlash.add(e.id));
					}

					setFlashingEdgeIds(edgesToFlash);
					setSelectedEdgeId(null);
					setSelectedNodeId(null);
					setFlashingNodeId(null);

					if (nodesToFit.length > 0) {
						fitView({ nodes: nodesToFit, duration: 800, padding: 0.2 });
					}
				} else {
					// Single Edge Error
					setSelectedEdgeId(error.id);
					setSelectedNodeId(null);
					setFlashingNodeId(null);
					setFlashingEdgeIds(new Set());

					const edge = edges.find((e) => e.id === error.id);
					if (edge) {
						const source = nodes.find((n) => n.id === edge.source);
						const target = nodes.find((n) => n.id === edge.target);
						if (source && target) {
							fitView({ nodes: [source, target], duration: 800, padding: 0.2 });
						}
					}
				}
			}
			setFlashTrigger((prev) => prev + 1); // Always trigger flash on error click
		},
		[nodes, edges, fitView],
	);

	if (!customNodes.length) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-gray-500">No nodes to display</div>
			</div>
		);
	}

	return (
		<div
			className="relative w-full"
			style={{ height: "100vh", minHeight: "600px" }}
		>
			<ErrorToggle
				errorCount={totalErrors}
				onClick={() => setIsErrorPanelOpen(true)}
			/>
			{selectedNode && (
				<NodeDetailsPanel
					node={selectedNode}
					onClose={() => setSelectedNodeId(null)}
					isFocused={focusedNodeId === selectedNodeId}
					onToggleFocus={handleToggleFocus}
				/>
			)}
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
		</div>
	);
}
