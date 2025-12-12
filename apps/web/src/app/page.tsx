"use client";
import Papa from "papaparse";
import { useCallback, useState } from "react";
import type { Edge, Node } from "reactflow";
import Header from "@/components/header"; // We might need to move Header here or use a Context
import { LineageGraph } from "@/components/lineage-graph";
import { WelcomeDialog } from "@/components/welcome-dialog";
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

			// Transform to ReactFlow (Simplified for Demo Logic - ideally share logic with Wizard)
			// But for now, we just want to prove the concept functioning
			// We can reuse the wizard logic or mapped logic if accessible, strictly we should
			// map the rows to the node format.
			// Given this is a "Demo", we know the structure matches our fixture.

			// Direct mapping based on known fixture columns
			const demoNodes: Node[] = (nodesParsed.data as any[]).map((row) => ({
				id: row.id,
				type: "custom",
				position: { x: 0, y: 0 },
				data: {
					label: row.label,
					// Filter out id, label, type for properties
					properties: Object.fromEntries(
						Object.entries(row).filter(
							([k]) => !["id", "label", "type"].includes(k),
						),
					),
				},
			}));

			const demoEdges: Edge[] = (edgesParsed.data as any[]).map((row) => ({
				id: `e-${row.source}-${row.target}`,
				source: row.source,
				target: row.target,
				type: "smoothstep",
				animated: true,
			}));

			handleImport(demoNodes, demoEdges);
			setShowWelcome(false);
		} catch (error) {
			console.error("Demo load failed:", error);
			// Optional: Show toast error
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
