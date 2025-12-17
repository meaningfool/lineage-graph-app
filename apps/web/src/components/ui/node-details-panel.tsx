import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NodeDetailsPanelProps {
	node: {
		id: string;
		data: {
			label: string;
			type: string;
			// biome-ignore lint/suspicious/noExplicitAny: Generic property bag
			properties?: Record<string, any>;
		};
	};
	onClose: () => void;
	isFocused: boolean;
	onToggleFocus: () => void;
}

export function NodeDetailsPanel({
	node,
	onClose,
	isFocused,
	onToggleFocus,
}: NodeDetailsPanelProps) {
	const { label, type, properties } = node.data;

	return (
		<div
			data-testid="node-details-panel"
			className="slide-in-from-right absolute top-4 right-4 bottom-4 z-10 flex w-80 animate-in flex-col rounded-lg border bg-background p-4 shadow-lg transition-all"
		>
			<div className="mb-4 flex flex-shrink-0 items-center justify-between">
				<h3 className="font-semibold text-lg">{label}</h3>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-8 w-8"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Action Toolbar */}
			<div className="mb-4 flex items-center border-b pb-4">
				<Button
					variant="outline"
					size="sm"
					onClick={onToggleFocus}
					data-testid="focus-toggle"
					data-active={isFocused}
					className="w-auto"
				>
					{isFocused ? "Clear Focus" : "Focus Subtree"}
				</Button>
			</div>

			<div className="flex-grow space-y-4 overflow-y-auto">
				{properties && Object.keys(properties).length > 0 && (
					<div className="space-y-2">
						{Object.entries(properties).map(([key, value]) => (
							<div key={key} className="grid grid-cols-3 gap-2 text-sm">
								<span className="col-span-1 font-medium capitalize">
									{key.replace(/([A-Z])/g, " $1").trim()}
								</span>
								<span className="col-span-2 break-words text-muted-foreground">
									{String(value)}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
