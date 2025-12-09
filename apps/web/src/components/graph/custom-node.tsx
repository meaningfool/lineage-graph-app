import { useState } from "react";
import { Handle, NodeToolbar, Position } from "reactflow";

export interface NodeData {
	label: string;
	type?: string;
	layer?: number;
	properties?: {
		[key: string]: any;
	};
	validationErrors?: any[]; // string[] | ValidationError[]
	flashTrigger?: number;
	dimmed?: boolean;
	isFlashing?: boolean;
}

/**
 * Custom Node Component
 * ...
 */
export function CustomNode({
	id,
	data,
	selected,
}: {
	id: string;
	data: NodeData;
	selected?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const hasErrors = data.validationErrors && data.validationErrors.length > 0;
	const isDimmed = data.dimmed;

	// Base border color (always present)
	let borderColor = "border-gray-200";
	if (hasErrors) borderColor = "border-red-500";

	// Selection visual cue (stacked with border using ring)
	const selectionClasses = selected ? "ring-4 ring-blue-400/30" : "";

	// Dimming class - using tailwind class for performance and consistency
	const opacityClass = isDimmed ? "opacity-10" : "opacity-100";

	// Error visual cue
	// Passive: Static red border (handled by borderColor)
	// Active: Flashing Outer Ring (controlled explicitely by parent)
	// We use a separate element with a key to force animation restart
	const showFlash = !!data.isFlashing;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Tooltip trigger
		<div
			data-testid="custom-node-content"
			className={`min-w-[150px] max-w-[200px] rounded-sm border ${borderColor} ${selectionClasses} ${opacityClass} group relative cursor-pointer bg-white px-3 py-2 shadow-sm`}
			style={{
				borderColor: hasErrors ? "#ef4444" : undefined,
			}}
			data-layer={data.layer}
			data-validation-status={hasErrors ? "invalid" : "valid"}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{showFlash && (
				<div
					key={data.flashTrigger}
					className="pointer-events-none absolute inset-0 animate-flash-ring rounded-sm"
					data-flash-trigger={data.flashTrigger}
				/>
			)}
			{/* Tooltip using NodeToolbar to escape clipping */}
			{hasErrors && (
				<NodeToolbar isVisible={isHovered} position={Position.Top} offset={10}>
					<div className="pointer-events-none whitespace-nowrap rounded bg-gray-900 px-2 py-1 font-normal font-sans text-white text-xs shadow-md">
						{data.validationErrors?.map((err: any, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Static error list
							<div key={i}>{err.message || err}</div>
						))}
						{/* Arrow */}
						<div className="-translate-x-1/2 absolute top-full left-1/2 border-4 border-transparent border-t-gray-900" />
					</div>
				</NodeToolbar>
			)}

			<Handle
				type="target"
				position={Position.Right}
				className="h-1.5 w-1.5 opacity-0"
			/>
			<div className="flex flex-col gap-0.5">
				<div className="font-semibold text-base text-gray-900">
					{data.label}
				</div>
				<div className="text-gray-500" style={{ fontSize: "12px" }}>
					# {id}
				</div>
			</div>
			<Handle
				type="source"
				position={Position.Left}
				className="h-1.5 w-1.5 opacity-0"
			/>
		</div>
	);
}
