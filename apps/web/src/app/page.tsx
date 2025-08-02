"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { CSVImportModal } from "@/components/csv-import-modal";
import { LineageGraph } from "@/components/lineage-graph";
import nodeData from "@/data/target-lineage.json";
import { applyGraphLayout } from "@/utils/graph-layout";
import {
	generateLineageGraph,
	transformJsonToLineageGraph,
} from "@/utils/lineagegraph";

// Available edge types in ReactFlow
const EDGE_TYPES = [
	{ value: "default", label: "Bezier (Default)" },
	{ value: "straight", label: "Straight" },
	{ value: "step", label: "Step" },
	{ value: "smoothstep", label: "Smooth Step" },
] as const;

type EdgeType = (typeof EDGE_TYPES)[number]["value"];

export default function Home() {
	// Counter to track number of generations - triggers new graph each time
	const [generationCount, setGenerationCount] = useState(0);

	// Edge type selection state
	const [selectedEdgeType, setSelectedEdgeType] =
		useState<EdgeType>("smoothstep");

	// Store the full graph for lineage operations
	const [fullGraph, setFullGraph] = useState<any>(null);

	// State for lineage view
	const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

	// State for CSV import modal
	const [showCSVModal, setShowCSVModal] = useState(false);

	// Generate the base graph (separate from lineage logic)
	const baseGraph = useMemo(() => {
		if (generationCount > 0) {
			// Generate random parameters for each generation
			const depth = 4 + Math.floor(Math.random() * 5); // 4-8 layers
			const width = 3 + Math.floor(Math.random() * 8); // 3-10 nodes
			const seed = Date.now() + generationCount; // Always different seed

			// Generate a random graph with varying characteristics
			return generateLineageGraph({
				depth,
				width,
				seed,
			});
		}
		// Use default data when no generations have been triggered
		return transformJsonToLineageGraph(nodeData);
	}, [generationCount]);

	// Update fullGraph when baseGraph changes
	useEffect(() => {
		setFullGraph(baseGraph);
	}, [baseGraph]);

	// Transform and layout the graph based on current state
	const { nodes, edges, currentGraph } = useMemo(() => {
		let graph;

		if (focusNodeId && fullGraph) {
			// Show lineage view
			graph = fullGraph.getLineage(focusNodeId);
		} else {
			// Use base graph
			graph = baseGraph;
		}

		const layoutResult = applyGraphLayout(graph);
		return { ...layoutResult, currentGraph: graph };
	}, [focusNodeId, fullGraph, baseGraph]);

	const handleGenerateGraph = () => {
		// Reset lineage view when generating new graph
		setFocusNodeId(null);
		// Increment counter - this will always trigger a new generation
		setGenerationCount((prev) => prev + 1);
	};

	const handleEdgeTypeChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		setSelectedEdgeType(event.target.value as EdgeType);
	};

	const handleViewLineage = (nodeId: string) => {
		setFocusNodeId(nodeId);
	};

	const handleImportCSV = () => {
		setShowCSVModal(true);
	};

	const handleCloseCSVModal = () => {
		setShowCSVModal(false);
	};

	return (
		<div className="relative h-full w-full">
			{/* Controls positioned on top of the canvas */}
			<div className="absolute top-4 left-4 z-10 flex items-center gap-3">
				<button
					onClick={handleGenerateGraph}
					className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-blue-700"
				>
					Generate Graph
				</button>

				<button
					onClick={handleImportCSV}
					className="rounded-md bg-green-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-green-700"
				>
					Import CSV
				</button>

				<div className="flex items-center gap-2">
					<label
						htmlFor="edge-type-select"
						className="whitespace-nowrap font-medium text-gray-700 text-sm"
					>
						Edge Type:
					</label>
					<select
						id="edge-type-select"
						value={selectedEdgeType}
						onChange={handleEdgeTypeChange}
						className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-md transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{EDGE_TYPES.map((edgeType) => (
							<option key={edgeType.value} value={edgeType.value}>
								{edgeType.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<LineageGraph
				nodes={nodes}
				edges={edges}
				edgeType={selectedEdgeType}
				onViewLineage={handleViewLineage}
				isLineageView={!!focusNodeId}
				focusNodeId={focusNodeId}
			/>

			{/* CSV Import Modal */}
			<CSVImportModal isOpen={showCSVModal} onClose={handleCloseCSVModal} />
		</div>
	);
}
