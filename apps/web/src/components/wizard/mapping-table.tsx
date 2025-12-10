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
}

// Mock CSV Columns available for mapping
const MOCK_COLUMNS = [
	{ id: "c1", label: "id" },
	{ id: "c2", label: "label_text" },
	{ id: "c3", label: "type_category" },
	{ id: "c4", label: "weight_kg" },
	{ id: "c5", label: "expiry_date" },
	{ id: "c6", label: "batch_num" },
];

export function MappingTable({ type }: MappingTableProps) {
	const isNode = type === "NODES";

	// State to track selected properties (mock)
	const [selectedProps, setSelectedProps] = useState<string[]>([]);

	const toggleProperty = (id: string) => {
		if (selectedProps.includes(id)) {
			setSelectedProps(selectedProps.filter((p) => p !== id));
		} else {
			setSelectedProps([...selectedProps, id]);
		}
	};

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
					id: "label",
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
								<Select>
									<SelectTrigger className="w-full bg-white">
										<SelectValue placeholder="Select column..." />
									</SelectTrigger>
									<SelectContent>
										{MOCK_COLUMNS.map((col) => (
											<SelectItem key={col.id} value={col.id}>
												{col.label}
											</SelectItem>
										))}
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
					{isNode && (
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
									<div className="flex flex-wrap gap-2">
										{MOCK_COLUMNS.map((col) => {
											const isSelected = selectedProps.includes(col.id);
											return (
												<button
													key={col.id}
													type="button"
													onClick={() => toggleProperty(col.id)}
													className={cn(
														"inline-flex items-center rounded-full border px-3 py-1 font-medium text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
														isSelected
															? "border-transparent bg-neutral-900 text-white hover:bg-neutral-800"
															: "border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-100",
													)}
												>
													{isSelected && <Check className="mr-1 h-3 w-3" />}
													{col.label}
												</button>
											);
										})}
									</div>
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
