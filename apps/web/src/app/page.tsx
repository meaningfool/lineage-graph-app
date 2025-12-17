"use client";
import Papa from "papaparse";
import { useCallback, useState } from "react";
import type { Edge, Node } from "reactflow";
import Header from "@/components/header"; // We might need to move Header here or use a Context
import { LineageGraph } from "@/components/lineage-graph";
import { WelcomeDialog } from "@/components/welcome-dialog";
import {
	buildGraphFromCsv,
	type ValidatedEdgeMapping,
	type ValidatedNodeMapping,
} from "@/lib/csv-graph-importer";
import { validateGraph } from "@/lib/graph-validation";
import { mapToReactFlow } from "@/lib/reactflow-mapper";
import { getLayoutedElements } from "@/utils/layout";

export default function Home() {
	// Load node data from file
	// TODO: Remove this once we have a proper data loading mechanism
	// For now, we start with an empty graph
	// const defaultNodes: Node[] = nodeData.nodes.map((node) => ({
	// 	id: node.id,
	// 	type: "custom",
	// 	position: { x: 0, y: 0 }, // Will be overridden by layout
	// 	data: {
	// 		label: node.label,
	// 		properties: node.properties,
	// 	},
	// }));

	// const defaultEdges: Edge[] = nodeData.edges.map((edge) => ({
	// 	...edge,
	// 	type: "smoothstep",
	// }));

	// Initialize state with open welcome dialog by default
	const [showWelcome, setShowWelcome] = useState(true);
	const [showWizard, setShowWizard] = useState(false);
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [graphId, setGraphId] = useState<string>("initial");

	// Apply layout whenever nodes/edges change (or initially)
	// For now, we'll just layout the current state
	const layouted = getLayoutedElements(nodes, edges, "LR");

	const handleImport = useCallback((newNodes: Node[], newEdges: Edge[]) => {
		// For Phase 1, we just replace nodes and clear edges
		const layoutedNew = getLayoutedElements(newNodes, newEdges, "LR");
		setNodes(layoutedNew.nodes);
		setEdges(layoutedNew.edges);
		setGraphId(Date.now().toString()); // Force remount on new import
	}, []);

	const handleStartWelcome = () => {
		setShowWelcome(false);
		setShowWizard(true);
	};

	const handleLoadDemo = useCallback(async () => {
		try {
			// Fetch CSVs
			const [nodesRes, edgesRes] = await Promise.all([
				fetch("/demo/nodes.csv"),
				fetch("/demo/edges.csv"),
			]);

			if (!nodesRes.ok || !edgesRes.ok)
				throw new Error("Failed to fetch demo data");

			const nodesText = await nodesRes.text();
			const edgesText = await edgesRes.text();

			// Parse CSVs
			const nodesParsed = Papa.parse(nodesText, {
				header: true,
				skipEmptyLines: true,
			});
			const edgesParsed = Papa.parse(edgesText, {
				header: true,
				skipEmptyLines: true,
			});

			// Dynamic Property Extraction for Demo Data
			// We assume the demo file has standard columns + extra properties
			// We grab all keys from the first row that are NOT ID/Label/Type
			const firstRow = nodesParsed.data[0] as Record<string, unknown>;
			const allKeys = Object.keys(firstRow || {});
			const propertyKeys = allKeys.filter(
				(k) => !["ID", "Label", "Type"].includes(k),
			);

			// Construct Mapping
			const mapping = {
				nodes: {
					id: "ID",
					title: "Label",
					type: "Type",
					properties: propertyKeys,
				} as ValidatedNodeMapping,
				edges: {
					source: "Source",
					target: "Target",
				} as ValidatedEdgeMapping,
			};

			// 1. Build Graph (Domain Model)
			const result = buildGraphFromCsv(
				nodesParsed.data as unknown[],
				edgesParsed.data as unknown[],
				mapping,
			);

			if (result.error) {
				console.error("Demo Graph Build Error:", result.error);
				return;
			}

			// 2. Validate Graph (Cycle Detection, etc.)
			const validation = validateGraph(result.nodes, result.edges);

			// 3. Map to ReactFlow (Visuals)
			const { nodes: reactFlowNodes, edges: reactFlowEdges } = mapToReactFlow(
				result.nodes,
				result.edges,
				validation,
			);

			handleImport(reactFlowNodes, reactFlowEdges);
			setShowWelcome(false);
		} catch (error) {
			console.error("Demo load failed:", error);
		}
	}, [handleImport]);

	return (
		<div className="flex h-full w-full flex-col">
			<Header
				onImport={handleImport}
				isWizardOpen={showWizard}
				setIsWizardOpen={setShowWizard}
			/>

			<LineageGraph
				key={graphId}
				nodes={layouted.nodes}
				edges={layouted.edges}
			/>

			<WelcomeDialog
				isOpen={showWelcome}
				onClose={() => setShowWelcome(false)}
				onStart={handleStartWelcome}
				onDemoStart={handleLoadDemo}
			/>
		</div>
	);
}
