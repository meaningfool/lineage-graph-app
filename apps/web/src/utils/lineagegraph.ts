import { DirectedGraph } from 'graphology';
import { hasCycle } from 'graphology-dag';
import { subgraph } from 'graphology-operators';
import { bfsFromNode } from 'graphology-traversal';

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
    this.graph = existingGraph || new DirectedGraph();
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
    const graphologyData = {
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
    graph.import(graphologyData);
    
    // Step 3: Create LineageGraph and validate
    const lineageGraph = new LineageGraph(graph);
    
    // Validate the resulting graph structure
    if (!lineageGraph.hasValidFlow()) {
      throw new Error('Invalid graph structure: graph fails validation (disconnected components, dangling nodes, or invalid flow patterns)');
    }
    
    if (!lineageGraph.isAcyclic()) {
      throw new Error('Invalid graph structure: graph contains cycles');
    }
    
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
   */
  static createWithDimensions(depth: number, width: number): LineageGraph {
    // TODO: Implementation
    throw new Error('Not implemented yet');
  }

  /**
   * Add a node with specified role (hybrid approach - generic method)
   */
  addNode(key: string, role: NodeRole, attributes?: any): string {
    const nodeData = { role, ...attributes };
    this.graph.addNode(key, nodeData);
    return key;
  }

  /**
   * Add an output node (convenience method)
   */
  addOutput(key: string, attributes?: any): string {
    return this.addNode(key, NodeRole.OUTPUT, attributes);
  }

  /**
   * Add a step node (convenience method)
   */
  addStep(key: string, attributes?: any): string {
    return this.addNode(key, NodeRole.STEP, attributes);
  }

  /**
   * Add an input node (convenience method)
   */
  addInput(key: string, attributes?: any): string {
    return this.addNode(key, NodeRole.INPUT, attributes);
  }

  /**
   * Add a single edge to the graph (source derives from target)
   */
  addEdge(source: string, target: string, attributes?: any): string {
    // Get node attributes to check roles
    const sourceAttributes = this.graph.getNodeAttributes(source);
    const targetAttributes = this.graph.getNodeAttributes(target);
    
    // Validate edge based on node roles
    // INPUT nodes cannot have outgoing edges (they are sinks)
    if (sourceAttributes.role === NodeRole.INPUT) {
      throw new Error('Cannot add outgoing edge from INPUT node');
    }
    
    // OUTPUT nodes cannot have incoming edges (they are sources)
    if (targetAttributes.role === NodeRole.OUTPUT) {
      throw new Error('Cannot add incoming edge to OUTPUT node');
    }
    
    // If validation passes, add the edge
    return this.graph.addEdge(source, target, attributes);
  }

  /**
   * Get all root nodes (outputs - nodes with no incoming edges)
   */
  getRootNodes(): string[] {
    const rootNodes: string[] = [];
    this.graph.forEachNode((node, attributes) => {
      // For lineage graphs, root nodes are outputs with no incoming edges
      if (this.graph.inDegree(node) === 0 && attributes.role === NodeRole.OUTPUT) {
        rootNodes.push(node);
      }
    });
    return rootNodes;
  }

  /**
   * Get all leaf nodes (inputs - nodes with no outgoing edges)
   */
  getLeafNodes(): string[] {
    const leafNodes: string[] = [];
    this.graph.forEachNode((node, attributes) => {
      // For lineage graphs, leaf nodes are inputs with no outgoing edges
      if (this.graph.outDegree(node) === 0 && attributes.role === NodeRole.INPUT) {
        leafNodes.push(node);
      }
    });
    return leafNodes;
  }

  /**
   * Get all upstream nodes (direct neighbors with edges TO this node)
   */
  getUpstreamNodes(nodeKey: string): string[] {
    if (!this.graph.hasNode(nodeKey)) {
      throw new Error(`Node not found: ${nodeKey}`);
    }
    return this.graph.inNeighbors(nodeKey);
  }

  /**
   * Get all downstream nodes (direct neighbors with edges FROM this node)
   */
  getDownstreamNodes(nodeKey: string): string[] {
    if (!this.graph.hasNode(nodeKey)) {
      throw new Error(`Node not found: ${nodeKey}`);
    }
    return this.graph.outNeighbors(nodeKey);
  }

  /**
   * Get the depth (longest path) of the lineage graph
   */
  getDepth(): number {
    // TODO: Implementation
    throw new Error('Not implemented yet');
  }

  /**
   * Get the width (maximum number of nodes at any level) of the lineage graph
   */
  getWidth(): number {
    // TODO: Implementation
    throw new Error('Not implemented yet');
  }

  /**
   * Check if the lineage graph is valid (acyclic + valid flow patterns)
   */
  isValid(): boolean {
    // A valid lineage graph must be both acyclic AND have valid flow patterns
    return this.isAcyclic() && this.hasValidFlow();
  }

  /**
   * Check if the graph is acyclic (DAG requirement)
   */
  isAcyclic(): boolean {
    // Use graphology's official DAG library for cycle detection
    return !hasCycle(this.graph);
  }

  /**
   * Check if the graph has valid lineage flow patterns
   * (OUTPUT nodes connect to INPUT nodes through valid paths)
   */
  hasValidFlow(): boolean {
    // Empty graph is invalid
    if (this.graph.order === 0) {
      return false;
    }
    
    // Check all nodes meet their role requirements
    let isValid = true;
    
    this.graph.forEachNode((node, attributes) => {
      const inDegree = this.graph.inDegree(node);
      const outDegree = this.graph.outDegree(node);
      
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
   * Get upstream dependencies for a specific node (what depends on this node)
   * Returns a subgraph containing all nodes that have paths leading TO this node
   */
  getUpstreamDependencies(nodeKey: string): LineageGraph {
    if (!this.graph.hasNode(nodeKey)) {
      throw new Error(`Node not found: ${nodeKey}`);
    }
    
    // TODO: Implementation - DEPRECATED, use getLineage()
    throw new Error('Not implemented yet');
  }

  /**
   * Get downstream dependencies for a specific node (what this node derives from)
   * Returns a subgraph containing all nodes that have paths leading FROM this node
   */
  getDownstreamDependencies(nodeKey: string): LineageGraph {
    if (!this.graph.hasNode(nodeKey)) {
      throw new Error(`Node not found: ${nodeKey}`);
    }
    
    // TODO: Implementation - DEPRECATED, use getLineage()
    throw new Error('Not implemented yet');
  }

  /**
   * Get dependencies for a specific node, returning a subgraph containing:
   * - For OUTPUT nodes: all downstream dependencies (what this output derives from)
   * - For INPUT nodes: all upstream dependencies (what outputs depend on this input)  
   * - For STEP nodes: complete flow graph passing through this node (both upstream and downstream)
   */
  getDependencies(nodeKey: string): LineageGraph {
    if (!this.graph.hasNode(nodeKey)) {
      throw new Error(`Node not found: ${nodeKey}`);
    }
    
    // TODO: Implementation - DEPRECATED, use getLineage()
    throw new Error('Not implemented yet');
  }

  /**
   * Get the underlying graphology graph instance for advanced operations
   */
  getGraph(): DirectedGraph {
    return this.graph;
  }
} 