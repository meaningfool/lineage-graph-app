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
}

export function CSVImportModal({ onImport }: CSVImportModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleClose = () => {
        setIsOpen(false);
    };

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
        onClose: handleClose,
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            actions.reset();
        }
        setIsOpen(open);
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
                        onClose={handleClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
