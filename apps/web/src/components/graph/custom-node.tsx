import React, { useState } from "react";
import { Handle, Position, NodeToolbar } from "reactflow";

export interface NodeData {
    label: string;
    type?: string;
    layer?: number;
    properties?: {
        [key: string]: any;
    };
    validationErrors?: string[];
}

/**
 * Custom Node Component
 * 
 * Role: Presentational Component (Dumb Component)
 * 
 * Responsibilities:
 * 1. Render the node content (Label, Properties).
 * 2. Render validation feedback (Red border, Tooltip).
 * 3. Provide handles for ReactFlow connections.
 * 
 * It does NOT contain any business logic. It simply renders the data passed to it.
 */
export function CustomNode({ data }: { data: NodeData }) {
    const [isHovered, setIsHovered] = useState(false);
    const hasErrors = data.validationErrors && data.validationErrors.length > 0;
    const borderColor = hasErrors ? "border-red-500" : "border-gray-200";

    return (
        <div
            className={`min-w-[150px] max-w-[200px] rounded-sm border ${borderColor} bg-white px-3 py-2 shadow-sm relative group`}
            style={{ borderColor: hasErrors ? "#ef4444" : undefined }}
            data-layer={data.layer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip using NodeToolbar to escape clipping */}
            {hasErrors && (
                <NodeToolbar
                    isVisible={isHovered}
                    position={Position.Top}
                    offset={10}
                >
                    <div className="px-2 py-1 text-xs font-sans font-normal text-white bg-gray-900 rounded shadow-md whitespace-nowrap">
                        {data.validationErrors?.map((err, i) => (
                            <div key={i}>{err}</div>
                        ))}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                </NodeToolbar>
            )}

            <Handle
                type="target"
                position={Position.Left}
                className="h-1.5 w-1.5 opacity-0"
            />
            <div className="flex flex-col gap-0.5">
                <div className="border-gray-100 border-b pb-0.5 font-medium text-gray-900 text-xs">
                    {data.label}
                </div>
                {data.properties && (
                    <div className="space-y-0.5">
                        {Object.entries(data.properties).map(([key, value]) => (
                            <div key={key} className="text-xs">
                                <span className="font-medium text-gray-600 text-xs capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}:
                                </span>
                                <span className="ml-1 text-gray-500 text-xs">{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                className="h-1.5 w-1.5 opacity-0"
            />
        </div>
    );
}
