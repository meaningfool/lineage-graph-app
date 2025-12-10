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

		// Try to read headers from the Nodes file
		try {
			nCols = await parseFileHeaders(files.nodes);
		} catch (_err) {
			failedFiles.push(files.nodes?.name || "nodes.csv");
			newFiles.nodes = null;
		}

		// Try to read headers from the Edges file
		try {
			eCols = await parseFileHeaders(files.edges);
		} catch (_err) {
			failedFiles.push(files.edges?.name || "edges.csv");
			newFiles.edges = null;
		}

		// If any file failed, show an error and don't proceed
		if (failedFiles.length > 0) {
			setError(`Failed to read file(s): ${failedFiles.join(", ")}`);
			setFiles(newFiles);
			return;
		}

		// Success! Save columns and move to next step
		setColumns({ nodes: nCols, edges: eCols });
		setCurrentStep("MAP_NODES");
		setError(null);
	};

	return {
		currentStep,
		setCurrentStep,
		files,
		setNodesFile,
		setEdgesFile,
		error,
		handleUploadNext,
	};
};
