import { DirectedGraph } from 'graphology';
import { hasCycle } from 'graphology-dag';

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

  constructor() {
    this.graph = new DirectedGraph();
  }

  /**
   * Create a LineageGraph from existing nodes and edges data
   */
  static from(data: {
    nodes: Array<{ key: string; role: NodeRole; attributes?: any }>;
    edges: Array<{ source: string; target: string; attributes?: any }>;
  }): LineageGraph {
    // TODO: Implementation
    throw new Error('Not implemented yet');
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
    // TODO: Implementation
    throw new Error('Not implemented yet');
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
    // TODO: Implementation
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
    
    // TODO: Implementation
    throw new Error('Not implemented yet');
  }

  /**
   * Get the underlying graphology graph instance for advanced operations
   */
  getGraph(): DirectedGraph {
    return this.graph;
  }
} 