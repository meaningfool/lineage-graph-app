import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GraphError {
	id: string;
	type: "node" | "edge";
	message: string;
	label?: string;
	relatedIds?: string[]; // IDs of other elements involved (e.g., nodes in a cycle)
}

interface ErrorListPanelProps {
	errors: GraphError[];
	onClose: () => void;
	onItemClick?: (error: GraphError) => void;
}

export function ErrorListPanel({
	errors,
	onClose,
	onItemClick,
}: ErrorListPanelProps) {
	return (
		<div
			data-testid="error-list-panel"
			className="slide-in-from-left absolute top-4 bottom-4 left-4 z-10 flex w-80 animate-in flex-col rounded-lg border bg-background p-4 shadow-lg transition-all"
		>
			<div className="mb-4 flex flex-shrink-0 items-center justify-between">
				<h3 className="font-semibold text-lg">Validation Errors</h3>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-8 w-8"
					data-testid="error-panel-close"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex-grow overflow-y-auto">
				<ul className="space-y-1">
					{errors.map((error, index) => (
						// biome-ignore lint/a11y/useKeyWithClickEvents: Interactive list item
						<li
							key={`${error.id}-${index}`}
							data-testid="error-item"
							onClick={() => onItemClick?.(error)}
							className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm transition-colors hover:bg-muted/50"
						>
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 fill-white text-red-500" />
							<div className="space-y-0.5">
								<span className="text-foreground">{error.message}</span>
								{/* Optional: Show ID/Label if needed, but message usually contains it now */}
								{/* <p className="text-xs text-muted-foreground">{error.id}</p> */}
							</div>
						</li>
					))}
				</ul>
				{errors.length === 0 && (
					<p className="py-8 text-center text-muted-foreground text-sm">
						No errors found.
					</p>
				)}
			</div>
		</div>
	);
}
