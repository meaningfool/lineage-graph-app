import { describe, it, expect } from 'vitest'
import { applyGraphLayout } from '../graph-layout'
import { LineageGraph, NodeRole } from '../lineagegraph'

describe('applyGraphLayout', () => {
  // Create a test LineageGraph
  const testLineageGraph = LineageGraph.from({
    nodes: [
      {
        key: 'source-1',
        role: NodeRole.INPUT,
        attributes: {
          label: 'Source Data',
          description: 'Test source'
        }
      },
      {
        key: 'step-1', 
        role: NodeRole.STEP,
        attributes: {
          label: 'Processing Step',
          formula: 'source-1 * 2'
        }
      },
      {
        key: 'output-1',
        role: NodeRole.OUTPUT,
        attributes: {
          label: 'Final Result'
        }
      }
    ],
    edges: [
      { source: 'step-1', target: 'source-1' },
      { source: 'output-1', target: 'step-1' }
    ]
  })

  it('returns nodes and edges in ReactFlow format', () => {
    const result = applyGraphLayout(testLineageGraph)
    
    expect(result).toHaveProperty('nodes')
    expect(result).toHaveProperty('edges')
    expect(Array.isArray(result.nodes)).toBe(true)
    expect(Array.isArray(result.edges)).toBe(true)
  })

  it('preserves all node data and attributes', () => {
    const result = applyGraphLayout(testLineageGraph)
    
    testLineageGraph.getGraph().forEachNode((nodeKey, attributes) => {
      const outputNode = result.nodes.find(n => n.id === nodeKey)
      expect(outputNode).toBeDefined()
      expect(outputNode!.data.label).toBe(attributes.label)
    })
  })
}) 