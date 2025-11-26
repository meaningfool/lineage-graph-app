import { Position, getSmoothStepPath } from "reactflow";

export interface EdgePathParams {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
    isSelfLoop?: boolean;
}

export interface PathResult {
    path: string;
    labelX: number;
    labelY: number;
}

/**
 * Edge Path Calculator
 * 
 * Purpose: Determines the SVG path string for an edge based on its source and target positions.
 * 
 * Logic:
 * 1. Self-Loops: Draws a cubic bezier curve that loops over the node.
 * 2. Backward Horizontal Edges: Draws a wide arch over intermediate nodes to avoid visual clutter.
 * 3. Standard Edges: Uses ReactFlow's default `getSmoothStepPath`.
 * 
 * This utility keeps the `CustomEdge` component clean and testable.
 */
export function calculateEdgePath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    isSelfLoop,
}: EdgePathParams): PathResult {
    let edgePath = "";
    let labelX = 0;
    let labelY = 0;

    // Detect backward edge on same horizontal level (approx)
    // sourceX > targetX means backward (Right to Left)
    // Math.abs(sourceY - targetY) < 50 means roughly same row
    const isBackwardHorizontal =
        sourceX > targetX && Math.abs(sourceY - targetY) < 50;

    if (isSelfLoop) {
        // Draw a loop that goes up and over the node
        const controlPoint1X = sourceX + 30;
        const controlPoint1Y = sourceY - 60;
        const controlPoint2X = targetX - 30;
        const controlPoint2Y = targetY - 60;

        edgePath = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;

        // Approximate label position (top of the arch)
        // Cubic bezier peak is approx 0.75 of the control point height
        labelX = (sourceX + targetX) / 2;
        labelY = sourceY - 60 * 0.75;
    } else if (isBackwardHorizontal) {
        // Draw a curve that goes UP and over the intermediate nodes
        // Similar to self-loop but wider
        // We use a higher offset to clear the nodes clearly

        const offset = 80; // Higher than self-loop (60)
        const controlPoint1X = sourceX;
        const controlPoint1Y = sourceY - offset;
        const controlPoint2X = targetX;
        const controlPoint2Y = targetY - offset;

        edgePath = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;

        labelX = (sourceX + targetX) / 2;
        labelY = sourceY - offset * 0.75;
    } else {
        [edgePath, labelX, labelY] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
    }

    return { path: edgePath, labelX, labelY };
}
