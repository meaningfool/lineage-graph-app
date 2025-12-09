import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface StepUploadProps {
	files: { nodes: File | null; edges: File | null };
	onUploadNodes: (file: File) => void;
	onUploadEdges: (file: File) => void;
	onNext: () => void;
	error?: string | null;
}

export function StepUpload({
	files,
	onUploadNodes,
	onUploadEdges,
	onNext,
	error,
}: StepUploadProps) {
	const onDropNodes = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles[0]) onUploadNodes(acceptedFiles[0]);
		},
		[onUploadNodes],
	);

	const onDropEdges = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles[0]) onUploadEdges(acceptedFiles[0]);
		},
		[onUploadEdges],
	);

	const {
		getRootProps: getNodesRootProps,
		getInputProps: getNodesInputProps,
		isDragActive: isNodesDragActive,
	} = useDropzone({
		onDrop: onDropNodes,
		accept: { "text/csv": [".csv"] },
		multiple: false,
	});

	const {
		getRootProps: getEdgesRootProps,
		getInputProps: getEdgesInputProps,
		isDragActive: isEdgesDragActive,
	} = useDropzone({
		onDrop: onDropEdges,
		accept: { "text/csv": [".csv"] },
		multiple: false,
	});

	return (
		<div className="space-y-4">
			{error && (
				<div className="rounded-md bg-destructive/15 p-3 font-medium text-destructive text-sm">
					{error}
				</div>
			)}

			{/* Nodes Dropzone */}
			<div className="space-y-2">
				<Label>Nodes CSV (Required)</Label>
				<div
					{...getNodesRootProps()}
					data-testid="dropzone-nodes"
					className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isNodesDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"} ${files.nodes ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""} `}
				>
					<input {...getNodesInputProps()} />
					{files.nodes ? (
						<p className="font-medium text-green-600 text-sm dark:text-green-400">
							{files.nodes.name}
						</p>
					) : (
						<p className="text-muted-foreground text-sm">
							Drag & drop nodes.csv here
						</p>
					)}
				</div>
			</div>

			{/* Edges Dropzone */}
			<div className="space-y-2">
				<Label>Edges CSV (Required)</Label>
				<div
					{...getEdgesRootProps()}
					data-testid="dropzone-edges"
					className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isEdgesDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"} ${files.edges ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""} `}
				>
					<input {...getEdgesInputProps()} />
					{files.edges ? (
						<p className="font-medium text-green-600 text-sm dark:text-green-400">
							{files.edges.name}
						</p>
					) : (
						<p className="text-muted-foreground text-sm">
							Drag & drop edges.csv here
						</p>
					)}
				</div>
			</div>

			<div className="flex justify-end pt-4">
				<Button onClick={onNext} disabled={!files.nodes || !files.edges}>
					Next
				</Button>
			</div>
		</div>
	);
}
