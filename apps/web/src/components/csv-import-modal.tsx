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
    isOpen?: boolean; // Optional controlled state
    onClose?: () => void; // Optional controlled close handler
    onImport: (nodes: Node[], edges: Edge[]) => void;
}

export function CSVImportModal({ isOpen: controlledIsOpen, onClose: controlledOnClose, onImport }: CSVImportModalProps) {
    const [internalIsOpen, setInternalIsOpen] = React.useState(false);

    // Determine effective state (Controlled vs Uncontrolled)
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const handleClose = () => {
        if (isControlled && controlledOnClose) {
            controlledOnClose();
        } else {
            setInternalIsOpen(false);
        }
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
        if (isControlled && controlledOnClose) {
            if (!open) controlledOnClose();
        } else {
            setInternalIsOpen(open);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent
                className="sm:max-w-[600px]"
                onAnimationEnd={() => {
                    if (!isOpen) actions.reset();
                }}
            >
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
