// LineageGraph tests for graphology-based implementation 
import { describe, test, expect } from 'vitest';
import { DirectedGraph } from 'graphology';
import { LineageGraph, NodeRole, generateLineageGraph } from '../lineagegraph';


describe('LineageGraph - Construction', () => {
  describe('static from()', () => {
    describe('successful construction', () => {
      test('should create simple LineageGraph with custom attributes', () => {
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
        
        const result = LineageGraph.from(data);
        
        // Verify node attributes are preserved
        const graph = result.getGraph();
        expect(graph.getNodeAttributes('output1')).toEqual({ role: NodeRole.OUTPUT, source: 'sales' });
        expect(graph.getNodeAttributes('input1')).toEqual({ role: NodeRole.INPUT, target: 'warehouse' });
        
        // Verify edge attributes are preserved  
        expect(graph.getEdgeAttributes('output1', 'input1')).toEqual({ confidence: 0.9 });
        
        // Verify graph structure
        expect(graph.hasNode('output1')).toBe(true);
        expect(graph.hasNode('input1')).toBe(true);
        expect(graph.hasEdge('output1', 'input1')).toBe(true);
      });

      test('should create complex branching LineageGraph with attribute preservation', () => {
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
        
        const result = LineageGraph.from(data);
        const graph = result.getGraph();
        
        // Verify all node attributes are preserved
        expect(graph.getNodeAttributes('output1')).toEqual({ role: NodeRole.OUTPUT, label: 'Sales Data', version: '1.0' });
        expect(graph.getNodeAttributes('step1')).toEqual({ role: NodeRole.STEP, transform: 'aggregation', priority: 1 });
        expect(graph.getNodeAttributes('step2')).toEqual({ role: NodeRole.STEP, transform: 'filter', priority: 2 });
        expect(graph.getNodeAttributes('input1')).toEqual({ role: NodeRole.INPUT, source: 'database', table: 'transactions' });
        expect(graph.getNodeAttributes('input2')).toEqual({ role: NodeRole.INPUT, source: 'api', endpoint: '/users' });
        
        // Verify all edge attributes are preserved
        expect(graph.getEdgeAttributes('output1', 'step1')).toEqual({ weight: 0.8, type: 'primary' });
        expect(graph.getEdgeAttributes('output1', 'step2')).toEqual({ weight: 0.6, type: 'secondary' });
        expect(graph.getEdgeAttributes('step1', 'input1')).toEqual({ confidence: 0.95 });
        expect(graph.getEdgeAttributes('step2', 'input2')).toEqual({ confidence: 0.87 });
        
        // Verify graph structure
        expect(graph.order).toBe(5); // 5 nodes
        expect(graph.size).toBe(4);  // 4 edges
      });
    });

    describe('validation failures', () => {
      test('should throw error for empty data', () => {
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
        }).toThrow(/INPUT node.*cannot have outgoing edges|outgoing.*INPUT/i);
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
        }).toThrow(/invalid role.*undefined|role.*required|missing.*role/i);
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

      test('should throw error for orphaned OUTPUT nodes', () => {
        // Create: OUTPUT1 -> INPUT1 (valid), OUTPUT2 (orphaned - no outgoing edges)
        const data = {
          nodes: [
            { key: 'output1', role: NodeRole.OUTPUT },
            { key: 'input1', role: NodeRole.INPUT },
            { key: 'output2', role: NodeRole.OUTPUT }
          ],
          edges: [
            { source: 'output1', target: 'input1' }
            // Note: output2 has no outgoing edges, making it orphaned
          ]
        };
        
        expect(() => {
          LineageGraph.from(data);
        }).toThrow(/invalid.*graph|validation.*failed|valid.*flow/i);
      });

      test('should throw error for graphs with cycles', () => {
        // Create: OUTPUT -> STEP1 -> STEP2 -> STEP1 (cycle) -> INPUT
        const data = {
          nodes: [
            { key: 'output1', role: NodeRole.OUTPUT },
            { key: 'step1', role: NodeRole.STEP },
            { key: 'step2', role: NodeRole.STEP },
            { key: 'input1', role: NodeRole.INPUT }
          ],
          edges: [
            { source: 'output1', target: 'step1' },
            { source: 'step1', target: 'step2' },
            { source: 'step2', target: 'step1' }, // Creates cycle
            { source: 'step2', target: 'input1' }
          ]
        };
        
        expect(() => {
          LineageGraph.from(data);
        }).toThrow(/invalid.*graph|validation.*failed|valid.*flow/i);
      });

      test('should throw error for orphaned STEP and INPUT nodes', () => {
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

  describe('constructor', () => {
    test('should throw error for undefined graph', () => {
      expect(() => {
        new LineageGraph(undefined);
      }).toThrow(/Empty LineageGraphs are not allowed/i);
    });

    test('should throw error for empty DirectedGraph', () => {
      const emptyGraph = new DirectedGraph();
      expect(() => {
        new LineageGraph(emptyGraph);
      }).toThrow(/Empty LineageGraphs are not allowed/i);
    });

    test('should succeed with valid DirectedGraph', () => {
      // Create a valid DirectedGraph manually
      const validGraph = new DirectedGraph();
      validGraph.addNode('output1', { role: NodeRole.OUTPUT });
      validGraph.addNode('input1', { role: NodeRole.INPUT });
      validGraph.addEdge('output1', 'input1');
      
      expect(() => {
        new LineageGraph(validGraph);
      }).not.toThrow();
    });
  });
}); 

describe('LineageGraph - Dependency Analysis', () => {
  describe('getLineage', () => {
    test('should throw error for non-existent node', () => {
      // Create a simple valid graph first
      const data = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'input1', role: NodeRole.INPUT }
        ],
        edges: [
          { source: 'output1', target: 'input1' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      
      expect(() => {
        lineage.getLineage('nonexistent');
      }).toThrow('Node not found: nonexistent');
    });

    test('should return downstream lineage for OUTPUT node (complex graph with disconnected components)', () => {
      // Build Component 1 (connected - more complex) + Component 2 (disconnected)
      const data = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'output2', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT },
          { key: 'input2', role: NodeRole.INPUT },
          { key: 'output3', role: NodeRole.OUTPUT },
          { key: 'step3', role: NodeRole.STEP },
          { key: 'input3', role: NodeRole.INPUT }
        ],
        edges: [
          // Component 1 edges
          { source: 'output1', target: 'step1' },
          { source: 'output1', target: 'step2' },
          { source: 'output2', target: 'step2' },  // output2 also feeds step2
          { source: 'step1', target: 'input1' },
          { source: 'step2', target: 'input2' },
          { source: 'step2', target: 'input1' },   // step2 connects to both inputs
          // Component 2 edges (disconnected)
          { source: 'output3', target: 'step3' },
          { source: 'step3', target: 'input3' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      
      // Call getLineage on output1
      const result = lineage.getLineage('output1');
      
      // Build expected LineageGraph using from()
      const expectedData = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT },
          { key: 'input2', role: NodeRole.INPUT }
        ],
        edges: [
          // Expected edges (only output1's dependency chain)
          { source: 'output1', target: 'step1' },
          { source: 'output1', target: 'step2' },
          { source: 'step1', target: 'input1' },
          { source: 'step2', target: 'input2' },
          { source: 'step2', target: 'input1' }
        ]
      };
      
      const expected = LineageGraph.from(expectedData);
      
      // Test graph equality
      expect(result.equals(expected)).toBe(true);
    });

    test('should return upstream lineage for INPUT node (complex graph with disconnected components)', () => {
      // Build Component 1 (connected to input1) + Component 2 (disconnected)
      const data = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'output2', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT },
          { key: 'input2', role: NodeRole.INPUT },  // sibling node
          { key: 'output3', role: NodeRole.OUTPUT },
          { key: 'step3', role: NodeRole.STEP },
          { key: 'input3', role: NodeRole.INPUT }
        ],
        edges: [
          // Component 1 edges
          { source: 'output1', target: 'step1' },
          { source: 'output2', target: 'step2' },
          { source: 'step1', target: 'input1' },
          { source: 'step2', target: 'input1' },  // multiple outputs feeding same input
          { source: 'step2', target: 'input2' },  // step2 also feeds input2 (sibling)
          // Component 2 edges (disconnected)
          { source: 'output3', target: 'step3' },
          { source: 'step3', target: 'input3' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      
      // Call getLineage on input1
      const result = lineage.getLineage('input1');
      
      // Build expected LineageGraph using from()
      const expectedData = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'output2', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT }
        ],
        edges: [
          // Expected edges (only upstream chains to input1)
          { source: 'output1', target: 'step1' },
          { source: 'output2', target: 'step2' },
          { source: 'step1', target: 'input1' },
          { source: 'step2', target: 'input1' }
        ]
      };
      
      const expected = LineageGraph.from(expectedData);
      
      // Test graph equality
      expect(result.equals(expected)).toBe(true);
    });

    test('should return complete lineage for STEP node (complex graph with disconnected components)', () => {
      // Build Component 1 + Component 2 (disconnected)
      const data = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP },
          { key: 'step3', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT },
          { key: 'input2', role: NodeRole.INPUT },
          { key: 'output3', role: NodeRole.OUTPUT },
          { key: 'step4', role: NodeRole.STEP },
          { key: 'input3', role: NodeRole.INPUT }
        ],
        edges: [
          // Component 1 edges
          { source: 'output1', target: 'step1' },
          { source: 'step1', target: 'step2' },
          { source: 'step1', target: 'step3' },  // sibling branch from step1
          { source: 'step2', target: 'input1' },
          { source: 'step3', target: 'input2' },
          // Component 2 edges (disconnected)
          { source: 'output3', target: 'step4' },
          { source: 'step4', target: 'input3' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      
      // Call getLineage on step2
      const result = lineage.getLineage('step2');
      
      // Build expected LineageGraph using from() (complete lineage through step2)
      const expectedData = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT }
        ],
        edges: [
          // Expected edges (complete lineage chain through step2)
          { source: 'output1', target: 'step1' },
          { source: 'step1', target: 'step2' },
          { source: 'step2', target: 'input1' }
        ]
      };
      
      const expected = LineageGraph.from(expectedData);
      
      // Test graph equality
      expect(result.equals(expected)).toBe(true);
    });
  });


}); 

describe('LineageGraph - Graph Analysis', () => {
  describe('getLayers', () => {

    test('should position all nodes in correct layers for complex multi-component graph', () => {
      // Component 1: Complex convergent structure + Component 2: Disconnected longer chain
      const data = {
        nodes: [
          // Component 1 nodes
          { key: 'OUTPUT1', role: NodeRole.OUTPUT },
          { key: 'OUTPUT2', role: NodeRole.OUTPUT },
          { key: 'STEP1', role: NodeRole.STEP },
          { key: 'STEPA', role: NodeRole.STEP },
          { key: 'STEP2', role: NodeRole.STEP },
          { key: 'STEP3', role: NodeRole.STEP },
          { key: 'STEPC', role: NodeRole.STEP },
          { key: 'STEPD', role: NodeRole.STEP },
          { key: 'STEP4', role: NodeRole.STEP },
          { key: 'STEP5', role: NodeRole.STEP },
          { key: 'INPUT1', role: NodeRole.INPUT },
          { key: 'INPUTB', role: NodeRole.INPUT },
          { key: 'INPUT2', role: NodeRole.INPUT },
          // Component 2 nodes
          { key: 'OUTPUT3', role: NodeRole.OUTPUT },
          { key: 'STEP6', role: NodeRole.STEP },
          { key: 'STEP7', role: NodeRole.STEP },
          { key: 'STEP8', role: NodeRole.STEP },
          { key: 'INPUT3', role: NodeRole.INPUT }
        ],
        edges: [
          // Component 1 edges:
          // OUTPUT1 -> STEP1 -> STEPA -> STEP3 -> INPUT1
          { source: 'OUTPUT1', target: 'STEP1' },
          { source: 'STEP1', target: 'STEPA' },
          { source: 'STEPA', target: 'STEP3' },
          { source: 'STEP3', target: 'INPUT1' },
          
          // OUTPUT1 -> STEP2 -> STEP3 -> INPUTB
          { source: 'OUTPUT1', target: 'STEP2' },
          { source: 'STEP2', target: 'STEP3' },
          { source: 'STEP3', target: 'INPUTB' },
          
          // OUTPUT2 -> STEPC -> STEPD -> STEP2 -> STEP3 -> INPUT1
          { source: 'OUTPUT2', target: 'STEPC' },
          { source: 'STEPC', target: 'STEPD' },
          { source: 'STEPD', target: 'STEP2' },
          
          // OUTPUT2 -> STEP4 -> STEP5 -> INPUT2
          { source: 'OUTPUT2', target: 'STEP4' },
          { source: 'STEP4', target: 'STEP5' },
          { source: 'STEP5', target: 'INPUT2' },
          
          // Component 2 edges:
          // OUTPUT3 -> STEP6 -> STEP7 -> STEP8 -> INPUT3
          { source: 'OUTPUT3', target: 'STEP6' },
          { source: 'STEP6', target: 'STEP7' },
          { source: 'STEP7', target: 'STEP8' },
          { source: 'STEP8', target: 'INPUT3' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      const layers = lineage.getLayers();
      
      // Expected layer structure based on distance from OUTPUT nodes:
      expect(layers).toEqual([
        // Layer 0: All OUTPUT nodes
        ['OUTPUT1', 'OUTPUT2', 'OUTPUT3'],
        
        // Layer 1: Nodes at distance 1 from outputs
        ['STEP1', 'STEPC', 'STEP4', 'STEP6'],
        
        // Layer 2: Nodes at distance 2 from outputs
        ['STEPA', 'STEPD', 'STEP5', 'STEP7'],
        
        // Layer 3: Nodes at distance 3 from outputs
        ['STEP2', 'STEP8'],
        
        // Layer 4: Nodes at distance 4 from outputs
        ['STEP3'],
        
        // Layer 5: All INPUT nodes (final layer)
        ['INPUT1', 'INPUTB', 'INPUT2', 'INPUT3']
      ]);
    });

    test('should position node at maximum distance when multiple convergent paths exist', () => {
      // Test convergent paths: STEP2 can be reached via two different path lengths
      // Path 1: OUTPUT1 -> STEP1 -> STEP2 -> INPUT1 (STEP2 at distance 2)
      // Path 2: OUTPUT1 -> STEP2 -> INPUT1 (STEP2 at distance 1) 
      // STEP2 should be positioned at distance 2 (maximum)
      const data = {
        nodes: [
          { key: 'OUTPUT1', role: NodeRole.OUTPUT },
          { key: 'STEP1', role: NodeRole.STEP },
          { key: 'STEP2', role: NodeRole.STEP },
          { key: 'INPUT1', role: NodeRole.INPUT }
        ],
        edges: [
          { source: 'OUTPUT1', target: 'STEP1' },  // Longer path
          { source: 'STEP1', target: 'STEP2' },    // STEP2 via longer path (distance 2)
          { source: 'OUTPUT1', target: 'STEP2' },  // Direct path (distance 1)
          { source: 'STEP2', target: 'INPUT1' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      const layers = lineage.getLayers();
      
      // STEP2 should be at layer 2 (maximum distance), not layer 1
      expect(layers).toEqual([
        ['OUTPUT1'],           // Layer 0: OUTPUT nodes
        ['STEP1'],            // Layer 1: STEP1 (distance 1)
        ['STEP2'],            // Layer 2: STEP2 (maximum distance 2, not 1)
        ['INPUT1']            // Layer 3: INPUT nodes (final layer)
      ]);
    });

    test('should group all INPUT nodes in final layer regardless of their natural distances', () => {
      // Test that INPUT nodes at different natural distances are grouped together
      // Path 1: OUTPUT1 -> S1 -> S2 -> INPUT1 (INPUT1 naturally at distance 3)
      // Path 2: OUTPUT1 -> S1 -> INPUT2 (INPUT2 naturally at distance 2)
      // Both INPUT1 and INPUT2 should end up in the same final layer
      const data = {
        nodes: [
          { key: 'OUTPUT1', role: NodeRole.OUTPUT },
          { key: 'S1', role: NodeRole.STEP },
          { key: 'S2', role: NodeRole.STEP },
          { key: 'INPUT1', role: NodeRole.INPUT },
          { key: 'INPUT2', role: NodeRole.INPUT }
        ],
        edges: [
          { source: 'OUTPUT1', target: 'S1' },    // S1 at distance 1
          { source: 'S1', target: 'S2' },        // S2 at distance 2
          { source: 'S2', target: 'INPUT1' },    // INPUT1 naturally at distance 3
          { source: 'S1', target: 'INPUT2' }     // INPUT2 naturally at distance 2
        ]
      };
      
      const lineage = LineageGraph.from(data);
      const layers = lineage.getLayers();
      
      // All INPUT nodes should be in the final layer together
      expect(layers).toEqual([
        ['OUTPUT1'],              // Layer 0: OUTPUT nodes  
        ['S1'],                  // Layer 1: S1 (distance 1)
        ['S2'],                  // Layer 2: S2 (distance 2)  
        ['INPUT1', 'INPUT2']     // Layer 3: All INPUT nodes together (final layer)
      ]);
    });
  });

  describe('getDepth', () => {

    test('should return number of layers from getLayers()', () => {
      // Simple test case
      const data = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT },
          { key: 'step1', role: NodeRole.STEP },
          { key: 'input1', role: NodeRole.INPUT }
        ],
        edges: [
          { source: 'output1', target: 'step1' },
          { source: 'step1', target: 'input1' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      
      // Should return layers.length
      expect(lineage.getDepth()).toBe(3); // [outputs], [steps], [inputs]
    });
  });

  describe('getWidth', () => {
    test('should return maximum layer cardinality from getLayers()', () => {
      // Create graph with varying layer sizes
      const data = {
        nodes: [
          { key: 'output1', role: NodeRole.OUTPUT }, // Layer 0: 1 node
          { key: 'step1', role: NodeRole.STEP },
          { key: 'step2', role: NodeRole.STEP }, 
          { key: 'step3', role: NodeRole.STEP },     // Layer 1: 3 nodes (widest)
          { key: 'input1', role: NodeRole.INPUT },
          { key: 'input2', role: NodeRole.INPUT }   // Layer 2: 2 nodes
        ],
        edges: [
          { source: 'output1', target: 'step1' },
          { source: 'output1', target: 'step2' },
          { source: 'output1', target: 'step3' },
          { source: 'step1', target: 'input1' },
          { source: 'step2', target: 'input2' },
          { source: 'step3', target: 'input2' }
        ]
      };
      
      const lineage = LineageGraph.from(data);
      
      // Should return max(1, 3, 2) = 3
      expect(lineage.getWidth()).toBe(3);
    });
  });
}); 

describe('generateLineageGraph', () => {
  describe('dimension guarantees', () => {
    test('should guarantee exact depth', () => {
      // Test various depths with seeded randomness for reproducibility
      const depths = [2, 3, 5, 8];
      
      depths.forEach(depth => {
        const graph = generateLineageGraph({ depth, width: 4, seed: 42 });
        expect(graph.getDepth()).toBe(depth);
      });
    });

    test('should guarantee exact width', () => {
      // Test various widths with seeded randomness for reproducibility  
      const widths = [1, 3, 6, 10];
      
      widths.forEach(width => {
        const graph = generateLineageGraph({ depth: 4, width, seed: 42 });
        expect(graph.getWidth()).toBe(width);
      });
    });
  });

  describe('node role structure', () => {
    test('should have OUTPUT nodes in first layer and INPUT nodes in last layer', () => {
      const graph = generateLineageGraph({ depth: 4, width: 3, seed: 42 });
      const layers = graph.getLayers();
      const graphInstance = graph.getGraph();
      
      // First layer should contain only OUTPUT nodes
      const firstLayer = layers[0];
      firstLayer.forEach(nodeKey => {
        const role = graphInstance.getNodeAttributes(nodeKey).role;
        expect(role).toBe(NodeRole.OUTPUT);
      });
      
      // Last layer should contain only INPUT nodes
      const lastLayer = layers[layers.length - 1];
      lastLayer.forEach(nodeKey => {
        const role = graphInstance.getNodeAttributes(nodeKey).role;
        expect(role).toBe(NodeRole.INPUT);
      });
      
      // Middle layers should contain only STEP nodes (if they exist)
      for (let i = 1; i < layers.length - 1; i++) {
        layers[i].forEach(nodeKey => {
          const role = graphInstance.getNodeAttributes(nodeKey).role;
          expect(role).toBe(NodeRole.STEP);
        });
      }
    });
  });

  describe('input validation', () => {
    test('should throw error for invalid depth', () => {
      expect(() => {
        generateLineageGraph({ depth: 1, width: 3 });
      }).toThrow('depth must be at least 2');
      
      expect(() => {
        generateLineageGraph({ depth: 0, width: 3 });
      }).toThrow('depth must be at least 2');
    });

    test('should throw error for invalid width', () => {
      expect(() => {
        generateLineageGraph({ depth: 3, width: 0 });
      }).toThrow('width must be at least 1');
      
      expect(() => {
        generateLineageGraph({ depth: 3, width: -1 });
      }).toThrow('width must be at least 1');
    });



  });

  describe('connectivity behavior', () => {
    test('should create minimal connectivity that satisfies role requirements', () => {
      // Create graph with known structure for predictable testing
      const graph = generateLineageGraph({ 
        depth: 3, 
        width: 4, 
        seed: 123 
      });
      
      const layers = graph.getLayers();
      const graphInstance = graph.getGraph();
      
      // Verify minimal connectivity: every node satisfies role requirements
      for (let i = 0; i < layers.length; i++) {
        for (const nodeKey of layers[i]) {
          const role = graphInstance.getNodeAttributes(nodeKey).role;
          const inDegree = graphInstance.inDegree(nodeKey);
          const outDegree = graphInstance.outDegree(nodeKey);
          
          if (role === NodeRole.OUTPUT) {
            expect(outDegree).toBeGreaterThanOrEqual(1);
          } else if (role === NodeRole.INPUT) {
            expect(inDegree).toBeGreaterThanOrEqual(1);
          } else if (role === NodeRole.STEP) {
            expect(inDegree).toBeGreaterThanOrEqual(1);
            expect(outDegree).toBeGreaterThanOrEqual(1);
          }
        }
      }

    });
  });
}); 