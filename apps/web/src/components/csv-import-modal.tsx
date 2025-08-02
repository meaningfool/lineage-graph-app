import {
	AlertCircle,
	CheckCircle,
	FileText,
	Loader2,
	Upload,
} from "lucide-react";
import Papa from "papaparse";
import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	type ValidationResult,
	validateDuplicateNodeIds,
	validateEdgeReferences,
	validateNodeTypes,
	validateRequiredFields,
} from "@/utils/csv-validation";
import { generateNodeIds } from "@/utils/id-generation";

interface CSVImportModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface ParseResult {
	data: any[];
	meta: Papa.ParseMeta;
	errors: Papa.ParseError[];
}

type Step = "upload" | "mapping" | "validation";

interface ColumnMapping {
	nodeTitle: string;
	nodeType: string;
	sourceNode: string;
	targetNode: string;
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
	const [currentStep, setCurrentStep] = useState<Step>("upload");
	const [nodesFile, setNodesFile] = useState<File | null>(null);
	const [edgesFile, setEdgesFile] = useState<File | null>(null);
	const [nodesError, setNodesError] = useState<string | null>(null);
	const [edgesError, setEdgesError] = useState<string | null>(null);
	const [isProcessingNodes, setIsProcessingNodes] = useState(false);
	const [isProcessingEdges, setIsProcessingEdges] = useState(false);
	const [nodesParseResult, setNodesParseResult] = useState<ParseResult | null>(
		null,
	);
	const [edgesParseResult, setEdgesParseResult] = useState<ParseResult | null>(
		null,
	);
	const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
		nodeTitle: "",
		nodeType: "",
		sourceNode: "",
		targetNode: "",
	});

	// Validation state
	const [validationResult, setValidationResult] = useState<{
		nodes: ValidationResult | null;
		edges: ValidationResult | null;
	}>({
		nodes: null,
		edges: null,
	});

	// Generated nodes for preview
	const [generatedNodes, setGeneratedNodes] = useState<any[]>([]);

	const validateCSV = useCallback(
		async (file: File, fileType: "nodes" | "edges") => {
			const setProcessing =
				fileType === "nodes" ? setIsProcessingNodes : setIsProcessingEdges;
			const setError = fileType === "nodes" ? setNodesError : setEdgesError;
			const setFile = fileType === "nodes" ? setNodesFile : setEdgesFile;
			const setParseResult =
				fileType === "nodes" ? setNodesParseResult : setEdgesParseResult;

			setProcessing(true);
			setError(null);

			return new Promise<void>((resolve) => {
				Papa.parse(file, {
					header: true,
					skipEmptyLines: true,
					complete: (results: Papa.ParseResult<any>) => {
						setProcessing(false);

						// Check for empty file
						if (file.size === 0 || results.data.length === 0) {
							setError("File is empty");
							setFile(null);
							resolve();
							return;
						}

						// Check for parsing errors
						if (results.errors.length > 0) {
							const hasFormatErrors = results.errors.some(
								(error) =>
									error.type === "Quotes" || error.type === "FieldMismatch",
							);

							if (hasFormatErrors) {
								setError("Invalid CSV format");
							} else {
								setError("CSV parsing error");
							}
							setFile(null);
							resolve();
							return;
						}

						// Success
						setParseResult(results);
						setFile(file);
						resolve();
					},
					error: (error: Papa.ParseError) => {
						setProcessing(false);
						setError("Invalid CSV format");
						setFile(null);
						resolve();
					},
				});
			});
		},
		[],
	);

	const createOnDrop = useCallback(
		(fileType: "nodes" | "edges") => {
			return async (acceptedFiles: File[], rejectedFiles: any[]) => {
				const setError = fileType === "nodes" ? setNodesError : setEdgesError;
				const setFile = fileType === "nodes" ? setNodesFile : setEdgesFile;
				const setParseResult =
					fileType === "nodes" ? setNodesParseResult : setEdgesParseResult;

				setError(null);
				setFile(null);
				setParseResult(null);

				if (rejectedFiles.length > 0) {
					setError("Only CSV files allowed");
					return;
				}

				if (acceptedFiles.length > 0) {
					const file = acceptedFiles[0];
					await validateCSV(file, fileType);
				}
			};
		},
		[validateCSV],
	);

	const nodesDropzone = useDropzone({
		onDrop: createOnDrop("nodes"),
		accept: {
			"text/csv": [".csv"],
		},
		maxFiles: 1,
		multiple: false,
	});

	const edgesDropzone = useDropzone({
		onDrop: createOnDrop("edges"),
		accept: {
			"text/csv": [".csv"],
		},
		maxFiles: 1,
		multiple: false,
	});

	// Auto-detect column mappings when navigating to mapping step
	const autoDetectMappings = useCallback(() => {
		if (!nodesParseResult || !edgesParseResult) return;

		const nodeColumns = nodesParseResult.meta.fields || [];
		const edgeColumns = edgesParseResult.meta.fields || [];

		const newMapping: ColumnMapping = {
			nodeTitle:
				nodeColumns.find(
					(col) =>
						col.toLowerCase().includes("title") ||
						col.toLowerCase().includes("name") ||
						col.toLowerCase() === "title",
				) || "",
			nodeType:
				nodeColumns.find(
					(col) =>
						col.toLowerCase().includes("type") || col.toLowerCase() === "type",
				) || "",
			sourceNode:
				edgeColumns.find(
					(col) =>
						col.toLowerCase().includes("source") ||
						col.toLowerCase().includes("from") ||
						col.toLowerCase() === "source",
				) || "",
			targetNode:
				edgeColumns.find(
					(col) =>
						col.toLowerCase().includes("target") ||
						col.toLowerCase().includes("to") ||
						col.toLowerCase() === "target",
				) || "",
		};

		setColumnMapping(newMapping);
	}, [nodesParseResult, edgesParseResult]);

	// Check if required mappings are complete
	const isValidMapping =
		columnMapping.nodeTitle &&
		columnMapping.sourceNode &&
		columnMapping.targetNode;

	// Handle mapping field changes
	const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
		setColumnMapping((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Run validation when entering validation step
	const runValidation = useCallback(() => {
		if (!nodesParseResult || !edgesParseResult) return;

		// Map CSV data using column mappings (without ID)
		const mappedNodesWithoutIds = nodesParseResult.data.map((row) => ({
			title: row[columnMapping.nodeTitle],
			type: row[columnMapping.nodeType],
		}));

		// Generate IDs from titles
		const mappedNodes = generateNodeIds(mappedNodesWithoutIds);

		// Store generated nodes for preview
		setGeneratedNodes(mappedNodes);

		const mappedEdges = edgesParseResult.data.map((row) => ({
			source: row[columnMapping.sourceNode],
			target: row[columnMapping.targetNode],
		}));

		// Run required fields validation
		const nodesRequiredFieldsValidation = validateRequiredFields(
			mappedNodes,
			"nodes",
		);
		const edgesRequiredFieldsValidation = validateRequiredFields(
			mappedEdges,
			"edges",
		);

		// Run node type validation
		const nodeTypesValidation = validateNodeTypes(mappedNodes);

		// Run duplicate node ID validation
		const duplicateNodesValidation = validateDuplicateNodeIds(mappedNodes);

		// Run edge reference validation
		const edgeReferencesValidation = validateEdgeReferences(
			mappedEdges,
			mappedNodes,
		);

		// Combine all validation results
		const combinedNodesValidation: ValidationResult = {
			isValid:
				nodesRequiredFieldsValidation.isValid &&
				nodeTypesValidation.isValid &&
				duplicateNodesValidation.isValid,
			errors: [
				...nodesRequiredFieldsValidation.errors,
				...nodeTypesValidation.errors,
				...duplicateNodesValidation.errors,
			],
		};

		const combinedEdgesValidation: ValidationResult = {
			isValid:
				edgesRequiredFieldsValidation.isValid &&
				edgeReferencesValidation.isValid,
			errors: [
				...edgesRequiredFieldsValidation.errors,
				...edgeReferencesValidation.errors,
			],
		};

		setValidationResult({
			nodes: combinedNodesValidation,
			edges: combinedEdgesValidation,
		});
	}, [nodesParseResult, edgesParseResult, columnMapping]);

	// Check if validation has critical errors
	const hasValidationErrors = useMemo(() => {
		if (!validationResult.nodes || !validationResult.edges) return true;
		return (
			validationResult.nodes.errors.length > 0 ||
			validationResult.edges.errors.length > 0
		);
	}, [validationResult]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Import Graph from CSV</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{currentStep === "upload" && (
						<>
							{/* Nodes File Drop Zone */}
							<div className="space-y-2">
								<h3 className="font-medium text-sm">Upload Nodes CSV</h3>
								<div
									{...nodesDropzone.getRootProps()}
									className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
										nodesDropzone.isDragActive
											? "border-blue-400 bg-blue-50 dark:bg-blue-950/50"
											: "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
									} `}
								>
									<input
										{...nodesDropzone.getInputProps()}
										aria-label="Nodes CSV file upload"
										accept=".csv,text/csv"
									/>

									<div className="flex flex-col items-center space-y-2">
										<Upload className="h-6 w-6 text-gray-400" />
										<div>
											<p className="font-medium text-sm">
												{nodesDropzone.isDragActive
													? "Drop nodes CSV here"
													: "Drop nodes CSV here or click to browse"}
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												Contains node data (id, title, type, etc.)
											</p>
										</div>
										<Button variant="outline" size="sm" type="button">
											Browse Files
										</Button>
									</div>
								</div>
							</div>

							{/* Edges File Drop Zone */}
							<div className="space-y-2">
								<h3 className="font-medium text-sm">Upload Edges CSV</h3>
								<div
									{...edgesDropzone.getRootProps()}
									className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
										edgesDropzone.isDragActive
											? "border-blue-400 bg-blue-50 dark:bg-blue-950/50"
											: "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
									} `}
								>
									<input
										{...edgesDropzone.getInputProps()}
										aria-label="Edges CSV file upload"
										accept=".csv,text/csv"
									/>

									<div className="flex flex-col items-center space-y-2">
										<Upload className="h-6 w-6 text-gray-400" />
										<div>
											<p className="font-medium text-sm">
												{edgesDropzone.isDragActive
													? "Drop edges CSV here"
													: "Drop edges CSV here or click to browse"}
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												Contains edge data (source, target, etc.)
											</p>
										</div>
										<Button variant="outline" size="sm" type="button">
											Browse Files
										</Button>
									</div>
								</div>
							</div>

							{/* File Status Summary */}
							<div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
								<h4 className="font-medium text-sm">Upload Status</h4>

								{/* Nodes File Status */}
								<div className="flex items-center justify-between">
									<span className="text-sm">Nodes file:</span>
									<div className="flex items-center space-x-2">
										{isProcessingNodes && (
											<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
										)}
										{nodesFile && !isProcessingNodes && !nodesError && (
											<FileText className="h-4 w-4 text-green-600" />
										)}
										{nodesError && (
											<AlertCircle className="h-4 w-4 text-red-600" />
										)}
										<span className="font-medium text-sm">
											{nodesFile ? nodesFile.name : "Not uploaded"}
										</span>
									</div>
								</div>

								{/* Edges File Status */}
								<div className="flex items-center justify-between">
									<span className="text-sm">Edges file:</span>
									<div className="flex items-center space-x-2">
										{isProcessingEdges && (
											<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
										)}
										{edgesFile && !isProcessingEdges && !edgesError && (
											<FileText className="h-4 w-4 text-green-600" />
										)}
										{edgesError && (
											<AlertCircle className="h-4 w-4 text-red-600" />
										)}
										<span className="font-medium text-sm">
											{edgesFile ? edgesFile.name : "Not uploaded"}
										</span>
									</div>
								</div>
							</div>

							{/* Error Messages */}
							{nodesError && (
								<div className="flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
									<AlertCircle className="h-5 w-5 text-red-600" />
									<p className="font-medium text-red-800 text-sm dark:text-red-200">
										Nodes file: {nodesError}
									</p>
								</div>
							)}

							{edgesError && (
								<div className="flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
									<AlertCircle className="h-5 w-5 text-red-600" />
									<p className="font-medium text-red-800 text-sm dark:text-red-200">
										Edges file: {edgesError}
									</p>
								</div>
							)}
						</>
					)}

					{currentStep === "mapping" && (
						<>
							{/* Column Mapping View */}
							<div className="space-y-6">
								<div className="text-center">
									<h3 className="font-medium text-lg">Column Mapping</h3>
									<p className="mt-1 text-muted-foreground text-sm">
										Map your CSV columns to the required fields
									</p>
								</div>

								{/* Nodes Mapping */}
								<div className="space-y-4">
									<h4 className="font-medium text-sm">Node Fields</h4>

									{/* Auto-generation notice */}
									<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50">
										<p className="font-medium text-blue-800 text-sm dark:text-blue-200">
											Node IDs will be auto-generated from title column
										</p>
										<p className="mt-1 text-blue-600 text-xs dark:text-blue-400">
											IDs will be created automatically using a slug format (e.g., "User Count" → "user-count")
										</p>
									</div>

									<div className="grid grid-cols-1 gap-4">
										<div className="space-y-2">
											<label
												htmlFor="node-title"
												className="font-medium text-sm"
											>
												Node Title Column *
											</label>
											<select
												id="node-title"
												aria-label="Node title column mapping"
												className="w-full rounded-md border p-2 text-sm"
												value={columnMapping.nodeTitle}
												onChange={(e) =>
													handleMappingChange("nodeTitle", e.target.value)
												}
											>
												<option value="">Select column...</option>
												{nodesParseResult?.meta.fields?.map((column) => (
													<option key={column} value={column}>
														{column}
													</option>
												))}
											</select>
										</div>

										<div className="space-y-2">
											<label
												htmlFor="node-type"
												className="font-medium text-sm"
											>
												Node Type Column
											</label>
											<select
												id="node-type"
												aria-label="Node type column mapping"
												className="w-full rounded-md border p-2 text-sm"
												value={columnMapping.nodeType}
												onChange={(e) =>
													handleMappingChange("nodeType", e.target.value)
												}
											>
												<option value="">Select column...</option>
												{nodesParseResult?.meta.fields?.map((column) => (
													<option key={column} value={column}>
														{column}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>

								{/* Edges Mapping */}
								<div className="space-y-4">
									<h4 className="font-medium text-sm">Edge Fields</h4>

									<div className="grid grid-cols-1 gap-4">
										<div className="space-y-2">
											<label
												htmlFor="source-node"
												className="font-medium text-sm"
											>
												Source Node Column *
											</label>
											<select
												id="source-node"
												aria-label="Source node column mapping"
												className="w-full rounded-md border p-2 text-sm"
												value={columnMapping.sourceNode}
												onChange={(e) =>
													handleMappingChange("sourceNode", e.target.value)
												}
											>
												<option value="">Select column...</option>
												{edgesParseResult?.meta.fields?.map((column) => (
													<option key={column} value={column}>
														{column}
													</option>
												))}
											</select>
										</div>

										<div className="space-y-2">
											<label
												htmlFor="target-node"
												className="font-medium text-sm"
											>
												Target Node Column *
											</label>
											<select
												id="target-node"
												aria-label="Target node column mapping"
												className="w-full rounded-md border p-2 text-sm"
												value={columnMapping.targetNode}
												onChange={(e) =>
													handleMappingChange("targetNode", e.target.value)
												}
											>
												<option value="">Select column...</option>
												{edgesParseResult?.meta.fields?.map((column) => (
													<option key={column} value={column}>
														{column}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>

								{/* Validation Messages */}
								{!isValidMapping && (
									<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
										<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
											Required fields missing
										</p>
										<p className="mt-1 text-amber-600 text-xs dark:text-amber-400">
											Please map all required fields: Node Title,
											Source Node, and Target Node
										</p>
									</div>
								)}

								{!columnMapping.sourceNode &&
									!columnMapping.targetNode &&
									columnMapping.nodeTitle && (
										<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
											<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
												Source and Target fields required
											</p>
										</div>
									)}
							</div>
						</>
					)}

					{currentStep === "validation" && (
						<>
							<div className="space-y-4">
								<div className="text-center">
									<h3 className="font-semibold text-lg">
										Step 4: Validate Data
									</h3>
									<p className="mt-1 text-muted-foreground text-sm">
										Review data validation results before import
									</p>
								</div>

								{/* Generated IDs Preview */}
								{generatedNodes.length > 0 && (
									<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
										<h4 className="flex items-center gap-2 font-medium text-blue-800 dark:text-blue-200">
											Generated IDs:
										</h4>
										<div className="mt-2 flex flex-wrap gap-2">
											{generatedNodes.slice(0, 10).map((node, index) => (
												<span
													key={index}
													className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-xs dark:bg-blue-900/50 dark:text-blue-200"
												>
													{node.id}
												</span>
											))}
											{generatedNodes.length > 10 && (
												<span className="text-blue-600 text-xs dark:text-blue-400">
													... and {generatedNodes.length - 10} more
												</span>
											)}
										</div>
									</div>
								)}

								{/* Validation Results */}
								<div className="space-y-4">
									{validationResult.nodes && (
										<div className="rounded-lg border p-4">
											<h4 className="flex items-center gap-2 font-medium">
												<FileText className="h-4 w-4" />
												Nodes Validation
											</h4>

											{validationResult.nodes.isValid ? (
												<div className="mt-2 flex items-center gap-2 text-green-600">
													<CheckCircle className="h-4 w-4" />
													<span className="text-sm">
														All nodes validation passed
													</span>
												</div>
											) : (
												<div className="mt-2 space-y-2">
													<div className="flex items-center gap-2 text-red-600">
														<AlertCircle className="h-4 w-4" />
														<span className="font-medium text-sm">
															Critical Errors (
															{validationResult.nodes.errors.length})
														</span>
													</div>
													<div className="space-y-1">
														{validationResult.nodes.errors.map(
															(error, index) => (
																<div
																	key={index}
																	className="ml-6 text-red-600 text-sm"
																>
																	{error.message}
																</div>
															),
														)}
													</div>
												</div>
											)}
										</div>
									)}

									{validationResult.edges && (
										<div className="rounded-lg border p-4">
											<h4 className="flex items-center gap-2 font-medium">
												<FileText className="h-4 w-4" />
												Edges Validation
											</h4>

											{validationResult.edges.isValid ? (
												<div className="mt-2 flex items-center gap-2 text-green-600">
													<CheckCircle className="h-4 w-4" />
													<span className="text-sm">
														All edges validation passed
													</span>
												</div>
											) : (
												<div className="mt-2 space-y-2">
													<div className="flex items-center gap-2 text-red-600">
														<AlertCircle className="h-4 w-4" />
														<span className="font-medium text-sm">
															Critical Errors (
															{validationResult.edges.errors.length})
														</span>
													</div>
													<div className="space-y-1">
														{validationResult.edges.errors.map(
															(error, index) => (
																<div
																	key={index}
																	className="ml-6 text-red-600 text-sm"
																>
																	{error.message}
																</div>
															),
														)}
													</div>
												</div>
											)}
										</div>
									)}

									{hasValidationErrors && (
										<div className="rounded-lg border border-red-200 bg-red-50 p-4">
											<div className="flex items-center gap-2 text-red-800">
												<AlertCircle className="h-4 w-4" />
												<span className="font-medium text-sm">
													Fix required field errors
												</span>
											</div>
											<p className="mt-1 text-red-700 text-sm">
												Please go back and ensure all required fields are
												properly filled in your CSV files.
											</p>
										</div>
									)}
								</div>
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>

					{(currentStep === "mapping" || currentStep === "validation") && (
						<Button
							variant="outline"
							onClick={() => {
								if (currentStep === "validation") {
									setCurrentStep("mapping");
								} else if (currentStep === "mapping") {
									setCurrentStep("upload");
								}
							}}
						>
							Back
						</Button>
					)}

					{currentStep === "upload" && (
						<Button
							disabled={
								!nodesFile ||
								!edgesFile ||
								isProcessingNodes ||
								isProcessingEdges ||
								!!nodesError ||
								!!edgesError
							}
							onClick={() => {
								setCurrentStep("mapping");
								// Auto-detect mappings when navigating to mapping step
								autoDetectMappings();
							}}
						>
							Continue
						</Button>
					)}

					{currentStep === "mapping" && (
						<Button
							disabled={!isValidMapping}
							onClick={() => {
								setCurrentStep("validation");
								runValidation();
							}}
						>
							Continue
						</Button>
					)}

					{currentStep === "validation" && (
						<Button
							disabled={hasValidationErrors}
							onClick={() => {
								// TODO: Import graph data
								console.log("Import graph with mapping:", columnMapping);
								console.log("Validation passed, importing...");
							}}
						>
							Import
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
