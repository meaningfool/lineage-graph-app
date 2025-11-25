import React, { useCallback } from "react";
import type { Node, Edge } from "reactflow";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Upload, FileText, Check } from "lucide-react";

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (nodes: Node[], edges: Edge[]) => void;
}

export function CSVImportModal({ onClose, onImport }: CSVImportModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState<'upload' | 'mapping' | 'results'>('upload');
    const [nodesFile, setNodesFile] = React.useState<File | null>(null);
    const [edgesFile, setEdgesFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [warnings, setWarnings] = React.useState<string[]>([]);
    const [nodeColumns, setNodeColumns] = React.useState<string[]>([]);
    const [edgeColumns, setEdgeColumns] = React.useState<string[]>([]);
    const [mapping, setMapping] = React.useState<{
        id?: string;
        title?: string;
        type?: string;
        source?: string;
        target?: string;
    }>({});

    // Clear state when modal is closed
    React.useEffect(() => {
        if (!isOpen) {
            setError(null);
            setWarnings([]);
            setCurrentStep('upload');
            setNodesFile(null);
            setEdgesFile(null);
            setNodeColumns([]);
            setEdgeColumns([]);
            setMapping({});
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

    const parseFileHeaders = (file: File): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                preview: 1, // Only read first row for headers
                complete: (results) => {
                    resolve(results.meta.fields || []);
                },
                error: (err) => reject(err),
            });
        });
    };

    const parseFileFull = (file: File): Promise<Papa.ParseResult<any>> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => resolve(results),
                error: (err) => reject(err),
            });
        });
    };

    const handleUploadNext = async () => {
        if (!nodesFile) return;

        try {
            const nCols = await parseFileHeaders(nodesFile);
            setNodeColumns(nCols);

            if (edgesFile) {
                const eCols = await parseFileHeaders(edgesFile);
                setEdgeColumns(eCols);
            }

            setCurrentStep('mapping');
        } catch (err) {
            console.error("Header Parse Error:", err);
            setError("Failed to read CSV headers");
        }
    };

    const handleFinalImport = async () => {
        if (!nodesFile) return;

        setError(null);
        setWarnings([]);
        try {
            // Parse files
            const nodesResult = nodesFile ? await parseFileFull(nodesFile) : { data: [], meta: { fields: [] } };
            const edgesResult = edgesFile ? await parseFileFull(edgesFile) : null;

            const { id: idCol, title: titleCol, type: typeCol } = mapping;

            // --- NODES VALIDATION ---
            if (!idCol || !titleCol || !typeCol) {
                setError("Please map all required node columns (ID, Title, Type).");
                setCurrentStep('mapping');
                return;
            }

            let droppedNodesCount = 0;
            const validationWarnings: string[] = [];
            const seenNodeIds = new Map<string, boolean>();
            const validTypes = ["INPUT", "STEP", "OUTPUT"];

            const nodes = (nodesResult.data as any[])
                .map((row: any) => {
                    const idValue = row[idCol];
                    const titleValue = row[titleCol];
                    const typeValue = row[typeCol];

                    if (!idValue) return null;

                    if (seenNodeIds.has(idValue)) {
                        droppedNodesCount++;
                        validationWarnings.push(`${idValue}: Duplicate Node ID`);
                        return null;
                    }
                    seenNodeIds.set(idValue, true);

                    const normalizedType = typeValue?.toUpperCase();
                    if (!normalizedType || !validTypes.includes(normalizedType)) {
                        droppedNodesCount++;
                        validationWarnings.push(
                            `${idValue}: Invalid type '${typeValue || ""}'. Valid types: INPUT, STEP, OUTPUT`
                        );
                        return null;
                    }

                    return {
                        id: idValue,
                        type: "custom",
                        data: { label: titleValue },
                        position: { x: 0, y: 0 },
                    };
                }) as unknown as (Node | null)[];

            const validNodes = nodes.filter((n): n is Node => n !== null);

            if (validationWarnings.length > 0 && droppedNodesCount > 0) {
                validationWarnings.unshift(`${droppedNodesCount} node${droppedNodesCount > 1 ? "s" : ""} dropped`);
            }

            // Create a set of VALID node IDs for edge validation
            // We must use the IDs of nodes that actually survived validation
            const validNodeIds = new Set(validNodes.map((n) => n.id));

            // --- EDGES VALIDATION ---
            let edges: Edge[] = [];
            if (edgesResult) {
                // Cycle 4: Use mapped columns
                const { source: sourceCol, target: targetCol } = mapping;

                if (!sourceCol || !targetCol) {
                    setError("Please map all required edge columns (Source, Target).");
                    setCurrentStep('mapping');
                    return;
                }

                let droppedEdgesCount = 0;
                const seenEdgeKeys = new Map<string, boolean>();

                edges = (edgesResult.data as any[])
                    .map((row: any) => {
                        const sourceId = row[sourceCol];
                        const targetId = row[targetCol];

                        if (!sourceId || !targetId) return null;

                        // Deduplicate based on Source-Target pair (Silent drop)
                        const edgeKey = `${sourceId}-${targetId}`;
                        if (seenEdgeKeys.has(edgeKey)) {
                            // Silent drop for duplicates
                            return null;
                        }
                        seenEdgeKeys.set(edgeKey, true);

                        // Referential Integrity - Check against VALID nodes only
                        if (!validNodeIds.has(sourceId)) {
                            droppedEdgesCount++;
                            validationWarnings.push(`Edge dropped: Source '${sourceId}' not found`);
                            return null;
                        }
                        if (!validNodeIds.has(targetId)) {
                            droppedEdgesCount++;
                            validationWarnings.push(`Edge dropped: Target '${targetId}' not found`);
                            return null;
                        }

                        return {
                            id: `e-${sourceId}-${targetId}`,
                            source: sourceId,
                            target: targetId,
                        } as Edge;
                    })
                    .filter((edge): edge is Edge => edge !== null);

                if (droppedEdgesCount > 0) {
                    validationWarnings.push(`${droppedEdgesCount} edge${droppedEdgesCount > 1 ? "s" : ""} dropped`);
                }
            }

            // If we have warnings, show them in results step
            if (validationWarnings.length > 0) {
                setWarnings(validationWarnings);
                // Pass valid data to parent even if there are warnings (partial success)
                onImport(validNodes as unknown as Node[], edges as unknown as Edge[]);
                setCurrentStep('results');
            } else {
                // Success - show success message
                onImport(validNodes as unknown as Node[], edges as unknown as Edge[]);
                setCurrentStep('results');
            }

        } catch (err) {
            console.error("CSV Parse Error:", err);
            setError("Failed to parse CSV file");
            setCurrentStep('results');
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state on close
            setTimeout(() => {
                setNodesFile(null);
                setEdgesFile(null);
                setError(null);
                setWarnings([]);
                setCurrentStep('upload');
                setMapping({});
                setNodeColumns([]);
                setEdgeColumns([]);
            }, 300); // Small delay to allow animation to finish
        }
    };

    const handleClose = () => {
        handleOpenChange(false);
    };

    const isMappingValid = () => {
        // Cycle 2: ID, Title, and Type are required
        return !!mapping.id && !!mapping.title && !!mapping.type;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import CSV</DialogTitle>
                    <DialogDescription>
                        Import nodes and edges from CSV files.
                    </DialogDescription>
                </DialogHeader>
                <DialogHeader>
                    <DialogTitle>
                        {currentStep === 'upload' && 'Upload CSV'}
                        {currentStep === 'mapping' && 'Column Mapping'}
                        {currentStep === 'results' && 'Import Results'}
                    </DialogTitle>
                </DialogHeader>

                {currentStep === 'upload' && (
                    <div className="space-y-4">
                        {/* Nodes Dropzone */}
                        <div className="space-y-2">
                            <Label>Nodes CSV (Required)</Label>
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
                            <Label>Edges CSV (Optional)</Label>
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
                            <Button onClick={handleUploadNext} disabled={!nodesFile}>
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 'mapping' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Map your CSV columns to the required fields.</p>

                        <div className="space-y-4 border rounded-md p-4">
                            <h4 className="font-medium text-sm">Nodes</h4>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="mapping-id">Node ID</Label>
                                    <select
                                        id="mapping-id"
                                        data-testid="mapping-select-id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={mapping.id || ""}
                                        onChange={(e) => setMapping(prev => ({ ...prev, id: e.target.value || undefined }))}
                                    >
                                        <option value="">Select column...</option>
                                        {nodeColumns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mapping-title">Title</Label>
                                    <select
                                        id="mapping-title"
                                        data-testid="mapping-select-title"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={mapping.title || ""}
                                        onChange={(e) => setMapping(prev => ({ ...prev, title: e.target.value || undefined }))}
                                    >
                                        <option value="">Select column...</option>
                                        {nodeColumns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mapping-type">Type</Label>
                                    <select
                                        id="mapping-type"
                                        data-testid="mapping-select-type"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={mapping.type || ""}
                                        onChange={(e) => setMapping(prev => ({ ...prev, type: e.target.value || undefined }))}
                                    >
                                        <option value="">Select column...</option>
                                        {nodeColumns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {edgesFile && (
                            <div className="space-y-4 border rounded-md p-4">
                                <h4 className="font-medium text-sm">Edges</h4>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="mapping-source">Source Node ID</Label>
                                        <select
                                            id="mapping-source"
                                            data-testid="mapping-select-source"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={mapping.source || ""}
                                            onChange={(e) => setMapping(prev => ({ ...prev, source: e.target.value || undefined }))}
                                        >
                                            <option value="">Select column...</option>
                                            {edgeColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mapping-target">Target Node ID</Label>
                                        <select
                                            id="mapping-target"
                                            data-testid="mapping-select-target"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={mapping.target || ""}
                                            onChange={(e) => setMapping(prev => ({ ...prev, target: e.target.value || undefined }))}
                                        >
                                            <option value="">Select column...</option>
                                            {edgeColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 gap-2">
                            <Button variant="outline" onClick={() => setCurrentStep('upload')}>Back</Button>
                            <Button data-testid="mapping-next-button" onClick={handleFinalImport} disabled={!isMappingValid()}>
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 'results' && (
                    // Step 3: Results
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
                            <Button data-testid="import-close-button" onClick={handleClose}>Close</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
