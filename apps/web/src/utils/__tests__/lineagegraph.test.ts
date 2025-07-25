// LineageGraph tests for graphology-based implementation 
import { describe, test, expect } from 'vitest';
import { LineageGraph, NodeRole } from '../lineagegraph';

describe('LineageGraph - Basic Node Operations', () => {
  describe('Node Creation', () => {
    test('should add output nodes and return their keys', () => {
      const lineage = new LineageGraph();
      
      const key1 = lineage.addOutput('metric1', { name: 'Revenue Metric' });
      const key2 = lineage.addOutput('metric2');
      
      expect(key1).toBe('metric1');
      expect(key2).toBe('metric2');
    });

    test('should add input nodes and return their keys', () => {
      const lineage = new LineageGraph();
      
      const key1 = lineage.addInput('data1', { source: 'database' });
      const key2 = lineage.addInput('data2');
      
      expect(key1).toBe('data1');
      expect(key2).toBe('data2');
    });

    test('should add step nodes and return their keys', () => {
      const lineage = new LineageGraph();
      
      const key1 = lineage.addStep('transform1', { operation: 'filter' });
      const key2 = lineage.addStep('transform2');
      
      expect(key1).toBe('transform1');
      expect(key2).toBe('transform2');
    });

    test('should add nodes with generic addNode method', () => {
      const lineage = new LineageGraph();
      
      const outputKey = lineage.addNode('output1', NodeRole.OUTPUT);
      const inputKey = lineage.addNode('input1', NodeRole.INPUT);
      const stepKey = lineage.addNode('step1', NodeRole.STEP);
      
      expect(outputKey).toBe('output1');
      expect(inputKey).toBe('input1');
      expect(stepKey).toBe('step1');
    });
  });

  describe('Node Retrieval', () => {
    test('should identify output nodes as root nodes when no edges exist', () => {
      const lineage = new LineageGraph();
      
      lineage.addOutput('metric1');
      lineage.addOutput('metric2');
      lineage.addInput('data1');
      lineage.addStep('transform1');
      
      const rootNodes = lineage.getRootNodes();
      
      expect(rootNodes).toContain('metric1');
      expect(rootNodes).toContain('metric2');
      expect(rootNodes).not.toContain('data1');
      expect(rootNodes).not.toContain('transform1');
    });

    test('should identify input nodes as leaf nodes when no edges exist', () => {
      const lineage = new LineageGraph();
      
      lineage.addOutput('metric1');
      lineage.addInput('data1');
      lineage.addInput('data2');
      lineage.addStep('transform1');
      
      const leafNodes = lineage.getLeafNodes();
      
      expect(leafNodes).toContain('data1');
      expect(leafNodes).toContain('data2');
      expect(leafNodes).not.toContain('metric1');
      expect(leafNodes).not.toContain('transform1');
    });

    test('should return empty arrays when no nodes exist', () => {
      const lineage = new LineageGraph();
      
      expect(lineage.getRootNodes()).toEqual([]);
      expect(lineage.getLeafNodes()).toEqual([]);
    });
  });
});

describe('LineageGraph - Edge Operations & Dependencies', () => {
  describe('Edge Creation - Valid Cases', () => {
    test('should allow OUTPUT -> STEP edges', () => {
      const lineage = new LineageGraph();
      
      lineage.addOutput('metric1');
      lineage.addStep('transform1');
      
      const edgeKey = lineage.addEdge('metric1', 'transform1');
      expect(typeof edgeKey).toBe('string');
      expect(edgeKey.length).toBeGreaterThan(0);
    });

    test('should allow STEP -> INPUT edges', () => {
      const lineage = new LineageGraph();
      
      lineage.addStep('transform1');
      lineage.addInput('data1');
      
      const edgeKey = lineage.addEdge('transform1', 'data1');
      expect(typeof edgeKey).toBe('string');
      expect(edgeKey.length).toBeGreaterThan(0);
    });

    test('should allow OUTPUT -> INPUT edges (direct)', () => {
      const lineage = new LineageGraph();
      
      lineage.addOutput('metric1');
      lineage.addInput('data1');
      
      const edgeKey = lineage.addEdge('metric1', 'data1');
      expect(typeof edgeKey).toBe('string');
      expect(edgeKey.length).toBeGreaterThan(0);
    });

    test('should allow STEP -> STEP edges', () => {
      const lineage = new LineageGraph();
      
      lineage.addStep('step1');
      lineage.addStep('step2');
      
      const edgeKey = lineage.addEdge('step1', 'step2');
      expect(typeof edgeKey).toBe('string');
      expect(edgeKey.length).toBeGreaterThan(0);
    });

    test('should handle edge attributes correctly', () => {
      const lineage = new LineageGraph();
      
      lineage.addOutput('metric1');
      lineage.addStep('transform1');
      
      const edgeKey = lineage.addEdge('metric1', 'transform1', { 
        weight: 0.8, 
        transform: 'aggregation' 
      });
      
      expect(edgeKey).toBeDefined();
    });
  });

  describe('Edge Creation - Invalid Cases', () => {
    test('should reject incoming edges to OUTPUT nodes', () => {
      const lineage = new LineageGraph();
      
      lineage.addOutput('metric1');
      lineage.addStep('transform1');
      
      // Cannot have: STEP -> OUTPUT
      expect(() => {
        lineage.addEdge('transform1', 'metric1');
      }).toThrow('Cannot add incoming edge to OUTPUT node');
    });

    test('should reject outgoing edges from INPUT nodes', () => {
      const lineage = new LineageGraph();
      
      lineage.addInput('data1');
      lineage.addStep('transform1');
      
      // Cannot have: INPUT -> STEP
      expect(() => {
        lineage.addEdge('data1', 'transform1');
      }).toThrow('Cannot add outgoing edge from INPUT node');
    });
  });
}); 