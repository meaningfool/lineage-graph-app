import { FileText, Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface UploadStepProps {
	files: { nodes: File | null; edges: File | null };
	onUploadNodes: (file: File) => void;
	onUploadEdges: (file: File) => void;
}

export function UploadStep({
	files,
	onUploadNodes,
	onUploadEdges,
}: UploadStepProps) {
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
		<div className="flex w-full gap-6">
			{/* Nodes Dropzone */}
			<div
				{...getNodesRootProps()}
				data-testid="dropzone-nodes"
				className={cn(
					"group flex h-64 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all hover:shadow-sm",
					isNodesDragActive
						? "border-emerald-500 bg-emerald-100" // Active Drag
						: "border-gray-300 bg-gray-50 hover:border-emerald-500 hover:bg-emerald-50", // Default + Hover
					files.nodes ? "border-emerald-600 bg-emerald-100" : "", // Has File
				)}
			>
				<input {...getNodesInputProps()} />
				<div
					className={cn(
						"mb-4 rounded-full p-4 transition-transform group-hover:scale-110",
						files.nodes
							? "bg-emerald-100"
							: "bg-gray-100 group-hover:bg-emerald-100",
					)}
				>
					<FileText
						className={cn(
							"h-8 w-8",
							files.nodes
								? "text-emerald-600"
								: "text-gray-400 group-hover:text-emerald-600",
						)}
					/>
				</div>
				<h3 className="font-semibold text-gray-900 text-lg group-hover:text-emerald-900">
					{files.nodes ? files.nodes.name : "Upload Nodes CSV"}
				</h3>
				<p className="font-medium text-gray-500 text-sm group-hover:text-emerald-700">
					{files.nodes
						? `${(files.nodes.size / 1024).toFixed(1)} KB`
						: "Drag & drop or click"}
				</p>
			</div>

			{/* Edges Dropzone */}
			<div
				{...getEdgesRootProps()}
				data-testid="dropzone-edges"
				className={cn(
					"group flex h-64 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all hover:shadow-sm",
					isEdgesDragActive
						? "border-emerald-500 bg-emerald-100" // Active Drag
						: "border-gray-300 bg-gray-50 hover:border-emerald-500 hover:bg-emerald-50", // Default + Hover
					files.edges ? "border-emerald-600 bg-emerald-100" : "", // Has File
				)}
			>
				<input {...getEdgesInputProps()} />
				<div
					className={cn(
						"mb-4 rounded-full p-4 transition-transform group-hover:scale-110",
						files.edges
							? "bg-emerald-100"
							: "bg-gray-100 group-hover:bg-emerald-100",
					)}
				>
					<Upload
						className={cn(
							"h-8 w-8",
							files.edges
								? "text-emerald-600"
								: "text-gray-400 group-hover:text-emerald-600",
						)}
					/>
				</div>
				<h3 className="font-semibold text-gray-900 text-lg group-hover:text-emerald-900">
					{files.edges ? files.edges.name : "Upload Edges CSV"}
				</h3>
				<p className="font-medium text-gray-500 text-sm group-hover:text-emerald-700">
					{files.edges
						? `${(files.edges.size / 1024).toFixed(1)} KB`
						: "Drag & drop or click"}
				</p>
			</div>
		</div>
	);
}
