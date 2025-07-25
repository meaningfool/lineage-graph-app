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