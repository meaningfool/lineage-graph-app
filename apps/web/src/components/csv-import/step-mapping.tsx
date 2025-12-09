import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	MultiSelect,
	type MultiSelectOption,
} from "@/components/ui/multi-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// --- PROPS ---
interface StepMappingProps {
	columns: { nodes: string[]; edges: string[] };
	mapping: {
		id?: string;
		title?: string;
		type?: string;
		source?: string;
		target?: string;
		properties?: string[];
	};
	onChange: (
		field: "id" | "title" | "type" | "source" | "target" | "properties",
		value: string | string[] | undefined,
	) => void;
	onNext: () => void;
	onBack: () => void;
	isValid: boolean;
	hasEdgesFile: boolean;
}

export function StepMapping({
	columns,
	mapping,
	onChange,
	onNext,
	onBack,
	isValid,
	hasEdgesFile,
}: StepMappingProps) {
	const propertyOptions: MultiSelectOption[] = columns.nodes.map((col) => ({
		label: col,
		value: col,
	}));

	return (
		<div className="space-y-6">
			{/* --- NODES MAPPING SECTION --- */}
			<div className="space-y-4">
				<h4 className="font-semibold text-lg">Nodes</h4>
				<div className="grid gap-4">
					{/* ID Field */}
					<div className="grid gap-2">
						<Label htmlFor="mapping-id">Node ID</Label>
						<Select
							value={mapping.id || ""}
							onValueChange={(value) => onChange("id", value)}
						>
							<SelectTrigger
								id="mapping-id"
								data-testid="mapping-select-id-trigger"
								className="cursor-pointer"
							>
								<SelectValue placeholder="Select column..." />
							</SelectTrigger>
							<SelectContent>
								{columns.nodes.map((col) => (
									<SelectItem key={col} value={col}>
										{col}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Title Field */}
					<div className="grid gap-2">
						<Label htmlFor="mapping-title">Title</Label>
						<Select
							value={mapping.title || ""}
							onValueChange={(value) => onChange("title", value)}
						>
							<SelectTrigger
								id="mapping-title"
								data-testid="mapping-select-title-trigger"
								className="cursor-pointer"
							>
								<SelectValue placeholder="Select column..." />
							</SelectTrigger>
							<SelectContent>
								{columns.nodes.map((col) => (
									<SelectItem key={col} value={col}>
										{col}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Type Field */}
					<div className="grid gap-2">
						<Label htmlFor="mapping-type">Type</Label>
						<Select
							value={mapping.type || ""}
							onValueChange={(value) => onChange("type", value)}
						>
							<SelectTrigger
								id="mapping-type"
								data-testid="mapping-select-type-trigger"
								className="cursor-pointer"
							>
								<SelectValue placeholder="Select column..." />
							</SelectTrigger>
							<SelectContent>
								{columns.nodes.map((col) => (
									<SelectItem key={col} value={col}>
										{col}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Properties Field */}
					<div className="grid gap-2">
						<Label>Properties (Optional)</Label>
						<MultiSelect
							id="mapping-properties"
							data-testid="mapping-select-properties-trigger"
							options={propertyOptions}
							onValueChange={(values) => onChange("properties", values)}
							defaultValue={mapping.properties || []}
							placeholder="Select properties to import..."
							variant="default"
							maxCount={3}
							modalPopover={true}
						/>
						<p className="text-muted-foreground text-xs">
							Select columns to import as node properties.
						</p>
					</div>
				</div>
			</div>

			{/* --- EDGES MAPPING SECTION --- */}
			{hasEdgesFile && (
				<div className="space-y-4 border-t pt-4">
					<h4 className="font-semibold text-lg">Edges</h4>
					<div className="grid gap-4">
						{/* Source Field */}
						<div className="grid gap-2">
							<Label htmlFor="mapping-source">Source Node ID</Label>
							<Select
								value={mapping.source || ""}
								onValueChange={(value) => onChange("source", value)}
							>
								<SelectTrigger
									id="mapping-source"
									data-testid="mapping-select-source-trigger"
									className="cursor-pointer"
								>
									<SelectValue placeholder="Select column..." />
								</SelectTrigger>
								<SelectContent>
									{columns.edges.map((col) => (
										<SelectItem
											key={col}
											value={col}
											disabled={col === mapping.target}
										>
											{col}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Target Field */}
						<div className="grid gap-2">
							<Label htmlFor="mapping-target">Target Node ID</Label>
							<Select
								value={mapping.target || ""}
								onValueChange={(value) => onChange("target", value)}
							>
								<SelectTrigger
									id="mapping-target"
									data-testid="mapping-select-target-trigger"
									className="cursor-pointer"
								>
									<SelectValue placeholder="Select column..." />
								</SelectTrigger>
								<SelectContent>
									{columns.edges.map((col) => (
										<SelectItem
											key={col}
											value={col}
											disabled={col === mapping.source}
										>
											{col}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			)}

			{/* --- NAVIGATION BUTTONS --- */}
			<div className="flex justify-end gap-2 pt-4">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button
					data-testid="mapping-next-button"
					onClick={onNext}
					disabled={!isValid}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
