import { ArrowRight, Check, FileText, Upload, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MappingTable } from "./mapping-table";

interface ImportWizardDialogProps {
	isOpen: boolean;
	onClose: () => void;
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
}: ImportWizardDialogProps) {
	const [currentStep, setCurrentStep] = useState<Step>("UPLOAD");

	// --- Navigation Helpers ---
	const goToNext = () => {
		if (currentStep === "UPLOAD") setCurrentStep("MAP_NODES");
		else if (currentStep === "MAP_NODES") setCurrentStep("MAP_EDGES");
		else if (currentStep === "MAP_EDGES") setCurrentStep("SUCCESS");
		else onClose();
	};

	const goToBack = () => {
		if (currentStep === "MAP_NODES") setCurrentStep("UPLOAD");
		else if (currentStep === "MAP_EDGES") setCurrentStep("MAP_NODES");
		else if (currentStep === "SUCCESS") setCurrentStep("MAP_EDGES");
	};

	// --- Step Components (Placeholders) ---
	// --- Step Components (Static Implementation) ---
	const renderUpload = () => (
		<div className="flex w-full gap-6">
			{/* Nodes Dropzone */}
			<div className="group flex h-64 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-emerald-500/50 border-dashed bg-emerald-50/30 transition-all hover:bg-emerald-50 hover:shadow-sm">
				<div className="mb-4 rounded-full bg-emerald-100 p-4 transition-transform group-hover:scale-110">
					<FileText className="h-8 w-8 text-emerald-600" />
				</div>
				<h3 className="font-semibold text-emerald-900 text-lg">
					nodes.csv ready
				</h3>
				<p className="font-medium text-emerald-600 text-sm">5 rows</p>
			</div>

			{/* Edges Dropzone */}
			<div className="group flex h-64 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-gray-300 border-dashed bg-gray-50 transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm">
				<div className="mb-4 rounded-full bg-gray-100 p-4 transition-transform group-hover:scale-110 group-hover:bg-blue-100">
					<Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
				</div>
				<h3 className="font-semibold text-gray-900 text-lg">Edges CSV</h3>
				<p className="max-w-[200px] text-center text-gray-500 text-sm">
					Drag & drop or click to upload
				</p>
			</div>
		</div>
	);
	const renderMapping = (type: "NODES" | "EDGES") => (
		<div className="flex h-full w-full flex-col">
			<MappingTable type={type} />
		</div>
	);

	const renderSuccess = () => (
		<div className="flex h-64 w-full flex-col items-center justify-center">
			<div className="mb-4 rounded-full bg-green-100 p-4">
				<Check className="h-12 w-12 text-green-600" />
			</div>
			<h2 className="font-bold text-2xl text-gray-900">Success!</h2>
			<p className="text-gray-500">Your graph has been generated.</p>
		</div>
	);

	const currentStepIndex = STEPS.find((s) => s.id === currentStep)?.index || 1;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
						onClick={onClose}
					>
						<X className="h-4 w-4" />
					</Button>
				</DialogHeader>

				{/* Body */}
				<div className="bg-gray-50/50 p-6">
					{/* Stepper (Motif Style) */}
					<div className="mb-8 flex items-center justify-center">
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

					{/* Step Content */}
					<div className="h-[400px] overflow-y-auto px-2 pt-4">
						{currentStep === "UPLOAD" && renderUpload()}
						{currentStep === "MAP_NODES" && renderMapping("NODES")}
						{currentStep === "MAP_EDGES" && renderMapping("EDGES")}
						{currentStep === "SUCCESS" && renderSuccess()}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t bg-white px-6 py-4">
					{currentStep !== "UPLOAD" ? (
						<Button variant="outline" onClick={goToBack}>
							Back
						</Button>
					) : (
						<div /> /* Spacer */
					)}

					<Button
						onClick={goToNext}
						className="bg-neutral-900 hover:bg-neutral-800"
					>
						{currentStep === "SUCCESS"
							? "Finish"
							: currentStep === "MAP_EDGES"
								? "Generate Graph"
								: "Continue"}
						{currentStep !== "SUCCESS" && (
							<ArrowRight className="ml-2 h-4 w-4" />
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
