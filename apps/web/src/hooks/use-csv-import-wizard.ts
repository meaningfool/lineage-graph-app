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
import { validateGraph } from "../lib/graph-validation";

// --- PROPS ---
// These are the inputs this hook needs to function.
export interface UseCSVImportWizardProps {
    onImport: (nodes: Node[], edges: Edge[]) => void; // Callback to save data
    onClose: () => void; // Callback to close the modal
}

// --- CUSTOM HOOK ---
// A custom hook is just a function that uses other React hooks (like useState).
// We use it to group all the "brain" logic of the wizard in one place.
export function useCSVImportWizard({ onImport, onClose }: UseCSVImportWizardProps) {

    // --- STATE ---
    // useState creates a variable that React "watches". 
    // When we change it (using setSomething), React re-renders the component.

    // Tracks which step of the wizard is currently visible.
    const [currentStep, setCurrentStep] = useState<"upload" | "mapping" | "results">("upload");

    // Stores the actual File objects selected by the user.
    const [files, setFiles] = useState<{ nodes: File | null; edges: File | null }>({
        nodes: null,
        edges: null,
    });

    // Stores the list of column headers (e.g., ["id", "name", "date"]) found in the CSVs.
    const [columns, setColumns] = useState<{ nodes: string[]; edges: string[] }>({
        nodes: [],
        edges: [],
    });

    // Stores how the user has mapped CSV columns to our required fields.
    // e.g., { id: "User ID", title: "Full Name" }
    const [mapping, setMapping] = useState<{
        id?: string;
        title?: string;
        type?: string;
        source?: string;
        target?: string;
    }>({});

    // Stores error messages or warnings to display to the user.
    const [feedback, setFeedback] = useState<{ error: string | null; warnings: string[] }>({
        error: null,
        warnings: [],
    });

    // --- ACTIONS ---
    // These are functions that update our state.

    // useCallback "remembers" the function so it doesn't get re-created on every render.
    // This is good for performance when passing functions to child components.
    const setNodesFile = useCallback((file: File) => {
        setFiles((prev) => ({ ...prev, nodes: file }));
    }, []);

    const setEdgesFile = useCallback((file: File) => {
        setFiles((prev) => ({ ...prev, edges: file }));
    }, []);

    // Updates a single field in the mapping state.
    const updateMapping = useCallback((field: keyof typeof mapping, value: string | undefined) => {
        setMapping((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Called when user clicks "Next" on the Upload step.
    // It reads the file headers to prepare for the Mapping step.
    const handleUploadNext = async () => {
        if (!files.nodes || !files.edges) return;

        let nCols: string[] = [];
        let eCols: string[] = [];
        const failedFiles: string[] = [];
        let newFiles = { ...files };

        // Try to read headers from the Nodes file
        try {
            nCols = await parseFileHeaders(files.nodes);
        } catch (err) {
            failedFiles.push(files.nodes?.name || "nodes.csv");
            newFiles.nodes = null; // Clear invalid file
        }

        // Try to read headers from the Edges file
        try {
            eCols = await parseFileHeaders(files.edges);
        } catch (err) {
            failedFiles.push(files.edges?.name || "edges.csv");
            newFiles.edges = null; // Clear invalid file
        }

        // If any file failed, show an error and don't proceed
        if (failedFiles.length > 0) {
            setFeedback((prev) => ({
                ...prev,
                error: `Failed to read file(s): ${failedFiles.join(", ")}`,
            }));
            setFiles(newFiles);
            return;
        }

        // Success! Save columns and move to next step
        setColumns({ nodes: nCols, edges: eCols });
        setCurrentStep("mapping");
        setFeedback({ error: null, warnings: [] });
    };

    // Called when user clicks "Import" on the Mapping step.
    // This is the main logic that processes the files.
    const handleFinalImport = async () => {
        if (!files.nodes || !files.edges) return;

        setFeedback({ error: null, warnings: [] });

        try {
            // 1. Parse Files
            // We read both files in parallel using Promise.all
            const [nodesResult, edgesResult] = await Promise.all([
                parseFileFull(files.nodes),
                parseFileFull(files.edges),
            ]);

            // 2. Validate Mapping (Gatekeeper)
            // Ensure we have all the required fields mapped
            const validatedMapping = parseMapping(mapping);
            if (!validatedMapping) {
                setFeedback((prev) => ({ ...prev, error: "Please complete all mapping fields." }));
                return;
            }

            // 3. Build Graph (Domain Logic)
            // This function (in csv-graph-importer.ts) does the heavy lifting:
            // - Validates data types
            // - Checks for duplicates
            // - Ensures edges connect to valid nodes
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

            // 5. Run Graph Validation (Orphans, Cycles, etc.)
            const validationErrors = validateGraph(result.nodes, result.edges);

            // 6. Map Domain Types to React Flow Types (UI Decoupling)
            // We convert our internal "GraphNode" format to the format "ReactFlow" expects.
            const reactFlowNodes: Node[] = result.nodes.map((n) => ({
                id: n.id,
                type: "custom", // Our custom node type
                data: {
                    label: n.title,
                    validationErrors: validationErrors.get(n.id)
                },
                position: { x: 0, y: 0 }, // Default position (layout will fix this later)
            }));

            const reactFlowEdges: Edge[] = result.edges.map((e) => ({
                id: `e-${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
            }));

            if (result.warnings.length > 0) {
                // If there are warnings (e.g., some rows dropped), show them to the user.
                setFeedback({ error: null, warnings: result.warnings });
                // We still perform the import!
                onImport(reactFlowNodes, reactFlowEdges);
                setCurrentStep("results");
            } else {
                // Perfect import!
                onImport(reactFlowNodes, reactFlowEdges);
                setCurrentStep("results");
            }
        } catch (err) {
            console.error("CSV Parse Error:", err);
            setFeedback((prev) => ({ ...prev, error: "Failed to parse CSV file" }));
            setCurrentStep("results");
        }
    };

    // Helper to check if the mapping form is complete
    const isMappingValid = () => {
        return (
            !!mapping.id &&
            !!mapping.title &&
            !!mapping.type &&
            !!mapping.source &&
            !!mapping.target &&
            mapping.source !== mapping.target // Source and Target columns shouldn't be the same
        );
    };

    // Return everything the UI needs
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
            setCurrentStep, // Exposed for "Back" button
        },
    };
}
