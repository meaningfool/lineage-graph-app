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

interface CSVImportModalProps {
    onImport: (nodes: Node[], edges: Edge[]) => void;
    onClose: () => void;
}

export function CSVImportModal({ onImport, onClose }: CSVImportModalProps) {
    const {
        currentStep,
        files,
        columns,
        mapping,
        feedback,
        isMappingValid,
        actions,
    } = useCSVImportWizard({
        onImport,
        onClose,
    });

    // No internal open state or reset logic needed!
    // The component is unmounted when closed by the parent.

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
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
                    <StepUpload
                        files={files}
                        onUploadNodes={actions.setNodesFile}
                        onUploadEdges={actions.setEdgesFile}
                        onNext={actions.handleUploadNext}
                        error={feedback.error}
                    />
                )}

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
