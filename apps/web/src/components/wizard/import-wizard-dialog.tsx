import { ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";
import type { Edge, Node } from "reactflow";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useNewImportWizard } from "@/hooks/use-new-import-wizard";
import { cn } from "@/lib/utils";
import { MappingTable } from "./mapping-table";
import { UploadStep } from "./upload-step";

interface ImportWizardDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (nodes: Node[], edges: Edge[]) => void;
}

type Step = "UPLOAD" | "MAP_NODES" | "MAP_EDGES" | "SUCCESS";

const STEPS: { id: Step; label: string; index: number }[] = [
	{ id: "UPLOAD", label: "Upload", index: 1 },
	{ id: "MAP_NODES", label: "Map Nodes", index: 2 },
	{ id: "MAP_EDGES", label: "Map Edges", index: 3 },
	{ id: "SUCCESS", label: "Success", index: 4 },
];

export function ImportWizardDialog({
	isOpen,
	onClose,
	onImport,
}: ImportWizardDialogProps) {
	const {
		currentStep,
		files,
		actions: {
			setNodesFile,
			setEdgesFile,
			updateMapping,
			handleUploadNext,
			handleGenerateGraph,
			setCurrentStep,
			reset,
		},
		columns,
		mapping,
		isMappingValid,
		error, // Keep error as it's used later
	} = useNewImportWizard({
		onImport,
		onClose,
	});

	// --- Navigation Helpers ---
	const handleClose = () => {
		reset();
		onClose();
	};

	const handleNext = async () => {
		if (currentStep === "UPLOAD") {
			handleUploadNext();
		} else if (currentStep === "MAP_NODES") {
			setCurrentStep("MAP_EDGES");
		} else if (currentStep === "MAP_EDGES") {
			await handleGenerateGraph();
		} else {
			// Close or Reset
			handleClose();
		}
	};

	const handleBack = () => {
		if (currentStep === "MAP_NODES") setCurrentStep("UPLOAD");
		else if (currentStep === "MAP_EDGES") setCurrentStep("MAP_NODES");
		// Success has no back, usually
	};

	const handleImportAnother = () => {
		reset();
	};

	const isNextDisabled = () => {
		if (currentStep === "UPLOAD") {
			// Require both files to proceed (as per slice 1 tests/requirements, particularly test 2 and 3)
			// Test 3: "should disable next button if only nodes uploaded"
			return !files.nodes || !files.edges;
		}
		if (currentStep === "MAP_NODES" || currentStep === "MAP_EDGES") {
			return !isMappingValid;
		}
		return false;
	};

	// --- Step Components (Placeholders) ---
	const renderMapping = (type: "NODES" | "EDGES") => (
		<div
			className="flex h-full w-full flex-col"
			data-testid={`step-map-${type.toLowerCase()}`}
		>
			<MappingTable
				type={type}
				columns={type === "NODES" ? columns.nodes : columns.edges}
				mapping={mapping}
				onChange={updateMapping}
			/>
		</div>
	);

	const renderSuccess = () => (
		<div
			className="flex flex-col items-center justify-center space-y-4 py-12"
			data-testid="wizard-step-success"
		>
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<Check className="h-8 w-8 text-green-600" />
			</div>
			<h3 className="font-medium text-lg">Import successful</h3>
			<p className="text-gray-500 text-sm">
				Your data has been successfully imported into the graph.
			</p>
		</div>
	);

	const currentStepIndex = STEPS.find((s) => s.id === currentStep)?.index || 1;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent
				showCloseButton={false}
				className="max-w-[95vw] gap-0 overflow-hidden p-0 sm:max-w-4xl"
			>
				{/* Header (Superdesign Style) */}
				<DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b px-6 py-4">
					<div>
						<DialogTitle className="text-xl">Import Graph Data</DialogTitle>
						<p className="text-gray-500 text-sm">
							Upload CSV files to generate your lineage graph
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-gray-500 hover:text-gray-900"
						onClick={handleClose}
						data-testid="import-close-button"
					>
						<X className="h-4 w-4" />
					</Button>
				</DialogHeader>

				{/* Body */}
				<div className="flex h-[550px] flex-col gap-6 bg-gray-50/50 p-6">
					{/* Stepper (Motif Style) */}
					<div className="flex items-center justify-center">
						{STEPS.map((step, idx) => {
							const isActive = step.id === currentStep;
							const isCompleted = step.index < currentStepIndex;

							return (
								<div key={step.id} className="flex items-center">
									<div className="relative z-10 flex w-24 flex-col items-center">
										<div
											className={cn(
												"z-20 flex h-8 w-8 items-center justify-center rounded-full text-sm ring-4 ring-white transition-colors",
												isActive
													? "bg-neutral-900 font-semibold text-white"
													: isCompleted
														? "bg-emerald-500 text-white"
														: "bg-gray-200 text-gray-500",
											)}
										>
											{isCompleted ? <Check className="h-4 w-4" /> : step.index}
										</div>
										<span
											className={cn(
												"absolute top-full mt-2 w-32 text-center font-medium text-xs",
												isActive ? "text-neutral-900" : "text-gray-500",
											)}
										>
											{step.label}
										</span>
									</div>
									{idx < STEPS.length - 1 && (
										<div
											className={cn(
												"h-[2px] w-16 transition-colors",
												isCompleted ? "bg-emerald-500" : "bg-gray-200",
											)}
										/>
									)}
								</div>
							);
						})}
					</div>

					{/* Error Display */}
					{error && (
						<div className="rounded-md bg-destructive/15 p-3 text-center font-medium text-destructive text-sm">
							{error}
						</div>
					)}

					{/* Step Content */}
					<div className="flex-1 overflow-y-auto px-2 pt-4">
						{currentStep === "UPLOAD" && (
							<div className="h-full w-full" data-testid="wizard-step-upload">
								<UploadStep
									files={files}
									onUploadNodes={setNodesFile}
									onUploadEdges={setEdgesFile}
								/>
							</div>
						)}
						{currentStep === "MAP_NODES" && renderMapping("NODES")}
						{currentStep === "MAP_EDGES" && renderMapping("EDGES")}
						{currentStep === "SUCCESS" && renderSuccess()}
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-between border-t px-6 py-4">
					{currentStep !== "UPLOAD" && currentStep !== "SUCCESS" ? (
						<Button variant="outline" onClick={handleBack}>
							Back
						</Button>
					) : (
						<div /> // Spacer
					)}

					{currentStep !== "SUCCESS" ? (
						<Button
							onClick={handleNext}
							disabled={isNextDisabled()}
							data-testid="import-next-button"
						>
							{currentStep === "MAP_EDGES" ? "Generate Graph" : "Next"}
							{currentStep !== "MAP_EDGES" && (
								<ArrowRight className="ml-2 h-4 w-4" />
							)}
						</Button>
					) : (
						<Button data-testid="import-finish-button" onClick={handleClose}>
							Close
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
