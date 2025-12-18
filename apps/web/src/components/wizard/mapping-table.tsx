import { Check } from "lucide-react";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MappingTableProps {
	type: "NODES" | "EDGES";
	columns: string[];
	mapping: Record<string, string | undefined>;
	onChange: (field: string, value: string) => void;
	// Props for property selection (Slice 6)
	selectedProperties?: string[];
	onToggleProperty?: (property: string) => void;
}

export function MappingTable({
	type,
	columns,
	mapping,
	onChange,
	selectedProperties = [],
	onToggleProperty,
}: MappingTableProps) {
	const isNode = type === "NODES";

	// Filter columns that are already mapped to required fields
	// We want to show remaining columns as optional properties
	// Note: This simple logic assumes 1:1 mapping for required fields.
	// Note: We used to filter mapped values, but now we keep them visible
	// so the user sees them uncheck instead of disappear.
	const availableProperties = columns;

	const isPropertySelected = (col: string) => selectedProperties.includes(col);

	// Define rows based on type
	const rows = isNode
		? [
				{
					id: "id",
					label: "Node ID",
					required: true,
					description: "Unique identifier",
				},
				{
					id: "title",
					label: "Display Label",
					required: true,
					description: "Shown on the graph",
				},
				{
					id: "type",
					label: "Node Type",
					required: true,
					description: "Input / Step / Output",
				},
			]
		: [
				{
					id: "source",
					label: "Source Node ID",
					required: true,
					description: "Origin of the connection",
				},
				{
					id: "target",
					label: "Target Node ID",
					required: true,
					description: "Destination of the connection",
				},
			];

	return (
		<div className="w-full rounded-md border">
			<table className="w-full table-fixed text-sm">
				<thead className="bg-gray-50/50 text-left text-gray-500 text-xs uppercase">
					<tr>
						<th className="w-[30%] p-4 font-medium">System Field</th>
						<th className="w-[50%] p-4 font-medium">CSV Column</th>
						<th className="w-[20%] p-4 text-center font-medium">Required</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{rows.map((row) => (
						<tr key={row.id} className="group hover:bg-gray-50/50">
							<td className="p-4 align-top">
								<div className="font-medium text-gray-900">{row.label}</div>
								<div className="text-gray-500 text-xs">{row.description}</div>
							</td>
							<td className="p-4 align-top">
								<Select
									value={mapping[row.id] || ""}
									onValueChange={(value) => onChange(row.id, value)}
								>
									<SelectTrigger
										className="w-full cursor-pointer bg-white" // Added cursor-pointer
										data-testid={`mapping-select-${row.id}-trigger`}
									>
										<SelectValue placeholder="Select column..." />
									</SelectTrigger>
									<SelectContent>
										{columns.map((col) => {
											// Exclusion Logic (Slice 3)
											// Only applies to Edges (Source/Target checks)
											let isDisabled = false;
											if (!isNode) {
												if (row.id === "source" && mapping.target === col) {
													isDisabled = true;
												}
												if (row.id === "target" && mapping.source === col) {
													isDisabled = true;
												}
											}

											return (
												<SelectItem key={col} value={col} disabled={isDisabled}>
													{col}
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</td>
							<td className="p-4 text-center align-top">
								{row.required && (
									<div className="mx-auto h-2 w-2 rounded-full bg-red-500" />
								)}
							</td>
						</tr>
					))}

					{/* Additional Properties Row (Nodes Only) */}
					{isNode && onToggleProperty && (
						<tr className="bg-gray-50/20 hover:bg-gray-50/50">
							<td className="p-4 align-top">
								<div className="font-medium text-gray-900">
									Additional Properties
								</div>
								<div className="text-gray-500 text-xs">
									Select extra columns to import
								</div>
							</td>
							<td className="p-4 align-top">
								<div className="min-h-[42px] w-full rounded-md border border-gray-200 bg-white p-3">
									{availableProperties.length === 0 ? (
										<div className="text-gray-400 text-xs italic">
											No optional columns available
										</div>
									) : (
										<div className="flex flex-wrap gap-2">
											{availableProperties.map((col) => {
												const isSelected = isPropertySelected(col);
												return (
													<button
														key={col}
														type="button"
														onClick={() => onToggleProperty(col)}
														data-testid={`property-pill-${col}`}
														className={cn(
															"inline-flex items-center rounded-full border px-3 py-1 font-medium text-xs transition-colors focus:outline-none",
															isSelected
																? "border-transparent bg-indigo-600 text-white hover:bg-indigo-700"
																: "border-gray-200 bg-white text-gray-900 hover:border-indigo-600 hover:bg-gray-50",
														)}
													>
														{col}
													</button>
												);
											})}
										</div>
									)}
								</div>
							</td>
							<td className="p-4" />
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
