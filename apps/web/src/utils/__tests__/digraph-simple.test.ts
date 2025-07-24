import { describe, test, expect } from 'vitest';
import { DiGraph } from 'digraph-js';

describe('DiGraph Simple Integration Test', () => {
  test('should import and create a basic digraph', () => {
    // Test that we can import DiGraph
    expect(DiGraph).toBeDefined();
    
    // Test that we can create a new digraph
    const digraph = new DiGraph();
    expect(digraph).toBeDefined();
    expect(typeof digraph.addVertex).toBe('function');
    expect(typeof digraph.addEdge).toBe('function');
  });

  test('should add vertices and edges', () => {
    const digraph = new DiGraph();
    
    // Add some vertices
    digraph.addVertex({
      id: 'node1',
      adjacentTo: [],
      body: { label: 'Node 1' }
    });
    
    digraph.addVertex({
      id: 'node2',
      adjacentTo: [],
      body: { label: 'Node 2' }
    });
    
    // Add an edge
    digraph.addEdge({ from: 'node1', to: 'node2' });
    
    // Check that vertices exist
    expect(digraph.hasVertex('node1')).toBe(true);
    expect(digraph.hasVertex('node2')).toBe(true);
  });

  test('should get vertices and traverse', () => {
    const digraph = new DiGraph();
    
    // Add vertices and edges
    digraph.addVertex({
      id: 'node1',
      adjacentTo: [],
      body: { label: 'Node 1' }
    });
    
    digraph.addVertex({
      id: 'node2',
      adjacentTo: [],
      body: { label: 'Node 2' }
    });
    
    digraph.addEdge({ from: 'node1', to: 'node2' });
    
    // Get all vertices
    const vertices = digraph.toDict();
    expect(Object.keys(vertices).length).toBe(2);
    
    // Check vertex properties
    const node1 = vertices['node1'];
    expect(node1).toBeDefined();
    expect(node1.body.label).toBe('Node 1');
  });

  test('should perform basic graph operations', () => {
    const digraph = new DiGraph();
    
    // Create a simple graph: A -> B -> C
    digraph.addVertex({
      id: 'A',
      adjacentTo: [],
      body: { label: 'Source' }
    });
    
    digraph.addVertex({
      id: 'B',
      adjacentTo: [],
      body: { label: 'Intermediate' }
    });
    
    digraph.addVertex({
      id: 'C',
      adjacentTo: [],
      body: { label: 'Target' }
    });
    
    digraph.addEdge({ from: 'A', to: 'B' });
    digraph.addEdge({ from: 'B', to: 'C' });
    
    // Test getting children and parents
    const childrenOfA = digraph.getChildren('A');
    const parentsOfC = digraph.getParents('C');
    
    expect(childrenOfA.length).toBe(1);
    expect(childrenOfA[0].id).toBe('B');
    
    expect(parentsOfC.length).toBe(1);
    expect(parentsOfC[0].id).toBe('B');
  });
}); 