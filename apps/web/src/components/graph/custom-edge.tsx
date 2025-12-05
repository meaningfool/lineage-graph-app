import React, { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, useViewport } from "reactflow";
import { calculateEdgePath } from "../../lib/edge-path-utils";

/**
 * Tooltip component that scales inversely to the viewport zoom
 * to maintain a constant screen size.
 */
function EdgeTooltip({ x, y, errors, isHovered }: { x: number; y: number; errors: string[]; isHovered: boolean }) {
    const { zoom } = useViewport();

    return (
        <EdgeLabelRenderer>
            <div
                style={{
                    position: "absolute",
                    transform: `translate(-50%, -100%) translate(${x}px,${y - 10}px) scale(${1 / zoom})`,
                    transformOrigin: "bottom center",
                    pointerEvents: "all",
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.2s",
                    zIndex: 10,
                }}
                className="nodrag nopan"
            >
                <div className="px-2 py-1 text-xs font-sans font-normal text-white bg-gray-900 rounded shadow-md whitespace-nowrap">
                    {errors.map((err, i) => (
                        <div key={i}>{err}</div>
                    ))}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            </div>
        </EdgeLabelRenderer>
    );
}

/**
 * Custom Edge Component
 * 
 * Role: Smart Presentational Component
 * 
 * Responsibilities:
 * 1. Delegates complex path calculation to `edge-path-utils`.
 * 2. Renders the SVG path.
 * 3. Renders the invisible "hit area" for easier hovering.
 * 4. Renders the tooltip for validation errors.
 * 
 * Architecture Note:
 * This component "owns" the visual logic for edges (self-loops, backward arcs),
 * keeping the main `LineageGraph` component clean.
 */
export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const hasErrors = data?.validationErrors && data.validationErrors.length > 0;

    const { path: edgePath, labelX, labelY } = calculateEdgePath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        isSelfLoop: data?.isSelfLoop,
    });

    return (
        <>
            {/* Base Edge (Visible Line) */}
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

            {/* Active Error Flash (Outer Stroke) */}
            {hasErrors && selected && (
                <path
                    key={data?.flashTrigger}
                    d={edgePath}
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.25)"
                    strokeWidth={12}
                    className="animate-flash-stroke"
                />
            )}

            {/* Hit Area (Invisible, wider stroke for easier hovering) */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ cursor: "pointer" }}
                data-validation-status={hasErrors ? "invalid" : "valid"}
            />

            {/* Tooltip */}
            {hasErrors && (
                <EdgeTooltip
                    x={labelX}
                    y={labelY}
                    errors={data.validationErrors}
                    isHovered={isHovered}
                />
            )}
        </>
    );
}
