import { DirectedGraph } from 'graphology';
import { hasCycle } from 'graphology-dag';
import { subgraph } from 'graphology-operators';
import { bfsFromNode } from 'graphology-traversal';
import seedrandom from 'seedrandom';

/**
 * Node roles in the lineage graph structure
 */
export enum NodeRole {
  OUTPUT = 'output',    // Root nodes (metrics, derived results)
  STEP = 'step',       // Intermediate transformation nodes  
  INPUT = 'input'      // Leaf nodes (source data)
}

/**
 * LineageGraph - A composition wrapper around graphology's DirectedGraph
 * for managing data lineage relationships with "derived from" semantics.
 * 
 * Edge direction: A -> B means "A is derived from B"
 */
export class LineageGraph {
  private graph: DirectedGraph;

  constructor(existingGraph?: DirectedGraph) {
    if (!existingGraph || existingGraph.order == 0) {
      throw new Error('Empty LineageGraphs are not allowed. Use LineageGraph.from() to create graphs.');
    }
    
    // ONLY validate if graph has nodes
    if (!LineageGraph.isValidLineageGraph(existingGraph)) {
      throw new Error('Invalid graph structure provided to constructor');
    }

    this.graph = existingGraph;
  }

  /**
   * Create a LineageGraph from existing nodes and edges data
   */
  static from(data: {
    nodes: Array<{ key: string; role: NodeRole; attributes?: any }>;
    edges: Array<{ source: string; target: string; attributes?: any }>;
  }): LineageGraph {
    // Step 1: Validate input data
    LineageGraph.validateInputData(data);
    
    // Step 2: Use graphology's bulk construction
    const graph = new DirectedGraph();
    
    // Transform data to graphology's import format
    const graphData = {
      nodes: data.nodes.map(node => ({
        key: node.key,
        attributes: { role: node.role, ...node.attributes }
      })),
      edges: data.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        attributes: edge.attributes || {}
      }))
    };
    
    // Bulk import all nodes and edges
    graph.import(graphData);
    
    // Step 3: Validate the resulting graph structure
    if (!LineageGraph.isValidLineageGraph(graph)) {
      throw new Error('Invalid LineageGraph structure: graph fails validation (disconnected components, dangling nodes, invalid lineage flow patterns, or not acyclic)');
    }

    // Step 4: Create LineageGraph and validate
    const lineageGraph = new LineageGraph(graph);
    
    return lineageGraph;
  }

  /**
   * Private helper to validate input data before construction
   */
  private static validateInputData(data: {
    nodes: Array<{ key: string; role: NodeRole; attributes?: any }>;
    edges: Array<{ source: string; target: string; attributes?: any }>;
  }): void {
    // Check for empty data
    if (data.nodes.length === 0) {
      throw new Error('Invalid data: empty graphs are not allowed (must have at least one node)');
    }
    
    // Check for duplicate node keys
    const nodeKeys = new Set<string>();
    for (const node of data.nodes) {
      if (nodeKeys.has(node.key)) {
        throw new Error(`Invalid data: duplicate node key '${node.key}' found`);
      }
      nodeKeys.add(node.key);
      
      // Validate node role
      if (!Object.values(NodeRole).includes(node.role)) {
        throw new Error(`Invalid data: invalid role '${node.role}' for node '${node.key}'. Must be one of: ${Object.values(NodeRole).join(', ')}`);
      }
    }
    
    // Check edges reference existing nodes
    for (const edge of data.edges) {
      if (!nodeKeys.has(edge.source)) {
        throw new Error(`Invalid data: edge references non-existent source node '${edge.source}'`);
      }
      if (!nodeKeys.has(edge.target)) {
        throw new Error(`Invalid data: edge references non-existent target node '${edge.target}'`);
      }
      
      // Validate role-based edge rules
      const sourceNode = data.nodes.find(n => n.key === edge.source)!;
      const targetNode = data.nodes.find(n => n.key === edge.target)!;
      
      // INPUT nodes cannot have outgoing edges
      if (sourceNode.role === NodeRole.INPUT) {
        throw new Error(`Invalid data: INPUT node '${edge.source}' cannot have outgoing edges`);
      }
      
      // OUTPUT nodes cannot have incoming edges
      if (targetNode.role === NodeRole.OUTPUT) {
        throw new Error(`Invalid data: OUTPUT node '${edge.target}' cannot have incoming edges`);
      }
    }
  }

  /**
   * Create a LineageGraph with specific depth and width dimensions
   * @deprecated Use generateLineageGraph() function instead
   */
  static createWithDimensions(depth: number, width: number): LineageGraph {
    return generateLineageGraph({ depth, width });
  }

  /**
   * Get all nodes organized by layers (distance from OUTPUT nodes)
   * Returns Array<string[]> where each inner array contains node keys for that layer
   * Layer 0: All OUTPUT nodes, Last layer: All INPUT nodes
   */
  getLayers(): string[][] {
    const distanceCache = new Map<string, number>();
    
    // Recursive function to compute maximum distance from any OUTPUT node
    // Only processes OUTPUT and STEP nodes; INPUT nodes are handled separately
    const computeMaxDistance = (nodeKey: string): number => {
      // Return cached result if already computed
      if (distanceCache.has(nodeKey)) {
        return distanceCache.get(nodeKey)!;
      }
      
      const nodeRole = this.graph.getNodeAttributes(nodeKey).role;
      
      // Skip INPUT nodes - they will be placed in final layer explicitly
      if (nodeRole === NodeRole.INPUT) {
        return -1; // Sentinel value to indicate INPUT node
      }
      
      // OUTPUT nodes are at distance 0
      if (nodeRole === NodeRole.OUTPUT) {
        distanceCache.set(nodeKey, 0);
        return 0;
      }
      
      // For STEP nodes, distance = 1 + max(distance of all non-INPUT predecessors)
      const incomingNodes = this.graph.inNeighbors(nodeKey);
      
      if (incomingNodes.length === 0) {
        // This shouldn't happen in a valid lineage graph, but handle gracefully
        distanceCache.set(nodeKey, 0);
        return 0;
      }
      
      // Compute max distance from all non-INPUT predecessors
      let maxDistance = 0;
      let hasValidPredecessor = false;
      
      for (const predecessor of incomingNodes) {
        const predecessorDistance = computeMaxDistance(predecessor);
        if (predecessorDistance >= 0) { // Skip INPUT nodes (sentinel value -1)
          maxDistance = Math.max(maxDistance, predecessorDistance);
          hasValidPredecessor = true;
        }
      }
      
      // If no valid (non-INPUT) predecessors, treat as distance 0
      const nodeDistance = hasValidPredecessor ? maxDistance + 1 : 0;
      distanceCache.set(nodeKey, nodeDistance);
      return nodeDistance;
    };
    
    // Compute distances for OUTPUT and STEP nodes only
    for (const nodeKey of this.graph.nodes()) {
      const nodeRole = this.graph.getNodeAttributes(nodeKey).role;
      if (nodeRole !== NodeRole.INPUT) {
        computeMaxDistance(nodeKey);
      }
    }
    
    // Group non-INPUT nodes by their distance (layer)
    const layerMap = new Map<number, string[]>();
    
    for (const [nodeKey, distance] of distanceCache) {
      if (!layerMap.has(distance)) {
        layerMap.set(distance, []);
      }
      layerMap.get(distance)!.push(nodeKey);
    }
    
    // Convert to array format for intermediate layers
    const maxLayer = distanceCache.size > 0 ? Math.max(...layerMap.keys()) : -1;
    const layers: string[][] = [];
    
    for (let layer = 0; layer <= maxLayer; layer++) {
      layers.push(layerMap.get(layer) || []);
    }
    
    // Explicitly add all INPUT nodes to the final layer
    const inputNodes = this.graph.nodes().filter(nodeKey => 
      this.graph.getNodeAttributes(nodeKey).role === NodeRole.INPUT
    );
    layers.push(inputNodes);
    
    return layers;
  }

  /**
   * Get the depth (longest path) of the lineage graph
   */
  getDepth(): number {
    return this.getLayers().length;
  }

  /**
   * Get the width (maximum number of nodes at any level) of the lineage graph
   */
  getWidth(): number {
    const layers = this.getLayers();
    return Math.max(...layers.map(layer => layer.length));
  }

  /**
   * Check if a graphology DirectedGraph is valid (acyclic + valid flow patterns)
   */
  static isValidLineageGraph(graph: DirectedGraph): boolean {
    // A valid lineage graph must be both acyclic AND have valid flow patterns
    return !hasCycle(graph) && LineageGraph.hasValidLineageFlow(graph);
  }

  /**
   * Check if a graphology DirectedGraph has valid lineage flow patterns
   * (OUTPUT nodes connect to INPUT nodes through valid paths)
   */
  static hasValidLineageFlow(graph: DirectedGraph): boolean {
    // Empty graph is invalid
    if (graph.order === 0) {
      return false;
    }
    
    // Check all nodes meet their role requirements
    let isValid = true;
    
    graph.forEachNode((node, attributes) => {
      const inDegree = graph.inDegree(node);
      const outDegree = graph.outDegree(node);
      
      switch (attributes.role) {
        case NodeRole.OUTPUT:
          // OUTPUT nodes must have outgoing edges (connect to something)
          if (outDegree === 0) {
            isValid = false;
          }
          break;
          
        case NodeRole.INPUT:
          // INPUT nodes must have incoming edges (be connected from something)
          if (inDegree === 0) {
            isValid = false;
          }
          break;
          
        case NodeRole.STEP:
          // STEP nodes must have both incoming AND outgoing edges (be on a path)
          if (inDegree === 0 || outDegree === 0) {
            isValid = false;
          }
          break;
      }
    });
    
    return isValid;
  }

  /**
   * Check if this LineageGraph equals another LineageGraph
   * Compares nodes, edges, and their attributes for equality
   */
  equals(other: LineageGraph): boolean {
    const thisGraph = this.graph;
    const otherGraph = other.graph;
    
    // Different number of nodes or edges
    if (thisGraph.order !== otherGraph.order || thisGraph.size !== otherGraph.size) {
      return false;
    }
    
    // Check all nodes exist in both graphs with same attributes
    const allNodesMatch = thisGraph.everyNode((node, attributes) => {
      if (!otherGraph.hasNode(node)) return false;
      
      const otherAttributes = otherGraph.getNodeAttributes(node);
      return JSON.stringify(attributes) === JSON.stringify(otherAttributes);
    });
    
    if (!allNodesMatch) return false;
    
    // Check all edges exist in both graphs with same attributes
    const allEdgesMatch = thisGraph.everyEdge((edge, attributes, source, target) => {
      if (!otherGraph.hasEdge(source, target)) return false;
      
      const otherAttributes = otherGraph.getEdgeAttributes(source, target);
      return JSON.stringify(attributes) === JSON.stringify(otherAttributes);
    });
    
    return allEdgesMatch;
  }

  /**
   * Get the lineage graph for a specific node with role-based behavior:
   * - For OUTPUT nodes: returns downstream lineage (what this output derives from)
   * - For INPUT nodes: returns upstream lineage (what outputs depend on this input)  
   * - For STEP nodes: returns complete lineage (both upstream and downstream dependencies)
   */
  getLineage(nodeKey: string): LineageGraph {
    if (!this.graph.hasNode(nodeKey)) {
      throw new Error(`Node not found: ${nodeKey}`);
    }
    
    const nodeRole = this.graph.getNodeAttributes(nodeKey).role;
    
    // Step 1: Find relevant nodes via traversal
    const relevantNodes = new Set<string>();
    
    if (nodeRole === NodeRole.OUTPUT) {
      // BFS downstream only
      bfsFromNode(this.graph, nodeKey, (node: string, attr: any, depth: number) => {
        relevantNodes.add(node);
        return false; // continue traversal
      }, { mode: 'outbound' });
    } 
    else if (nodeRole === NodeRole.INPUT) {
      // BFS upstream only  
      bfsFromNode(this.graph, nodeKey, (node: string, attr: any, depth: number) => {
        relevantNodes.add(node);
        return false;
      }, { mode: 'inbound' });
    }
    else if (nodeRole === NodeRole.STEP) {
      // BFS upstream and downstream separately to get complete lineage
      bfsFromNode(this.graph, nodeKey, (node: string, attr: any, depth: number) => {
        relevantNodes.add(node);
        return false;
      }, { mode: 'inbound' });
      
      bfsFromNode(this.graph, nodeKey, (node: string, attr: any, depth: number) => {
        relevantNodes.add(node);
        return false;
      }, { mode: 'outbound' });
    }
    
    // Step 2: Create subgraph with relevant nodes
    const extractedGraph = subgraph(this.graph, relevantNodes);
    
    // Step 3: Wrap in new LineageGraph
    return new LineageGraph(extractedGraph);
  }

  /**
   * Get the underlying graphology graph instance for advanced operations
   */
  getGraph(): DirectedGraph {
    return this.graph;
  }
}

/**
 * Generate a LineageGraph with specified dimensions and characteristics
 */
export function generateLineageGraph(options: {
  depth: number;           // Guaranteed: getDepth() === depth
  width: number;           // Guaranteed: getWidth() === width (max layer width)
  seed?: number;           // Optional seed for reproducible results
}): LineageGraph {
  const {
    depth,
    width,
    seed
  } = options;

  // Validate inputs
  if (depth < 2) throw new Error('depth must be at least 2');
  if (width < 1) throw new Error('width must be at least 1');

  // Use seedrandom for proper seeded random number generation
  const rng = seed !== undefined ? seedrandom(seed.toString()) : Math.random;

  const nodes: Array<{ key: string; role: NodeRole; attributes?: any }> = [];
  const edges: Array<{ source: string; target: string; attributes?: any }> = [];

  // Generate layer widths: each layer has between 1 and width nodes
  // Formula: 1 + Math.floor(random() * width) gives values from 1 to width
  const layerWidths: number[] = [];
  for (let layer = 0; layer < depth; layer++) {
    const layerWidth = 1 + Math.floor(rng() * width);
    layerWidths.push(layerWidth);
  }
  
  // Ensure at least one layer has exactly 'width' nodes to guarantee getWidth() === width
  const maxLayerWidth = Math.max(...layerWidths);
  if (maxLayerWidth < width) {
    const randomLayerIndex = Math.floor(rng() * depth);
    layerWidths[randomLayerIndex] = width;
  }
  
  // Also ensure no layer exceeds width (this shouldn't happen but let's be safe)
  for (let i = 0; i < layerWidths.length; i++) {
    if (layerWidths[i] > width) {
      layerWidths[i] = width;
    }
  }
  


  // Create nodes for each layer
  const layerNodes: string[][] = [];
  let nodeCounter = 0;

  for (let layer = 0; layer < depth; layer++) {
    const currentLayerNodes: string[] = [];
    
    for (let i = 0; i < layerWidths[layer]; i++) {
      let role: NodeRole;
      let nodeKey: string;
      
      if (layer === 0) {
        role = NodeRole.OUTPUT;
        nodeKey = `OUTPUT_${nodeCounter}`;
      } else if (layer === depth - 1) {
        role = NodeRole.INPUT;
        nodeKey = `INPUT_${nodeCounter}`;
      } else {
        role = NodeRole.STEP;
        nodeKey = `STEP_${nodeCounter}`;
      }
      
      nodes.push({ key: nodeKey, role });
      currentLayerNodes.push(nodeKey);
      nodeCounter++;
    }
    
    layerNodes.push(currentLayerNodes);
  }

  // Create minimal connectivity - SIMPLIFIED: consecutive layers only for now
  
  // Create edges between consecutive layers to ensure basic connectivity
  for (let layerIndex = 0; layerIndex < depth - 1; layerIndex++) {
    const currentLayer = layerNodes[layerIndex];
    const nextLayer = layerNodes[layerIndex + 1];
    
    // Each node in current layer gets one edge to next layer
    for (const sourceNode of currentLayer) {
      const targetIndex = Math.floor(rng() * nextLayer.length);
      const targetNode = nextLayer[targetIndex];
      edges.push({ source: sourceNode, target: targetNode });
    }
    
    // Each node in next layer gets at least one incoming edge
    for (const targetNode of nextLayer) {
      const hasIncomingEdge = edges.some(edge => edge.target === targetNode);
      if (!hasIncomingEdge) {
        const sourceIndex = Math.floor(rng() * currentLayer.length);
        const sourceNode = currentLayer[sourceIndex];
        edges.push({ source: sourceNode, target: targetNode });
      }
    }
  }

  return LineageGraph.from({ nodes, edges });
} 