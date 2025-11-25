import { useState, useCallback } from "react";
import type { Node, Edge } from "reactflow";
import {
    parseFileHeaders,
    parseFileFull,
    parseMapping,
    buildGraphFromCsv,
    type ValidatedNodeMapping,
    type ValidatedEdgeMapping,
} from "../lib/csv-graph-importer";

export interface UseCSVImportWizardProps {
    onImport: (nodes: Node[], edges: Edge[]) => void;
    onClose: () => void; // Used to close the modal after successful import
}

export function useCSVImportWizard({ onImport, onClose }: UseCSVImportWizardProps) {
    // --- State ---
    const [currentStep, setCurrentStep] = useState<"upload" | "mapping" | "results">("upload");

    const [files, setFiles] = useState<{ nodes: File | null; edges: File | null }>({
        nodes: null,
        edges: null,
    });

    const [columns, setColumns] = useState<{ nodes: string[]; edges: string[] }>({
        nodes: [],
        edges: [],
    });

    const [mapping, setMapping] = useState<{
        id?: string;
        title?: string;
        type?: string;
        source?: string;
        target?: string;
    }>({});

    const [feedback, setFeedback] = useState<{ error: string | null; warnings: string[] }>({
        error: null,
        warnings: [],
    });

    // --- Actions ---

    const reset = useCallback(() => {
        setFiles({ nodes: null, edges: null });
        setColumns({ nodes: [], edges: [] });
        setFeedback({ error: null, warnings: [] });
        setMapping({});
        setCurrentStep("upload");
    }, []);

    const setNodesFile = useCallback((file: File) => {
        setFiles((prev) => ({ ...prev, nodes: file }));
    }, []);

    const setEdgesFile = useCallback((file: File) => {
        setFiles((prev) => ({ ...prev, edges: file }));
    }, []);

    const updateMapping = useCallback((field: keyof typeof mapping, value: string | undefined) => {
        setMapping((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleUploadNext = async () => {
        if (!files.nodes || !files.edges) return;

        let nCols: string[] = [];
        let eCols: string[] = [];
        const failedFiles: string[] = [];
        let newFiles = { ...files };

        try {
            nCols = await parseFileHeaders(files.nodes);
        } catch (err) {
            failedFiles.push(files.nodes?.name || "nodes.csv");
            newFiles.nodes = null;
        }

        try {
            eCols = await parseFileHeaders(files.edges);
        } catch (err) {
            failedFiles.push(files.edges?.name || "edges.csv");
            newFiles.edges = null;
        }

        if (failedFiles.length > 0) {
            setFeedback((prev) => ({
                ...prev,
                error: `Failed to read file(s): ${failedFiles.join(", ")}`,
            }));
            setFiles(newFiles);
            return;
        }

        setColumns({ nodes: nCols, edges: eCols });
        setCurrentStep("mapping");
        setFeedback({ error: null, warnings: [] });
    };

    const handleFinalImport = async () => {
        if (!files.nodes || !files.edges) return;

        setFeedback({ error: null, warnings: [] });

        try {
            // 1. Parse Files
            const [nodesResult, edgesResult] = await Promise.all([
                parseFileFull(files.nodes),
                parseFileFull(files.edges),
            ]);

            // 2. Validate Mapping (Gatekeeper)
            const validatedMapping = parseMapping(mapping);
            if (!validatedMapping) {
                setFeedback((prev) => ({ ...prev, error: "Please complete all mapping fields." }));
                return;
            }

            // 3. Build Graph (Domain Logic)
            const result = buildGraphFromCsv(
                nodesResult.data,
                edgesResult.data,
                validatedMapping
            );

            // 4. Handle Results
            if (result.error) {
                setFeedback((prev) => ({ ...prev, error: result.error }));
                return;
            }

            // 5. Map Domain Types to React Flow Types (UI Decoupling)
            const reactFlowNodes: Node[] = result.nodes.map((n) => ({
                id: n.id,
                type: "custom",
                data: { label: n.title },
                position: { x: 0, y: 0 },
            }));

            const reactFlowEdges: Edge[] = result.edges.map((e) => ({
                id: `e-${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
            }));

            if (result.warnings.length > 0) {
                // Show warnings before closing
                setFeedback({ error: null, warnings: result.warnings });
                // We still perform the import, but show the results screen
                onImport(reactFlowNodes, reactFlowEdges);
                setCurrentStep("results");
            } else {
                // Success - Import and show success message
                onImport(reactFlowNodes, reactFlowEdges);
                setCurrentStep("results");
            }
        } catch (err) {
            console.error("CSV Parse Error:", err);
            setFeedback((prev) => ({ ...prev, error: "Failed to parse CSV file" }));
            setCurrentStep("results");
        }
    };

    const isMappingValid = () => {
        return (
            !!mapping.id &&
            !!mapping.title &&
            !!mapping.type &&
            !!mapping.source &&
            !!mapping.target &&
            mapping.source !== mapping.target
        );
    };

    return {
        // State
        currentStep,
        files,
        columns,
        mapping,
        feedback,

        // Computed
        isMappingValid: isMappingValid(),

        // Actions
        actions: {
            setNodesFile,
            setEdgesFile,
            updateMapping,
            handleUploadNext,
            handleFinalImport,
            reset,
            setCurrentStep, // Exposed for "Back" button
        },
    };
}
