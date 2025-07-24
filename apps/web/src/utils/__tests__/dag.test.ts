import { describe, test, expect } from 'vitest';
import { DAG } from '../dag';
import { generateSimpleDAG } from '../simple-dag-generator';

describe('DAG Analysis', () => {
  test('should compute correct depth and width for simple DAG', () => {
    const dagData = generateSimpleDAG(4, 3, 0.3);
    const dag = new DAG(dagData);
    
    console.log('Generated DAG:', {
      nodes: dagData.nodes.length,
      edges: dagData.edges.length,
      sourceNodes: dagData.nodes.filter(n => n.type === 'source').length,
      computedNodes: dagData.nodes.filter(n => n.type === 'computed').length,
      metricNodes: dagData.nodes.filter(n => n.type === 'metric').length
    });
    
    const depth = dag.getDepth();
    const width = dag.getWidth();
    
    console.log('DAG Analysis:', { depth, width });
    
    // Basic validation
    expect(depth).toBeGreaterThanOrEqual(0);
    expect(width).toBeGreaterThan(0);
    expect(dag.hasCycles()).toBe(false);
    
    // Test layer structure
    const layers = dag.getLayers();
    console.log('Layers:', Object.fromEntries(layers));
    
    // Verify source nodes are at depth 0
    const sourceNodes = dagData.nodes.filter(n => n.type === 'source');
    sourceNodes.forEach(node => {
      expect(dag.getNodeDepth(node.id)).toBe(0);
    });
    
    // Verify metric nodes are at maximum depth (depth - 1 since levels are 0-indexed)
    const metricNodes = dagData.nodes.filter(n => n.type === 'metric');
    metricNodes.forEach(node => {
      expect(dag.getNodeDepth(node.id)).toBe(depth - 1);
    });
  });
  
  test('should handle different depth and width parameters', () => {
    const testCases = [
      { depth: 3, width: 2, edgeProb: 0.5 },
      { depth: 5, width: 4, edgeProb: 0.3 },
      { depth: 2, width: 3, edgeProb: 0.7 }
    ];
    
    testCases.forEach(({ depth, width, edgeProb }) => {
      const dagData = generateSimpleDAG(depth, width, edgeProb);
      const dag = new DAG(dagData);
      
      console.log(`Test case: depth=${depth}, width=${width}`, {
        actualDepth: dag.getDepth(),
        actualWidth: dag.getWidth()
      });
      
      // The actual depth should be close to the input depth (accounting for 0-indexing)
      expect(dag.getDepth()).toBeLessThanOrEqual(depth);
      expect(dag.getWidth()).toBeLessThanOrEqual(width);
    });
  });
  
  test('debug: should understand DAG structure', () => {
    const dagData = generateSimpleDAG(4, 3, 0.3);
    const dag = new DAG(dagData);
    
    console.log('=== DEBUG DAG STRUCTURE ===');
    console.log('All nodes:', dagData.nodes.map(n => `${n.id} (${n.type})`));
    console.log('All edges:', dagData.edges.map(e => `${e.source} -> ${e.target}`));
    
    const layers = dag.getLayers();
    console.log('Computed layers:', Object.fromEntries(layers));
    
    // Check what the DAG generator actually created
    const nodeLevels = new Map<string, number>();
    dagData.nodes.forEach(node => {
      const match = node.id.match(/node-(\d+)-\d+/);
      if (match) {
        nodeLevels.set(node.id, parseInt(match[1]));
      }
    });
    
    console.log('Expected levels from node IDs:', Object.fromEntries(nodeLevels));
    
    // The expected depth should be the maximum level + 1
    const expectedDepth = Math.max(...nodeLevels.values()) + 1;
    console.log('Expected depth from node IDs:', expectedDepth);
    console.log('Actual computed depth:', dag.getDepth());
  });
}); 