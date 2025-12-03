import React from "react";
import type { Node, Edge } from "reactflow";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useCSVImportWizard } from "@/hooks/use-csv-import-wizard";
import { StepUpload } from "./csv-import/step-upload";
import { StepMapping } from "./csv-import/step-mapping";
import { StepResults } from "./csv-import/step-results";

// --- INTERFACES ---
// Interfaces define the "contract" for our component.
// They tell other developers (and TypeScript) what data this component needs to work.
interface CSVImportModalProps {
    // onImport: A function we call when the import is successful.
    // It passes the final Nodes and Edges back to the parent component (Header.tsx)
    // so it can update the main graph.
    onImport: (nodes: Node[], edges: Edge[]) => void;

    // onClose: A function to close this modal.
    // We call this when the user clicks "Cancel" or when the import is done.
    onClose: () => void;
}

export function CSVImportModal({ onImport, onClose }: CSVImportModalProps) {
    // --- STATE MANAGEMENT ---
    // Instead of keeping all the logic (state, file parsing, validation) inside this component,
    // we moved it to a custom hook called `useCSVImportWizard`.
    // This keeps our UI component clean and focused only on *rendering*.
    const {
        currentStep,    // Which step are we on? 'upload' -> 'mapping' -> 'results'
        files,          // The files the user selected
        columns,        // The headers found in the CSV files
        mapping,        // How the user mapped CSV columns to our fields
        feedback,       // Any errors or warnings to show
        isMappingValid, // Helper to check if the user can proceed
        actions,        // Functions to update state (e.g., setNodesFile, updateMapping)
    } = useCSVImportWizard({
        onImport,
        onClose,
    });

    // --- RENDER ---
    // The Dialog component handles the modal window overlay.
    // open={true}: We force it open because the parent controls whether this component is rendered.
    // onOpenChange: If the user clicks outside or hits Escape, we call onClose().
    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import CSV</DialogTitle>
                    <DialogDescription>
                        Import nodes and edges from CSV files.
                    </DialogDescription>
                </DialogHeader>

                {/* Dynamic Header based on the current step */}


                {/* --- STEP 1: UPLOAD --- */}
                {/* We only show this block if currentStep is 'upload' */}
                {currentStep === 'upload' && (
                    <StepUpload
                        files={files}
                        onUploadNodes={actions.setNodesFile}
                        onUploadEdges={actions.setEdgesFile}
                        onNext={actions.handleUploadNext}
                        error={feedback.error}
                    />
                )}

                {/* --- STEP 2: MAPPING --- */}
                {/* This step lets the user match their CSV columns to our data model */}
                {currentStep === 'mapping' && (
                    <StepMapping
                        columns={columns}
                        mapping={mapping}
                        onChange={actions.updateMapping}
                        onNext={actions.handleFinalImport}
                        onBack={() => actions.setCurrentStep('upload')}
                        isValid={isMappingValid}
                        hasEdgesFile={!!files.edges}
                    />
                )}

                {/* --- STEP 3: RESULTS --- */}
                {/* Shows success message or warnings after processing */}
                {currentStep === 'results' && (
                    <StepResults
                        feedback={feedback}
                        onClose={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
