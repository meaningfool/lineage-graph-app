import { useCallback, useState } from "react";
import type { Edge, Node } from "reactflow";
import {
	buildGraphFromCsv,
	parseFileFull,
	parseFileHeaders,
	parseMapping,
} from "../lib/csv-graph-importer";
import { validateGraph } from "../lib/graph-validation";
import { mapToReactFlow } from "../lib/reactflow-mapper";

interface UseNewImportWizardProps {
	onImport?: (nodes: Node[], edges: Edge[]) => void;
	onClose?: () => void;
}

type Step = "UPLOAD" | "MAP_NODES" | "MAP_EDGES" | "SUCCESS";

export const useNewImportWizard = ({
	onImport,
	onClose,
}: UseNewImportWizardProps = {}) => {
	const [currentStep, setCurrentStep] = useState<Step>("UPLOAD");
	const [files, setFiles] = useState<{
		nodes: File | null;
		edges: File | null;
	}>({
		nodes: null,
		edges: null,
	});
	const [error, setError] = useState<string | null>(null);
	const [columns, setColumns] = useState<{ nodes: string[]; edges: string[] }>({
		nodes: [],
		edges: [],
	});

	const setNodesFile = useCallback((file: File) => {
		setFiles((prev) => ({ ...prev, nodes: file }));
		setError(null);
	}, []);

	const setEdgesFile = useCallback((file: File) => {
		setFiles((prev) => ({ ...prev, edges: file }));
		setError(null);
	}, []);

	// [NEW] Mapping State
	const [mapping, setMapping] = useState<{
		id?: string;
		title?: string;
		type?: string;
		source?: string;
		target?: string;
		// NOTE: properties is handled by the generic object but likely unused in this slice's validation
		[key: string]: string | undefined;
	}>({});

	// [NEW] Update Logic
	const setMappingValue = useCallback((field: string, value: string) => {
		setMapping((prev) => ({ ...prev, [field]: value }));
	}, []);

	// [NEW] Validation Logic
	const isMappingValid =
		currentStep === "MAP_NODES"
			? !!mapping.id && !!mapping.title && !!mapping.type
			: currentStep === "MAP_EDGES"
				? !!mapping.source &&
					!!mapping.target &&
					mapping.source !== mapping.target
				: false;

	// Actions
	const handleUploadNext = async () => {
		if (!files.nodes || !files.edges) return;

		let nCols: string[] = [];
		let eCols: string[] = [];
		const failedFiles: string[] = [];
		const newFiles = { ...files };

		try {
			nCols = await parseFileHeaders(files.nodes);
		} catch (_err) {
			failedFiles.push(files.nodes?.name || "nodes.csv");
			newFiles.nodes = null;
		}

		try {
			eCols = await parseFileHeaders(files.edges);
		} catch (_err) {
			failedFiles.push(files.edges?.name || "edges.csv");
			newFiles.edges = null;
		}

		if (failedFiles.length > 0) {
			setError(`Failed to read file(s): ${failedFiles.join(", ")}`);
			setFiles(newFiles);
			return;
		}

		setColumns({ nodes: nCols, edges: eCols });
		setCurrentStep("MAP_NODES");
	};

	const reset = useCallback(() => {
		setCurrentStep("UPLOAD");
		setFiles({ nodes: null, edges: null });
		setColumns({ nodes: [], edges: [] });
		setMapping({});
		setError(null);
	}, []);

	const handleGenerateGraph = async () => {
		if (!files.nodes || !files.edges) return;

		try {
			// 1. Parse Files (Parallel)
			const [nodesResult, edgesResult] = await Promise.all([
				parseFileFull(files.nodes),
				parseFileFull(files.edges),
			]);

			// 2. Validate Mapping
			const validatedMapping = parseMapping(mapping);
			if (!validatedMapping) {
				return;
			}

			// 3. Build Graph
			const result = buildGraphFromCsv(
				nodesResult.data,
				edgesResult.data,
				validatedMapping,
			);

			if (result.error) {
				setError(result.error);
				return; // Keep on same step but show error
			}

			// 4. Validate Graph
			const validation = validateGraph(result.nodes, result.edges);

			// 5. Map to ReactFlow
			const { nodes: reactFlowNodes, edges: reactFlowEdges } = mapToReactFlow(
				result.nodes,
				result.edges,
				validation,
			);

			// 6. Update Global State
			if (onImport) {
				onImport(reactFlowNodes, reactFlowEdges);
			}

			setCurrentStep("SUCCESS");
			setError(null);
		} catch (err) {
			console.error("Graph Generation Failed", err);
			setError("Failed to generate graph. Please check console.");
		}
	};

	return {
		currentStep,
		setCurrentStep,
		files,
		setNodesFile,
		setEdgesFile,
		error,
		mapping,
		updateMapping: setMappingValue,
		isMappingValid,
		columns,
		actions: {
			handleUploadNext,
			handleGenerateGraph,
			reset,
			setNodesFile,
			setEdgesFile,
			updateMapping: setMappingValue,
			setCurrentStep,
		},
	};
};
