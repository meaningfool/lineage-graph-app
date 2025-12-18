import { useCallback, useState } from "react";
import type { Edge, Node } from "reactflow";
import {
	buildGraphFromCsv,
	type ImportReport,
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
		// Uncheck from properties if selected (Slice 6 polish)
		setSelectedProperties((prev) => prev.filter((p) => p !== value));
	}, []);

	// [NEW] Structured Warning Report
	const [report, setReport] = useState<ImportReport>({
		nodes: { droppedCount: 0, errors: [] },
		edges: { droppedCount: 0, errors: [] },
		general: [],
	});

	// [NEW] Slice 6: Properties Mapping state
	const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

	const toggleProperty = useCallback((property: string) => {
		setSelectedProperties((prev) => {
			if (prev.includes(property)) {
				return prev.filter((p) => p !== property);
			}
			return [...prev, property];
		});
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
			// biome-ignore lint/suspicious/noExplicitAny: PapaParse expects File but types can be strict
			nCols = await parseFileHeaders(files.nodes as any);
		} catch (_err) {
			failedFiles.push(files.nodes?.name || "nodes.csv");
			newFiles.nodes = null;
		}

		try {
			// biome-ignore lint/suspicious/noExplicitAny: PapaParse expects File but types can be strict
			eCols = await parseFileHeaders(files.edges as any);
		} catch (_err) {
			failedFiles.push(files.edges?.name || "edges.csv");
			newFiles.edges = null;
		}

		if (failedFiles.length > 0) {
			let errorMessage = "";
			if (
				failedFiles.includes(files.nodes?.name || "nodes.csv") &&
				failedFiles.includes(files.edges?.name || "edges.csv")
			) {
				errorMessage = `Failed to read Nodes file (${files.nodes?.name}) and Edges file (${files.edges?.name})`;
			} else if (failedFiles.includes(files.nodes?.name || "nodes.csv")) {
				errorMessage = `Failed to read Nodes file (${files.nodes?.name})`;
			} else {
				errorMessage = `Failed to read Edges file (${files.edges?.name})`;
			}
			setError(errorMessage);
			setFiles(newFiles);
			return;
		}

		setColumns({ nodes: nCols, edges: eCols });

		// [FIX] Persist Unselected State:
		// If we already have mappings (e.g. user went Back -> Next), don't re-select mapped fields.
		// We filter out any column that is ALREADY mapped to ID/Label/Type.
		const mappedValues = Object.values(mapping).filter(Boolean);
		const initialSelection = nCols.filter((col) => !mappedValues.includes(col));

		setSelectedProperties(initialSelection);
		setCurrentStep("MAP_NODES");
	};

	const reset = useCallback(() => {
		setCurrentStep("UPLOAD");
		setFiles({ nodes: null, edges: null });
		setColumns({ nodes: [], edges: [] });
		setMapping({});
		setSelectedProperties([]);
		setError(null);
		setReport({
			nodes: { droppedCount: 0, errors: [] },
			edges: { droppedCount: 0, errors: [] },
			general: [],
		});
	}, []);

	const handleGenerateGraph = async () => {
		if (!files.nodes || !files.edges) return;

		try {
			// 1. Parse Files (Parallel)
			const [nodesResult, edgesResult] = await Promise.all([
				// biome-ignore lint/suspicious/noExplicitAny: PapaParse expects File but types can be strict
				parseFileFull(files.nodes as any),
				// biome-ignore lint/suspicious/noExplicitAny: PapaParse expects File but types can be strict
				parseFileFull(files.edges as any),
			]);

			// 2. Validate Mapping
			const validatedMapping = parseMapping(mapping);
			if (!validatedMapping) {
				return;
			}

			// Inject selected properties into mapping for domain function
			validatedMapping.nodes.properties = selectedProperties;

			// 3. Build Graph
			const result = buildGraphFromCsv(
				nodesResult.data as unknown[],
				edgesResult.data as unknown[],
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

			setReport(result.report);
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
		report,
		mapping,
		selectedProperties,
		updateMapping: setMappingValue,
		toggleProperty,
		isMappingValid,
		columns,
		actions: {
			handleUploadNext,
			handleGenerateGraph,
			reset,
			setNodesFile,
			setEdgesFile,
			updateMapping: setMappingValue,
			toggleProperty,
			setCurrentStep,
		},
	};
};
