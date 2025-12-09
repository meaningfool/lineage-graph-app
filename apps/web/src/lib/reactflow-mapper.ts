import type { Node, Edge } from "reactflow";
import type { GraphNode, GraphEdge } from "./csv-graph-importer";

import type { ValidationError } from "./graph-validation";

export interface ValidationResults {
    nodeErrors: Map<string, ValidationError[]>;
    edgeErrors: Map<string, ValidationError[]>;
}

/**
 * ReactFlow Mapper (Adapter Pattern)
 ...
 */
export function mapToReactFlow(
    nodes: GraphNode[],
    edges: GraphEdge[],
    validation: ValidationResults,
): { nodes: Node[]; edges: Edge[] } {
    const reactFlowNodes: Node[] = nodes.map((n) => ({
        id: n.id,
        type: "custom", // Our custom node type
        data: {
            label: n.title,
            type: n.type, // Add type for layout algorithm
            properties: n.properties,
            validationErrors: validation.nodeErrors.get(n.id) || [],
        },
        position: { x: 0, y: 0 }, // Default position (layout will fix this later)
        className: "cursor-pointer", // Ensure pointer cursor on hover
    }));

    const reactFlowEdges: Edge[] = edges.map((e) => {
        const edgeKey = `${e.source}-${e.target}`;
        return {
            id: `e-${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            data: {
                validationErrors: validation.edgeErrors.get(edgeKey) || [],
            },
        };
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
}
