import { useCallback, useState } from "react";
import { parseFileHeaders } from "../lib/csv-graph-importer";

type Step = "UPLOAD" | "MAP_NODES" | "MAP_EDGES" | "SUCCESS";

export const useNewImportWizard = () => {
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

	const handleUploadNext = async () => {
		if (!files.nodes || !files.edges) return;

		let nCols: string[] = [];
		let eCols: string[] = [];
		const failedFiles: string[] = [];
		const newFiles = { ...files };

		const errorParts: string[] = [];

		// Try to read headers from the Nodes file
		try {
			nCols = await parseFileHeaders(files.nodes);
		} catch (_err) {
			errorParts.push(`Nodes file (${files.nodes?.name})`);
			newFiles.nodes = null;
		}

		// Try to read headers from the Edges file
		try {
			eCols = await parseFileHeaders(files.edges);
		} catch (_err) {
			errorParts.push(`Edges file (${files.edges?.name})`);
			newFiles.edges = null;
		}

		// If any file failed, show an error and don't proceed
		if (errorParts.length > 0) {
			setError(`Failed to read ${errorParts.join(" and ")}`);
			setFiles(newFiles);
			return;
		}

		// Success! Save columns and move to next step
		setColumns({ nodes: nCols, edges: eCols });
		setCurrentStep("MAP_NODES");
		setError(null);
	};

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
			: false;

	return {
		currentStep,
		setCurrentStep,
		files,
		setNodesFile,
		setEdgesFile,
		error,
		handleUploadNext,
		mapping,
		updateMapping: setMappingValue,
		isMappingValid,
		columns,
	};
};
