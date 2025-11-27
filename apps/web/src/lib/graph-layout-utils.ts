import type { Edge, Node } from "reactflow";

/**
 * Graph Layout Utilities
 * Implements custom "Longest Path Layering" algorithm for data lineage visualization
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
 * Uses undirected BFS traversal to find the longest path
 * Treats edges as bidirectional to handle invalid graphs
 */
export function computeMaxLayers(nodes: Node[], edges: Edge[]): number {
    if (nodes.length === 0) return 0;

    // Build adjacency list (undirected)
    const adjacency = new Map<string, Set<string>>();
    nodes.forEach((node) => {
        adjacency.set(node.id, new Set());
    });

    edges.forEach((edge) => {
        // Add both directions for undirected traversal
        adjacency.get(edge.source)?.add(edge.target);
        adjacency.get(edge.target)?.add(edge.source);
    });

    // Find longest path using BFS from each node
    let maxPathLength = 0;

    for (const startNode of nodes) {
        const visited = new Set<string>();
        const queue: Array<{ id: string; depth: number }> = [
            { id: startNode.id, depth: 0 },
        ];
        visited.add(startNode.id);

        while (queue.length > 0) {
            const current = queue.shift()!;
            maxPathLength = Math.max(maxPathLength, current.depth);

            const neighbors = adjacency.get(current.id) || new Set();
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push({ id: neighbor, depth: current.depth + 1 });
                }
            }
        }
    }

    // Total layers = max path length + 1
    return maxPathLength + 1;
}

/**
 * Assigns layer numbers to each node based on type and longest path
 * - OUTPUT nodes: Layer 0 (leftmost)
 * - INPUT nodes: Layer maxLayers (rightmost)
 * - STEP nodes: Distributed across intermediate layers based on longest path from OUTPUT
 * Also adds data-layer attribute for E2E testing
 */
export function assignLayers(
    nodes: Node[],
    edges: Edge[],
    maxLayers: number,
): NodeWithLayer[] {
    // Build adjacency list (directed: Source -> Target)
    const adjacency = new Map<string, Set<string>>();
    nodes.forEach((node) => {
        adjacency.set(node.id, new Set());
    });

    edges.forEach((edge) => {
        // Only add directed edge (Source -> Target)
        adjacency.get(edge.source)?.add(edge.target);
    });

    // For each node, calculate the LONGEST path to any OUTPUT using DFS
    const longestPathToOutput = new Map<string, number>();

    // Find all OUTPUT nodes
    const outputNodes = nodes.filter(
        (node) => (node.data.type as string)?.toUpperCase() === "OUTPUT",
    );

    // Initialize OUTPUT nodes with distance 0
    outputNodes.forEach((node) => {
        longestPathToOutput.set(node.id, 0);
    });

    // DFS to find longest path from each node to any OUTPUT
    function dfs(nodeId: string, visited: Set<string>): number {
        // If we found an OUTPUT node (distance 0), return 0 immediately
        if (longestPathToOutput.has(nodeId) && longestPathToOutput.get(nodeId) === 0) {
            return 0;
        }

        // If we have a computed value and we are at the start of traversal, return it
        // This is memoization for the current DFS path
        if (longestPathToOutput.has(nodeId) && visited.size === 0) {
            return longestPathToOutput.get(nodeId)!;
        }

        if (visited.has(nodeId)) {
            return -Infinity; // Avoid cycles, or indicate no path to output through this cycle
        }

        visited.add(nodeId);

        const neighbors = adjacency.get(nodeId) || new Set();
        let maxDist = -Infinity; // Initialize with negative infinity to correctly handle no path

        for (const neighbor of neighbors) {
            const dist = dfs(neighbor, new Set(visited));
            if (dist !== -Infinity) {
                maxDist = Math.max(maxDist, dist + 1);
            }
        }

        visited.delete(nodeId); // Backtrack

        return maxDist;
    }

    // Calculate longest path for each non-OUTPUT node
    nodes.forEach((node) => {
        if (!longestPathToOutput.has(node.id)) {
            const dist = dfs(node.id, new Set());
            // If no path to an output was found (dist remains -Infinity), treat it as 0 or 1
            // For layering, nodes without a path to output should probably be at an edge layer.
            // Here, we default to 0, which would place them with outputs.
            // A more robust solution might place them at maxLayers-1 or handle them specially.
            longestPathToOutput.set(node.id, dist === -Infinity ? 0 : dist);
        }
    });

    // Assign layers to nodes
    return nodes.map((node) => {
        const nodeType = (node.data.type as string)?.toUpperCase() as NodeType;
        let layer: number;

        if (nodeType === "OUTPUT") {
            layer = 0; // OUTPUTs always at Layer 0 (leftmost)
        } else if (nodeType === "INPUT") {
            layer = maxLayers - 1; // INPUTs always at Layer max (rightmost)
        } else {
            // STEP nodes: use longest distance from OUTPUT
            const distance = longestPathToOutput.get(node.id) ?? 1;
            // Clamp to intermediate layers (1 to maxLayers-2)
            layer = Math.min(Math.max(distance, 1), maxLayers - 2);
        }

        // Add layer to node data (for E2E testing via data-layer attribute)
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
        const indexInLayer = nodesInLayer.indexOf(node);

        const x = layer * layerWidth + 50; // 50px left margin
        const y = startY + indexInLayer * nodeHeight;

        return {
            ...node,
            position: { x, y },
        };
    });
}
