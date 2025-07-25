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

describe('LineageGraph - Direct Neighbors', () => {
  describe('getUpstreamNodes', () => {
    test('should return direct upstream nodes (predecessors)', () => {
      const lineage = new LineageGraph();
      
      // Create: output1 -> step1 -> input1  
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'input1');
      
      // Test upstream connections
      expect(lineage.getUpstreamNodes('step1')).toEqual(['output1']);
      expect(lineage.getUpstreamNodes('input1')).toEqual(['step1']);
      expect(lineage.getUpstreamNodes('output1')).toEqual([]);
    });

    test('should handle multiple upstream nodes', () => {
      const lineage = new LineageGraph();
      
      // Create: output1 -> step1 <- output2
      lineage.addOutput('output1');
      lineage.addOutput('output2'); 
      lineage.addStep('step1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output2', 'step1');
      
      const upstream = lineage.getUpstreamNodes('step1');
      expect(upstream).toHaveLength(2);
      expect(upstream).toContain('output1');
      expect(upstream).toContain('output2');
    });

    test('should throw error for non-existent node', () => {
      const lineage = new LineageGraph();
      
      expect(() => {
        lineage.getUpstreamNodes('nonexistent');
      }).toThrow('Node not found: nonexistent');
    });
  });

  describe('getDownstreamNodes', () => {
    test('should return direct downstream nodes (successors)', () => {
      const lineage = new LineageGraph();
      
      // Create: output1 -> step1 -> input1
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'input1');
      
      // Test downstream connections
      expect(lineage.getDownstreamNodes('output1')).toEqual(['step1']);
      expect(lineage.getDownstreamNodes('step1')).toEqual(['input1']);
      expect(lineage.getDownstreamNodes('input1')).toEqual([]);
    });

    test('should handle multiple downstream nodes', () => {
      const lineage = new LineageGraph();
      
      // Create: step1 -> input1
      //               -> input2
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addInput('input2');
      lineage.addEdge('step1', 'input1');
      lineage.addEdge('step1', 'input2');
      
      const downstream = lineage.getDownstreamNodes('step1');
      expect(downstream).toHaveLength(2);
      expect(downstream).toContain('input1');
      expect(downstream).toContain('input2');
    });

    test('should throw error for non-existent node', () => {
      const lineage = new LineageGraph();
      
      expect(() => {
        lineage.getDownstreamNodes('nonexistent');  
      }).toThrow('Node not found: nonexistent');
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

describe('LineageGraph - Graph Validation', () => {
  describe('isAcyclic', () => {
    test('should return true for simple linear graph', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP -> INPUT (no cycles)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'input1');
      
      expect(lineage.isAcyclic()).toBe(true);
    });

    test('should return false for simple cycle', () => {
      const lineage = new LineageGraph();
      
      // Create: STEP1 -> STEP2 -> STEP3 -> STEP1 cycle
      lineage.addStep('step1');
      lineage.addStep('step2'); 
      lineage.addStep('step3');
      lineage.addEdge('step1', 'step2');
      lineage.addEdge('step2', 'step3');
      lineage.addEdge('step3', 'step1');
      
      expect(lineage.isAcyclic()).toBe(false);
    });

    test('should return true for complex DAG', () => {
      const lineage = new LineageGraph();
      
      // Diamond pattern: OUTPUT -> STEP1 -> INPUT
      //                        -> STEP2 -> /
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output1', 'step2');
      lineage.addEdge('step1', 'input1');
      lineage.addEdge('step2', 'input1');
      
      expect(lineage.isAcyclic()).toBe(true);
    });
  });

  describe('hasValidFlow', () => {
    test('should return true for direct OUTPUT -> INPUT', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> INPUT (simplest valid flow)
      lineage.addOutput('output1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'input1');
      
      expect(lineage.hasValidFlow()).toBe(true);
    });

    test('should return true for OUTPUT -> STEP -> INPUT', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP -> INPUT (standard lineage pattern)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'input1');
      
      expect(lineage.hasValidFlow()).toBe(true);
    });

    test('should return true for multi-level: OUTPUT -> STEP1 -> STEP2 -> INPUT', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP1 -> STEP2 -> INPUT (complex transformation chain)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'step2');
      lineage.addEdge('step2', 'input1');
      
      expect(lineage.hasValidFlow()).toBe(true);
    });

    test('should return true for branching: OUTPUT -> [STEP1, STEP2] -> INPUT', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP1 -> INPUT
      //         OUTPUT -> STEP2 -> INPUT (both branches complete)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output1', 'step2');
      lineage.addEdge('step1', 'input1');
      lineage.addEdge('step2', 'input1');
      
      expect(lineage.hasValidFlow()).toBe(true);
    });

    test('should return false for dangling STEP in branching pattern', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP1 -> INPUT
      //         OUTPUT -> STEP2 (dangling - no outgoing edge)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output1', 'step2');
      lineage.addEdge('step1', 'input1');
      // Note: step2 has no outgoing edge, making it invalid
      
      expect(lineage.hasValidFlow()).toBe(false);
    });

    test('should return true for disconnected components', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT1 -> INPUT1, OUTPUT2 -> INPUT2 (separate valid chains)
      lineage.addOutput('output1');
      lineage.addInput('input1');
      lineage.addOutput('output2');
      lineage.addInput('input2');
      lineage.addEdge('output1', 'input1');
      lineage.addEdge('output2', 'input2');
      
      expect(lineage.hasValidFlow()).toBe(true);
    });

    test('should return false for empty graph', () => {
      const lineage = new LineageGraph();
      
      // Empty graph - no nodes at all
      
      expect(lineage.hasValidFlow()).toBe(false);
    });

    test('should return false for orphaned OUTPUT nodes', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT1 -> INPUT1 (valid), OUTPUT2 (orphaned - no outgoing edges)
      lineage.addOutput('output1');
      lineage.addInput('input1');
      lineage.addOutput('output2');
      lineage.addEdge('output1', 'input1');
      // Note: output2 has no outgoing edges, making it orphaned
      
      expect(lineage.hasValidFlow()).toBe(false);
    });

    test('should return false for orphaned INPUT nodes', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT1 -> INPUT1 (valid), INPUT2 (orphaned - no incoming edges)
      lineage.addOutput('output1');
      lineage.addInput('input1');
      lineage.addInput('input2');
      lineage.addEdge('output1', 'input1');
      // Note: input2 has no incoming edges, making it orphaned
      
      expect(lineage.hasValidFlow()).toBe(false);
    });

    test('should return false for orphaned STEP nodes', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT1 -> INPUT1 (valid), STEP1 (orphaned - no connections)
      lineage.addOutput('output1');
      lineage.addInput('input1');
      lineage.addStep('step1');
      lineage.addEdge('output1', 'input1');
      // Note: step1 has no incoming or outgoing edges, making it orphaned
      
      expect(lineage.hasValidFlow()).toBe(false);
    });

    test('should return false for STEP with only incoming edges', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT1 -> STEP1 (dangling - no outgoing edge), OUTPUT2 -> INPUT1 (valid)
      lineage.addOutput('output1');
      lineage.addOutput('output2');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output2', 'input1');
      // Note: step1 has incoming edge but no outgoing edge
      
      expect(lineage.hasValidFlow()).toBe(false);
    });

    test('should return false for STEP with only outgoing edges', () => {
      const lineage = new LineageGraph();
      
      // Create: STEP1 -> INPUT1 (dangling - no incoming edge), OUTPUT1 -> INPUT2 (valid)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addInput('input2');
      lineage.addEdge('step1', 'input1');
      lineage.addEdge('output1', 'input2');
      // Note: step1 has outgoing edge but no incoming edge
      
      expect(lineage.hasValidFlow()).toBe(false);
    });
  });

  describe('isValid', () => {
    test('should return true when both acyclic and has valid flow', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP -> INPUT (both acyclic and valid flow)
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'input1');
      
      expect(lineage.isValid()).toBe(true);
    });

    test('should return false when acyclic but invalid flow', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT1 -> INPUT1 (valid), OUTPUT2 (orphaned - invalid flow but acyclic)
      lineage.addOutput('output1');
      lineage.addInput('input1');
      lineage.addOutput('output2');
      lineage.addEdge('output1', 'input1');
      // Note: output2 orphaned makes invalid flow, but graph is still acyclic
      
      expect(lineage.isValid()).toBe(false);
    });

    test('should return false when valid flow but has cycles', () => {
      const lineage = new LineageGraph();
      
      // Create: OUTPUT -> STEP1 -> STEP2 -> STEP1 (cycle) -> INPUT
      // This would have valid flow pattern but contains a cycle
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'step2');
      lineage.addEdge('step2', 'step1'); // Creates cycle
      lineage.addEdge('step2', 'input1');
      
      expect(lineage.isValid()).toBe(false);
    });
  });
}); 

describe('LineageGraph - Dependency Analysis', () => {
  describe('getLineage', () => {
    test('should throw error for non-existent node', () => {
      const lineage = new LineageGraph();
      
      expect(() => {
        lineage.getLineage('nonexistent');
      }).toThrow('Node not found: nonexistent');
    });

    test('should return downstream lineage for OUTPUT node (complex graph with disconnected components)', () => {
      const lineage = new LineageGraph();
      
      // Build Component 1 (connected - more complex)
      lineage.addOutput('output1');
      lineage.addOutput('output2');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addInput('input2');
      
      // Component 1 edges
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output1', 'step2');
      lineage.addEdge('output2', 'step2');  // output2 also feeds step2
      lineage.addEdge('step1', 'input1');
      lineage.addEdge('step2', 'input2');
      lineage.addEdge('step2', 'input1');   // step2 connects to both inputs
      
      // Build Component 2 (disconnected)
      lineage.addOutput('output3');
      lineage.addStep('step3');
      lineage.addInput('input3');
      lineage.addEdge('output3', 'step3');
      lineage.addEdge('step3', 'input3');
      
      // Call getLineage on output1
      const result = lineage.getLineage('output1');
      
      // Build expected LineageGraph manually
      const expected = new LineageGraph();
      expected.addOutput('output1');
      expected.addStep('step1');
      expected.addStep('step2');
      expected.addInput('input1');
      expected.addInput('input2');
      
      // Expected edges (only output1's dependency chain)
      expected.addEdge('output1', 'step1');
      expected.addEdge('output1', 'step2');
      expected.addEdge('step1', 'input1');
      expected.addEdge('step2', 'input2');
      expected.addEdge('step2', 'input1');
      
      // Test graph equality
      expect(result.equals(expected)).toBe(true);
    });

    test('should return upstream lineage for INPUT node (complex graph with disconnected components)', () => {
      const lineage = new LineageGraph();
      
      // Build Component 1 (connected to input1)
      lineage.addOutput('output1');
      lineage.addOutput('output2');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addInput('input1');
      lineage.addInput('input2');  // sibling node
      
      // Component 1 edges
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('output2', 'step2');
      lineage.addEdge('step1', 'input1');
      lineage.addEdge('step2', 'input1');  // multiple outputs feeding same input
      lineage.addEdge('step2', 'input2');  // step2 also feeds input2 (sibling)
      
      // Build Component 2 (disconnected)
      lineage.addOutput('output3');
      lineage.addStep('step3');
      lineage.addInput('input3');
      lineage.addEdge('output3', 'step3');
      lineage.addEdge('step3', 'input3');
      
      // Call getLineage on input1
      const result = lineage.getLineage('input1');
      
      // Build expected LineageGraph manually
      const expected = new LineageGraph();
      expected.addOutput('output1');
      expected.addOutput('output2');
      expected.addStep('step1');
      expected.addStep('step2');
      expected.addInput('input1');
      
      // Expected edges (only upstream chains to input1)
      expected.addEdge('output1', 'step1');
      expected.addEdge('output2', 'step2');
      expected.addEdge('step1', 'input1');
      expected.addEdge('step2', 'input1');
      
      // Test graph equality
      expect(result.equals(expected)).toBe(true);
    });

    test('should return complete lineage for STEP node (complex graph with disconnected components)', () => {
      const lineage = new LineageGraph();
      
      // Build Component 1
      lineage.addOutput('output1');
      lineage.addStep('step1');
      lineage.addStep('step2');
      lineage.addStep('step3');
      lineage.addInput('input1');
      lineage.addInput('input2');
      
      // Component 1 edges
      lineage.addEdge('output1', 'step1');
      lineage.addEdge('step1', 'step2');
      lineage.addEdge('step1', 'step3');  // sibling branch from step1
      lineage.addEdge('step2', 'input1');
      lineage.addEdge('step3', 'input2');
      
      // Build Component 2 (disconnected)
      lineage.addOutput('output3');
      lineage.addStep('step4');
      lineage.addInput('input3');
      lineage.addEdge('output3', 'step4');
      lineage.addEdge('step4', 'input3');
      
      // Call getLineage on step2
      const result = lineage.getLineage('step2');
      
      // Build expected LineageGraph manually (complete lineage through step2)
      const expected = new LineageGraph();
      expected.addOutput('output1');
      expected.addStep('step1');
      expected.addStep('step2');
      expected.addInput('input1');
      
      // Expected edges (complete lineage chain through step2)
      expected.addEdge('output1', 'step1');
      expected.addEdge('step1', 'step2');
      expected.addEdge('step2', 'input1');
      
      // Test graph equality
      expect(result.equals(expected)).toBe(true);
    });
  });

  describe('Factory Methods', () => {
    describe('static from(data)', () => {
      describe('Equivalence Tests', () => {
        test('should create simple direct LineageGraph equivalent to manual construction', () => {
          // Test creating the simplest valid lineage graph: OUTPUT -> INPUT
          const data = {
            nodes: [
              { key: 'output1', role: NodeRole.OUTPUT, attributes: { source: 'sales' } },
              { key: 'input1', role: NodeRole.INPUT, attributes: { target: 'warehouse' } }
            ],
            edges: [
              { source: 'output1', target: 'input1', attributes: { confidence: 0.9 } }
            ]
          };
          
          const fromResult = LineageGraph.from(data);
          
          // Manually construct equivalent graph
          const manualResult = new LineageGraph();
          manualResult.addOutput('output1', { source: 'sales' });
          manualResult.addInput('input1', { target: 'warehouse' });
          manualResult.addEdge('output1', 'input1', { confidence: 0.9 });
          
          // Should be equivalent
          expect(fromResult.equals(manualResult)).toBe(true);
          expect(fromResult.isValid()).toBe(true);
        });

        test('should create complex branching LineageGraph equivalent to manual construction', () => {
          // Test creating a complex graph with branching, multiple node types, and custom attributes
          const data = {
            nodes: [
              { key: 'output1', role: NodeRole.OUTPUT, attributes: { label: 'Sales Data', version: '1.0' } },
              { key: 'step1', role: NodeRole.STEP, attributes: { transform: 'aggregation', priority: 1 } },
              { key: 'step2', role: NodeRole.STEP, attributes: { transform: 'filter', priority: 2 } },
              { key: 'input1', role: NodeRole.INPUT, attributes: { source: 'database', table: 'transactions' } },
              { key: 'input2', role: NodeRole.INPUT, attributes: { source: 'api', endpoint: '/users' } }
            ],
            edges: [
              { source: 'output1', target: 'step1', attributes: { weight: 0.8, type: 'primary' } },
              { source: 'output1', target: 'step2', attributes: { weight: 0.6, type: 'secondary' } },
              { source: 'step1', target: 'input1', attributes: { confidence: 0.95 } },
              { source: 'step2', target: 'input2', attributes: { confidence: 0.87 } }
            ]
          };
          
          const fromResult = LineageGraph.from(data);
          
          // Manually construct equivalent graph
          const manualResult = new LineageGraph();
          manualResult.addOutput('output1', { label: 'Sales Data', version: '1.0' });
          manualResult.addStep('step1', { transform: 'aggregation', priority: 1 });
          manualResult.addStep('step2', { transform: 'filter', priority: 2 });
          manualResult.addInput('input1', { source: 'database', table: 'transactions' });
          manualResult.addInput('input2', { source: 'api', endpoint: '/users' });
          
          manualResult.addEdge('output1', 'step1', { weight: 0.8, type: 'primary' });
          manualResult.addEdge('output1', 'step2', { weight: 0.6, type: 'secondary' });
          manualResult.addEdge('step1', 'input1', { confidence: 0.95 });
          manualResult.addEdge('step2', 'input2', { confidence: 0.87 });
          
          // Should be equivalent (this tests attribute preservation automatically)
          expect(fromResult.equals(manualResult)).toBe(true);
          expect(fromResult.isValid()).toBe(true);
        });
      });

      describe('Error Cases', () => {
        test('should throw error for empty data (invalid graph)', () => {
          // Test that empty data is rejected since empty graphs are invalid
          const data = { nodes: [], edges: [] };
          
          expect(() => {
            LineageGraph.from(data);
          }).toThrow(/empty.*invalid|invalid.*empty|validation.*failed/i);
        });

        test('should throw error for edges referencing non-existent nodes', () => {
          // Test error handling when edges reference nodes that don't exist in the nodes array
          const data = {
            nodes: [
              { key: 'output1', role: NodeRole.OUTPUT },
              { key: 'input1', role: NodeRole.INPUT }
            ],
            edges: [
              { source: 'output1', target: 'missing-node' } // Non-existent target
            ]
          };
          
          expect(() => {
            LineageGraph.from(data);
          }).toThrow(/missing-node/); // Should mention the missing node
        });

        test('should throw error for invalid role-based edge connections', () => {
          // Test that role-based edge validation is enforced during creation
          const data = {
            nodes: [
              { key: 'output1', role: NodeRole.OUTPUT },
              { key: 'input1', role: NodeRole.INPUT }
            ],
            edges: [
              { source: 'input1', target: 'output1' } // Invalid: INPUT -> OUTPUT
            ]
          };
          
          expect(() => {
            LineageGraph.from(data);
          }).toThrow(/cannot add outgoing edge from INPUT node|outgoing.*INPUT/i);
        });

        test('should throw error for invalid node roles', () => {
          // Test that node roles are properly validated and enforced
          const dataWithInvalidRole = {
            nodes: [
              { key: 'node1', role: 'invalid_role' as any } // Invalid role
            ],
            edges: []
          };
          
          expect(() => {
            LineageGraph.from(dataWithInvalidRole);
          }).toThrow(/invalid.*role|role.*invalid/i);
          
          const dataWithMissingRole = {
            nodes: [
              { key: 'node1' } as any // Missing role property
            ],
            edges: []
          };
          
          expect(() => {
            LineageGraph.from(dataWithMissingRole);
          }).toThrow(/role.*required|missing.*role/i);
        });

        test('should throw error for duplicate node keys', () => {
          // Test that duplicate node keys are rejected as errors
          const data = {
            nodes: [
              { key: 'node1', role: NodeRole.OUTPUT, attributes: { version: '1.0' } },
              { key: 'node1', role: NodeRole.STEP, attributes: { version: '2.0' } } // Duplicate key
            ],
            edges: []
          };
          
          expect(() => {
            LineageGraph.from(data);
          }).toThrow(/duplicate.*node1|node1.*duplicate/i);
        });

        test('should throw error for graphs that fail validation (dangling nodes)', () => {
          // Test that graphs with valid individual elements but invalid overall structure are rejected
          const data = {
            nodes: [
              { key: 'output1', role: NodeRole.OUTPUT },
              { key: 'input1', role: NodeRole.INPUT },
              { key: 'step1', role: NodeRole.STEP } // Dangling STEP (not connected to anything)
            ],
            edges: [
              { source: 'output1', target: 'input1' } // Valid path, but step1 is dangling
            ]
          };
          
          expect(() => {
            LineageGraph.from(data);
          }).toThrow(/invalid.*graph|validation.*failed|valid.*flow/i);
        });
      });
    });
  });
}); 