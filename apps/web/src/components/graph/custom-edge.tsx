import React, { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "reactflow";
import { calculateEdgePath } from "../../lib/edge-path-utils";

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
}: EdgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const hasErrors = data?.validationErrors && data.validationErrors.length > 0;
    const isSelfLoop = data?.isSelfLoop;

    const { path: edgePath, labelX, labelY } = calculateEdgePath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        isSelfLoop,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

            {/* Invisible path for wider hover area */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ cursor: "pointer" }}
            />

            {/* Tooltip */}
            {hasErrors && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 10}px)`, // Shift up to be above the line
                            pointerEvents: "all",
                            opacity: isHovered ? 1 : 0,
                            transition: "opacity 0.2s",
                            zIndex: 10,
                        }}
                        className="nodrag nopan"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className="px-2 py-1 text-xs font-sans font-normal text-white bg-gray-900 rounded shadow-md whitespace-nowrap">
                            {data.validationErrors.map((err: string, i: number) => (
                                <div key={i}>{err}</div>
                            ))}
                            {/* Arrow pointing down */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
