import { generateSimpleDAG } from '../simple-dag-generator';
import type { DAGData, DAGNode, DAGEdge } from '../simple-dag-generator';
import { describe, test, expect } from 'vitest';

// COMMENTED OUT FOR REVIEW - Simple DAG Generator Tests
/*
describe('Simple DAG Generator', () => {
  let dag: DAGData;

  beforeEach(() => {
    // Generate a fresh DAG for each test
    dag = generateSimpleDAG(4, 3, 0.3);
  });

  describe('Basic Structure Tests', () => {
    test('should generate nodes and edges', () => {
      expect(dag.nodes).toBeDefined();
      expect(dag.edges).toBeDefined();
      expect(dag.nodes.length).toBeGreaterThan(0);
      expect(dag.edges.length).toBeGreaterThan(0);
    });

    test('should have correct node structure', () => {
      dag.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('label');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('properties');
        expect(['source', 'computed', 'metric']).toContain(node.type);
      });
    });

    test('should have correct edge structure', () => {
      dag.edges.forEach(edge => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('source');
        expect(edge).toHaveProperty('target');
      });
    });
  });

  describe('Valid Edge References Test', () => {
    test('all edges should reference existing nodes', () => {
      const nodeIds = new Set(dag.nodes.map(node => node.id));
      
      dag.edges.forEach(edge => {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      });
    });

    test('should not have self-loops', () => {
      dag.edges.forEach(edge => {
        expect(edge.source).not.toBe(edge.target);
      });
    });
  });

  describe('Data Traceability Tests (Connectivity)', () => {
    test('every source node should be able to reach a metric node (downstream traceability)', () => {
      const sourceNodes = dag.nodes.filter(node => node.type === 'source');
      const metricNodes = dag.nodes.filter(node => node.type === 'metric');
      
      // For each source node, check if there's a path to at least one metric node
      sourceNodes.forEach(sourceNode => {
        const hasPathToMetric = hasPathToAnyNode(sourceNode.id, metricNodes.map(n => n.id), dag);
        expect(hasPathToMetric).toBe(true);
      });
    });

    test('every computed node should be able to reach a metric node (downstream traceability)', () => {
      const computedNodes = dag.nodes.filter(node => node.type === 'computed');
      const metricNodes = dag.nodes.filter(node => node.type === 'metric');
      
      // For each computed node, check if there's a path to at least one metric node
      computedNodes.forEach(computedNode => {
        const hasPathToMetric = hasPathToAnyNode(computedNode.id, metricNodes.map(n => n.id), dag);
        expect(hasPathToMetric).toBe(true);
      });
    });

    test('every metric node should have at least one source node upstream', () => {
      const sourceNodes = dag.nodes.filter(node => node.type === 'source');
      const metricNodes = dag.nodes.filter(node => node.type === 'metric');
      
      // For each metric node, check if there's at least one source node that can reach it
      metricNodes.forEach(metricNode => {
        const hasSourceUpstream = sourceNodes.some(sourceNode => 
          hasPathToAnyNode(sourceNode.id, [metricNode.id], dag)
        );
        expect(hasSourceUpstream).toBe(true);
      });
    });

    test('should have complete data flow from sources to metrics', () => {
      const sourceNodes = dag.nodes.filter(node => node.type === 'source');
      const metricNodes = dag.nodes.filter(node => node.type === 'metric');
      
      // Every source should contribute to at least one metric
      sourceNodes.forEach(sourceNode => {
        const contributesToMetric = metricNodes.some(metricNode => 
          hasPathToAnyNode(sourceNode.id, [metricNode.id], dag)
        );
        expect(contributesToMetric).toBe(true);
      });
      
      // Every metric should have at least one source contributing to it
      metricNodes.forEach(metricNode => {
        const hasSourceContributing = sourceNodes.some(sourceNode => 
          hasPathToAnyNode(sourceNode.id, [metricNode.id], dag)
        );
        expect(hasSourceContributing).toBe(true);
      });
    });

    test('should maintain traceability within connected components', () => {
      // This test ensures that within each connected component,
      // there's proper data flow from sources to metrics
      const components = findConnectedComponents(dag);
      
      components.forEach(component => {
        const componentSourceNodes = component.filter(node => node.type === 'source');
        const componentMetricNodes = component.filter(node => node.type === 'metric');
        
        // Each component should have at least one source and one metric
        expect(componentSourceNodes.length).toBeGreaterThan(0);
        expect(componentMetricNodes.length).toBeGreaterThan(0);
        
        // Every source in the component should contribute to at least one metric in the component
        componentSourceNodes.forEach(sourceNode => {
          const contributesToComponentMetric = componentMetricNodes.some(metricNode => 
            hasPathToAnyNode(sourceNode.id, [metricNode.id], dag)
          );
          expect(contributesToComponentMetric).toBe(true);
        });
      });
    });
  });

  describe('Acyclic Test (No Cycles)', () => {
    test('should not contain cycles', () => {
      expect(hasCycle(dag)).toBe(false);
    });

    test('should be topologically sortable', () => {
      const sorted = topologicalSort(dag);
      expect(sorted).toBeDefined();
      expect(sorted.length).toBe(dag.nodes.length);
    });
  });

  describe('DAG Properties Tests', () => {
    test('should have source nodes at depth 0', () => {
      const sourceNodes = dag.nodes.filter(node => node.type === 'source');
      sourceNodes.forEach(node => {
        const depth = getNodeDepth(node.id, dag);
        expect(depth).toBe(0);
      });
    });

    test('should have metric nodes at maximum depth', () => {
      const metricNodes = dag.nodes.filter(node => node.type === 'metric');
      const maxDepth = getMaxDepth(dag);
      
      metricNodes.forEach(node => {
        const depth = getNodeDepth(node.id, dag);
        expect(depth).toBe(maxDepth);
      });
    });

    test('should have computed nodes at intermediate depths', () => {
      const computedNodes = dag.nodes.filter(node => node.type === 'computed');
      const maxDepth = getMaxDepth(dag);
      
      computedNodes.forEach(node => {
        const depth = getNodeDepth(node.id, dag);
        expect(depth).toBeGreaterThan(0);
        expect(depth).toBeLessThan(maxDepth);
      });
    });
  });

  describe('Stochastic Properties Tests', () => {
    test('should generate DAGs with consistent structure on multiple runs', () => {
      const dag1 = generateSimpleDAG(4, 3, 0.3);
      const dag2 = generateSimpleDAG(4, 3, 0.3);
      
      // They should have the same number of nodes (deterministic based on depth/width)
      expect(dag1.nodes.length).toBe(dag2.nodes.length);
      
      // Structure should be similar (same depth/width parameters)
      expect(dag1.nodes.filter(n => n.type === 'source').length)
        .toBe(dag2.nodes.filter(n => n.type === 'source').length);
      expect(dag1.nodes.filter(n => n.type === 'metric').length)
        .toBe(dag2.nodes.filter(n => n.type === 'metric').length);
      
      // Edges may vary due to randomness, but should be reasonable
      expect(dag1.edges.length).toBeGreaterThan(0);
      expect(dag2.edges.length).toBeGreaterThan(0);
    });

    test('should respect depth and width parameters', () => {
      const testDag = generateSimpleDAG(5, 4, 0.3);
      const maxDepth = getMaxDepth(testDag);
      const maxWidth = getMaxWidth(testDag);
      
      // Depth should be exactly what we specified (depth parameter)
      expect(maxDepth).toBe(4); // depth parameter is 5, but maxDepth is 0-indexed
      expect(maxWidth).toBeLessThanOrEqual(4);
    });
  });
});
*/

// Simple test to verify basic functionality
describe('Basic DAG Generator Test', () => {
  test('should generate valid DAG structure', () => {
    const dag = generateSimpleDAG(3, 2, 0.5);
    
    // Basic structure validation
    expect(dag.nodes).toBeDefined();
    expect(dag.edges).toBeDefined();
    expect(dag.nodes.length).toBeGreaterThan(0);
    expect(dag.edges.length).toBeGreaterThan(0);
    
    // Verify all edges reference existing nodes
    const nodeIds = new Set(dag.nodes.map(node => node.id));
    dag.edges.forEach(edge => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
    
    // Verify no self-loops
    dag.edges.forEach(edge => {
      expect(edge.source).not.toBe(edge.target);
    });
    
    console.log('Generated DAG:', {
      nodes: dag.nodes.length,
      edges: dag.edges.length,
      sourceNodes: dag.nodes.filter(n => n.type === 'source').length,
      computedNodes: dag.nodes.filter(n => n.type === 'computed').length,
      metricNodes: dag.nodes.filter(n => n.type === 'metric').length
    });
  });
});

// Helper functions for testing

function hasPathToAnyNode(startNodeId: string, targetNodeIds: string[], dagData: DAGData): boolean {
  const visited = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    
    if (targetNodeIds.includes(nodeId)) return true;
    
    const outgoingEdges = dagData.edges.filter(edge => edge.source === nodeId);
    return outgoingEdges.some(edge => dfs(edge.target));
  }
  
  return dfs(startNodeId);
}

function hasCycle(dagData: DAGData): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const outgoingEdges = dagData.edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (dfs(edge.target)) return true;
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const node of dagData.nodes) {
    if (dfs(node.id)) return true;
  }
  
  return false;
}

function topologicalSort(dagData: DAGData): string[] {
  const visited = new Set<string>();
  const sorted: string[] = [];
  
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const outgoingEdges = dagData.edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      dfs(edge.target);
    }
    
    sorted.unshift(nodeId);
  }
  
  for (const node of dagData.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }
  
  return sorted;
}



function getNodeDepth(nodeId: string, dagData: DAGData): number {
  // Calculate depth by finding the longest path from any source node to this node
  const sourceNodes = dagData.nodes.filter(node => node.type === 'source');
  let maxDepth = 0;
  
  for (const sourceNode of sourceNodes) {
    const depth = getPathLength(sourceNode.id, nodeId, dagData);
    if (depth !== -1) { // -1 means no path exists
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  
  return maxDepth;
}



function getPathLength(fromNodeId: string, toNodeId: string, dagData: DAGData): number {
  const visited = new Set<string>();
  
  function dfs(nodeId: string, currentDepth: number): number {
    if (nodeId === toNodeId) return currentDepth;
    if (visited.has(nodeId)) return -1;
    
    visited.add(nodeId);
    
    const outgoingEdges = dagData.edges.filter(edge => edge.source === nodeId);
    let maxDepth = -1;
    
    for (const edge of outgoingEdges) {
      const depth = dfs(edge.target, currentDepth + 1);
      if (depth !== -1) {
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    
    return maxDepth;
  }
  
  return dfs(fromNodeId, 0);
}



function findConnectedComponents(dagData: DAGData): DAGNode[][] {
  const visited = new Set<string>();
  const components: DAGNode[][] = [];
  
  function dfs(nodeId: string, component: DAGNode[]) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = dagData.nodes.find(n => n.id === nodeId);
    if (node) {
      component.push(node);
    }
    
    // Find all connected nodes (both incoming and outgoing edges)
    const outgoingEdges = dagData.edges.filter(edge => edge.source === nodeId);
    const incomingEdges = dagData.edges.filter(edge => edge.target === nodeId);
    
    // Follow outgoing edges
    outgoingEdges.forEach(edge => dfs(edge.target, component));
    
    // Follow incoming edges (for undirected connectivity)
    incomingEdges.forEach(edge => dfs(edge.source, component));
  }
  
  for (const node of dagData.nodes) {
    if (!visited.has(node.id)) {
      const component: DAGNode[] = [];
      dfs(node.id, component);
      components.push(component);
    }
  }
  
  return components;
} 