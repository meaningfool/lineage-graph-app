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
    onImport: (nodes: any[]) => void;
}

export function CSVImportModal({ onImport }: CSVImportModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [warnings, setWarnings] = React.useState<string[]>([]);
    const [currentStep, setCurrentStep] = React.useState<'upload' | 'results'>('upload');

    // Clear error, warnings, and reset step when modal is closed
    React.useEffect(() => {
        if (!isOpen) {
            setError(null);
            setWarnings([]);
            setCurrentStep('upload');
        }
    }, [isOpen]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                setError(null); // Clear previous errors
                setWarnings([]); // Clear previous warnings

                Papa.parse(file, {
                    header: true,
                    complete: (results) => {
                        // File-Level Validation: Check for required columns
                        const requiredColumns = ["id", "title", "type"];
                        const headers = results.meta.fields || [];
                        const missingColumns = requiredColumns.filter(
                            (col) => !headers.includes(col)
                        );

                        if (missingColumns.length > 0) {
                            setError(`Missing required columns: ${missingColumns.join(", ")}`);
                            setCurrentStep('results');
                            return;
                        }

                        // Row-Level Validation: Validate node types and deduplicate
                        const validTypes = ["INPUT", "STEP", "OUTPUT"];
                        const validationWarnings: string[] = [];
                        let droppedCount = 0;
                        const seenIds = new Map<string, boolean>();

                        const nodes = results.data
                            .map((row: any, index: number) => {
                                // Check if required fields are present
                                if (!row.id || !row.title) {
                                    return null;
                                }

                                // Check for duplicate IDs
                                if (seenIds.has(row.id)) {
                                    droppedCount++;
                                    validationWarnings.push(
                                        `${row.id}: Duplicate ID`
                                    );
                                    return null;
                                }
                                seenIds.set(row.id, true);

                                // Validate node type
                                const normalizedType = row.type?.toUpperCase();
                                if (!normalizedType || !validTypes.includes(normalizedType)) {
                                    droppedCount++;
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

                        // Set warnings if any rows were dropped
                        if (droppedCount > 0) {
                            setWarnings([
                                `${droppedCount} row${droppedCount > 1 ? "s" : ""} dropped`,
                                ...validationWarnings,
                            ]);
                        }

                        onImport(nodes);

                        // Transition to results step (don't auto-close anymore)
                        setCurrentStep('results');
                    },
                    error: (parseError) => {
                        console.error("CSV Parse Error:", parseError);
                        setError("Failed to parse CSV file");
                        setCurrentStep('results');
                    },
                });
            }
        },
        [onImport],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
        },
        multiple: false,
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{currentStep === 'upload' ? 'Upload CSV' : 'Import Results'}</DialogTitle>
                </DialogHeader>

                {currentStep === 'upload' ? (
                    // Step 1: Upload
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                            ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"}
                        `}
                    >
                        <input {...getInputProps()} />
                        {isDragActive ? (
                            <p>Drop the CSV file here...</p>
                        ) : (
                            <p>Drag & drop a CSV file here, or click to select</p>
                        )}
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
