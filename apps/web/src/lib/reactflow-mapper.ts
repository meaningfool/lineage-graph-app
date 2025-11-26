import type { Node, Edge } from "reactflow";
import type { GraphNode, GraphEdge } from "./csv-graph-importer";

export interface ValidationResults {
    nodeErrors: Map<string, string[]>;
    edgeErrors: Map<string, string[]>;
}

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
            validationErrors: validation.nodeErrors.get(n.id) || [],
        },
        position: { x: 0, y: 0 }, // Default position (layout will fix this later)
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
