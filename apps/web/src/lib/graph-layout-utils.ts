import type { Edge, Node } from "reactflow";

/**
 * Graph Layout Utilities
 * Implements custom "Single Pass Sink-Anchored" algorithm for data lineage visualization
 * Handles invalid graphs (cycles, backward edges, orphans)
 */

export type NodeType = "INPUT" | "STEP" | "OUTPUT";

interface NodeWithLayer extends Node {
    data: {
        layer?: number;
        [key: string]: unknown;
    };
}

/**
 * Computes the maximum number of layers needed for the graph
 * Now just a helper that delegates to the main layering logic
 */
export function computeMaxLayers(nodes: Node[], edges: Edge[]): number {
    const layers = computeLayers(nodes, edges);
    if (layers.size === 0) return 0;
    return Math.max(...Array.from(layers.values())) + 1;
}

/**
 * Core Algorithm: Single Pass Sink-Anchored Strategy
 * Returns a map of NodeID -> Layer Number
 */
function computeLayers(nodes: Node[], edges: Edge[]): Map<string, number> {
    const layerMap = new Map<string, number>();

    // 0. Early Exit: Input-Only Graph
    const allInputs = nodes.every(n => (n.data.type as string)?.toUpperCase() === "INPUT");
    if (allInputs && nodes.length > 0) {
        nodes.forEach(n => layerMap.set(n.id, 0));
        return layerMap;
    }

    // 1. Build Flow Graph (Selective Reversal)
    // We need an adjacency list for UPSTREAM traversal (Target -> Source)
    // Flow Graph Edges:
    // - Valid: Input->Step, Step->Step, Step->Output
    // - Invalid (Reversed): Output->Step becomes Step->Output
    // - Ignored: Input->Input, Output->Output

    // For Upstream Traversal, we want "Incoming" edges in the Flow Graph.
    // If Flow Graph has A -> B, we want B -> A in our traversal adjacency.

    const upstreamAdjacency = new Map<string, Set<string>>();
    const outgoingFlowEdges = new Map<string, Set<string>>(); // To detect dead-ends

    nodes.forEach(n => {
        upstreamAdjacency.set(n.id, new Set());
        outgoingFlowEdges.set(n.id, new Set());
    });

    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        const sourceType = (sourceNode.data.type as string)?.toUpperCase();
        const targetType = (targetNode.data.type as string)?.toUpperCase();

        // Selective Reversal Logic
        let isFlowEdge = false;
        let flowSource = edge.source;
        let flowTarget = edge.target;

        if (sourceType === "INPUT" && targetType === "INPUT") return; // Ignore
        if (sourceType === "OUTPUT" && targetType === "OUTPUT") return; // Ignore

        if (sourceType === "OUTPUT") {
            // Invalid: Output -> * (Reverse it)
            // Flow: Target -> Output
            flowSource = edge.target;
            flowTarget = edge.source;
            isFlowEdge = true;
        } else if (targetType === "INPUT") {
            // Invalid: * -> Input (Reverse it)
            // Flow: Input -> Source
            flowSource = edge.target;
            flowTarget = edge.source;
            isFlowEdge = true;
        } else {
            // Valid Flow
            isFlowEdge = true;
        }

        if (isFlowEdge) {
            // Add to outgoing for dead-end detection
            outgoingFlowEdges.get(flowSource)?.add(flowTarget);

            // Add to upstream adjacency (Target -> Source) for traversal
            upstreamAdjacency.get(flowTarget)?.add(flowSource);
        }
    });

    // 2. Identify Sinks
    // - OUTPUT nodes
    // - Dead-end STEP nodes (no outgoing flow edges)
    const sinks: string[] = [];

    nodes.forEach(node => {
        const type = (node.data.type as string)?.toUpperCase();
        if (type === "OUTPUT") {
            sinks.push(node.id);
            layerMap.set(node.id, 0); // Base Layer 0
        } else if (type === "STEP") {
            if (outgoingFlowEdges.get(node.id)?.size === 0) {
                sinks.push(node.id);
                layerMap.set(node.id, 1); // Base Layer 1 for dead-end steps
            }
        }
    });

    // 3. Single Pass Traversal (Upstream)
    let globalMaxDepth = 0;
    let nodeAtMaxDepth: string | null = null;

    // We use a recursive DFS with visited set for cycle detection in the current path
    const visitedInPath = new Set<string>();

    function dfs(nodeId: string, currentDepth: number) {
        // Cycle detection
        if (visitedInPath.has(nodeId)) return;

        // Update layer if deeper
        const existingLayer = layerMap.get(nodeId) ?? -1;
        if (currentDepth > existingLayer) {
            layerMap.set(nodeId, currentDepth);

            // Update global max tracking
            if (currentDepth > globalMaxDepth) {
                globalMaxDepth = currentDepth;
                nodeAtMaxDepth = nodeId;
            } else if (currentDepth === globalMaxDepth) {
                // Tie-breaking: prefer non-Input to force separation if needed
                const node = nodes.find(n => n.id === nodeId);
                const type = (node?.data.type as string)?.toUpperCase();
                if (type !== "INPUT") {
                    nodeAtMaxDepth = nodeId;
                }
            }
        } else {
            // Optimization: If we reached this node with a smaller or equal depth, 
            // we can stop traversing this branch as we found a longer path previously.
            return;
        }

        visitedInPath.add(nodeId);

        const parents = upstreamAdjacency.get(nodeId) || new Set();
        for (const parentId of parents) {
            dfs(parentId, currentDepth + 1);
        }

        visitedInPath.delete(nodeId);
    }

    sinks.forEach(sinkId => {
        const baseLayer = layerMap.get(sinkId)!;
        // We need to traverse upstream from the sink
        const parents = upstreamAdjacency.get(sinkId) || new Set();
        visitedInPath.add(sinkId);
        for (const parentId of parents) {
            dfs(parentId, baseLayer + 1);
        }
        visitedInPath.delete(sinkId);
    });

    // 4. Final Input Alignment
    // Determine FinalInputLayer
    let finalInputLayer = globalMaxDepth;

    if (nodeAtMaxDepth) {
        const maxNode = nodes.find(n => n.id === nodeAtMaxDepth);
        const maxType = (maxNode?.data.type as string)?.toUpperCase();
        if (maxType !== "INPUT") {
            finalInputLayer = globalMaxDepth + 1;
        }
    } else {
        // If no nodeAtMaxDepth set (e.g. only sinks), check if we have inputs
        if (nodes.some(n => (n.data.type as string)?.toUpperCase() === "INPUT")) {
            finalInputLayer = globalMaxDepth + 1;
        }
    }

    // Force ALL INPUT nodes to FinalInputLayer
    nodes.forEach(node => {
        const type = (node.data.type as string)?.toUpperCase();
        if (type === "INPUT") {
            layerMap.set(node.id, finalInputLayer);
        }
    });

    // Ensure all nodes have a layer (orphans might be missed if not connected to sinks)
    nodes.forEach(node => {
        if (!layerMap.has(node.id)) {
            const type = (node.data.type as string)?.toUpperCase();
            if (type === "STEP") {
                layerMap.set(node.id, 1);
            } else if (type === "OUTPUT") {
                layerMap.set(node.id, 0);
            }
        }
    });

    return layerMap;
}

/**
 * Assigns layer numbers to each node based on type and longest path
 */
export function assignLayers(
    nodes: Node[],
    edges: Edge[],
    _unusedMaxLayers?: number, // Kept for compatibility but ignored
): NodeWithLayer[] {
    const layerMap = computeLayers(nodes, edges);

    return nodes.map((node) => {
        const layer = layerMap.get(node.id) ?? 0;
        return {
            ...node,
            data: {
                ...node.data,
                layer,
            },
        };
    });
}

/**
 * Converts layer assignments to x/y coordinates
 * X-coordinate: layer * layerWidth (horizontal spacing)
 * Y-coordinate: Simple vertical stacking within layer
 */
export function assignCoordinates(
    nodes: NodeWithLayer[],
    layerWidth: number = 250,
): Node[] {
    // Group nodes by layer
    const layers = new Map<number, NodeWithLayer[]>();

    nodes.forEach((node) => {
        const layer = node.data.layer ?? 0;
        if (!layers.has(layer)) {
            layers.set(layer, []);
        }
        layers.get(layer)!.push(node);
    });

    // Assign coordinates
    const nodeHeight = 300; // Approximate node height + spacing
    const startY = 50; // Top margin

    return nodes.map((node) => {
        const layer = node.data.layer ?? 0;
        const nodesInLayer = layers.get(layer) || [];
        // Sort nodes in layer to ensure deterministic order (e.g. by ID)
        nodesInLayer.sort((a, b) => a.id.localeCompare(b.id));

        const indexInLayer = nodesInLayer.indexOf(node);

        const x = layer * layerWidth + 50; // 50px left margin
        const y = startY + indexInLayer * nodeHeight;

        return {
            ...node,
            position: { x, y },
        };
    });
}
