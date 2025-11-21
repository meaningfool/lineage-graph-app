import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface CSVImportModalProps {
    onImport: (nodes: any[], edges: any[]) => void;
}

export function CSVImportModal({ onImport }: CSVImportModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [warnings, setWarnings] = React.useState<string[]>([]);
    const [currentStep, setCurrentStep] = React.useState<'upload' | 'results'>('upload');
    const [nodesFile, setNodesFile] = React.useState<File | null>(null);
    const [edgesFile, setEdgesFile] = React.useState<File | null>(null);

    // Clear state when modal is closed
    React.useEffect(() => {
        if (!isOpen) {
            setError(null);
            setWarnings([]);
            setCurrentStep('upload');
            setNodesFile(null);
            setEdgesFile(null);
        }
    }, [isOpen]);

    const onDropNodes = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) setNodesFile(acceptedFiles[0]);
    }, []);

    const onDropEdges = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) setEdgesFile(acceptedFiles[0]);
    }, []);

    const { getRootProps: getNodesRootProps, getInputProps: getNodesInputProps, isDragActive: isNodesDragActive } = useDropzone({
        onDrop: onDropNodes,
        accept: { "text/csv": [".csv"] },
        multiple: false,
    });

    const { getRootProps: getEdgesRootProps, getInputProps: getEdgesInputProps, isDragActive: isEdgesDragActive } = useDropzone({
        onDrop: onDropEdges,
        accept: { "text/csv": [".csv"] },
        multiple: false,
    });

    const parseFile = (file: File): Promise<Papa.ParseResult<any>> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => resolve(results),
                error: (err) => reject(err),
            });
        });
    };

    const handleImport = async () => {
        if (!nodesFile) return;

        setError(null);
        setWarnings([]);

        try {
            const [nodesResult, edgesResult] = await Promise.all([
                parseFile(nodesFile),
                edgesFile ? parseFile(edgesFile) : Promise.resolve(null),
            ]);

            // --- NODES VALIDATION ---
            const nodesRequiredColumns = ["id", "title", "type"];
            const nodesHeaders = nodesResult.meta.fields || [];
            const nodesMissingColumns = nodesRequiredColumns.filter(
                (col) => !nodesHeaders.includes(col)
            );

            if (nodesMissingColumns.length > 0) {
                setError(`Missing required columns in nodes file: ${nodesMissingColumns.join(", ")}`);
                setCurrentStep('results');
                return;
            }

            const validTypes = ["INPUT", "STEP", "OUTPUT"];
            const validationWarnings: string[] = [];
            let droppedNodesCount = 0;
            const seenNodeIds = new Map<string, boolean>();

            const nodes = nodesResult.data
                .map((row: any) => {
                    if (!row.id || !row.title) return null;

                    if (seenNodeIds.has(row.id)) {
                        droppedNodesCount++;
                        validationWarnings.push(`${row.id}: Duplicate Node ID`);
                        return null;
                    }
                    seenNodeIds.set(row.id, true);

                    const normalizedType = row.type?.toUpperCase();
                    if (!normalizedType || !validTypes.includes(normalizedType)) {
                        droppedNodesCount++;
                        validationWarnings.push(
                            `${row.id}: Invalid type '${row.type || ""}'. Valid types: INPUT, STEP, OUTPUT`
                        );
                        return null;
                    }

                    return {
                        id: row.id,
                        type: "custom",
                        data: { label: row.title },
                        position: { x: 0, y: 0 },
                    };
                })
                .filter((node): node is NonNullable<typeof node> => node !== null);

            if (droppedNodesCount > 0) {
                validationWarnings.unshift(`${droppedNodesCount} node${droppedNodesCount > 1 ? "s" : ""} dropped`);
            }

            // Create a set of VALID node IDs for edge validation
            const validNodeIds = new Set(nodes.map((n) => n.id));

            // --- EDGES VALIDATION ---
            let edges: any[] = [];
            if (edgesResult) {
                const edgesRequiredColumns = ["id", "source", "target"];
                const edgesHeaders = edgesResult.meta.fields || [];
                const edgesMissingColumns = edgesRequiredColumns.filter(
                    (col) => !edgesHeaders.includes(col)
                );

                if (edgesMissingColumns.length > 0) {
                    setError(`Missing required columns in edges file: ${edgesMissingColumns.join(", ")}`);
                    setCurrentStep('results');
                    return;
                }

                let droppedEdgesCount = 0;
                const seenEdgeIds = new Map<string, boolean>();

                edges = edgesResult.data
                    .map((row: any) => {
                        if (!row.id || !row.source || !row.target) return null;

                        if (seenEdgeIds.has(row.id)) {
                            droppedEdgesCount++;
                            validationWarnings.push(`${row.id}: Duplicate Edge ID`);
                            return null;
                        }
                        seenEdgeIds.set(row.id, true);

                        // Referential Integrity - Check against VALID nodes only
                        if (!validNodeIds.has(row.source)) {
                            droppedEdgesCount++;
                            validationWarnings.push(`Edge dropped: Source '${row.source}' not found`);
                            return null;
                        }
                        if (!validNodeIds.has(row.target)) {
                            droppedEdgesCount++;
                            validationWarnings.push(`Edge dropped: Target '${row.target}' not found`);
                            return null;
                        }

                        return {
                            id: row.id,
                            source: row.source,
                            target: row.target,
                            type: "smoothstep",
                        };
                    })
                    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

                if (droppedEdgesCount > 0) {
                    validationWarnings.push(`${droppedEdgesCount} edge${droppedEdgesCount > 1 ? "s" : ""} dropped`);
                }
            }

            if (validationWarnings.length > 0) {
                setWarnings(validationWarnings);
            }

            onImport(nodes, edges);
            setCurrentStep('results');

        } catch (err) {
            console.error("CSV Parse Error:", err);
            setError("Failed to parse CSV file");
            setCurrentStep('results');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{currentStep === 'upload' ? 'Upload CSV' : 'Import Results'}</DialogTitle>
                </DialogHeader>

                {currentStep === 'upload' ? (
                    <div className="space-y-4">
                        {/* Nodes Dropzone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nodes CSV (Required)</label>
                            <div
                                {...getNodesRootProps()}
                                data-testid="dropzone-nodes"
                                className={`
                                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                    ${isNodesDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"}
                                    ${nodesFile ? "bg-green-50 dark:bg-green-900/10 border-green-500" : ""}
                                `}
                            >
                                <input {...getNodesInputProps()} />
                                {nodesFile ? (
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{nodesFile.name}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Drag & drop nodes.csv here</p>
                                )}
                            </div>
                        </div>

                        {/* Edges Dropzone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Edges CSV (Optional)</label>
                            <div
                                {...getEdgesRootProps()}
                                data-testid="dropzone-edges"
                                className={`
                                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                    ${isEdgesDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"}
                                    ${edgesFile ? "bg-green-50 dark:bg-green-900/10 border-green-500" : ""}
                                `}
                            >
                                <input {...getEdgesInputProps()} />
                                {edgesFile ? (
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{edgesFile.name}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Drag & drop edges.csv here</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleImport} disabled={!nodesFile}>
                                Import
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Step 2: Results
                    <div className="space-y-4">
                        {error ? (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        ) : warnings.length > 0 ? (
                            <div className="rounded-md bg-yellow-500/15 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                                <div className="font-semibold mb-1">{warnings[0]}</div>
                                {warnings.slice(1).map((warning, index) => (
                                    <div key={index} className="text-xs mt-1">{warning}</div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400">
                                Import successful
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button data-testid="import-close-button" onClick={() => setIsOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
