"use client"
import React from 'react'
import { LineageGraph } from "@/components/lineage-graph"
import type { Node, Edge } from 'reactflow'
import dagre from 'dagre'
import nodeData from '@/data/target-lineage.json'
import { transformJsonToLineageGraph } from '@/utils/lineagegraph'

// Layout utility function using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100, // Increase horizontal spacing between nodes
    ranksep: 150,  // Increase vertical spacing between ranks
    align: 'UL'    // Align nodes to upper-left (this helps with centering)
  })

  // Add nodes to dagre with more accurate dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 120 }) // Increase node size for better spacing
  })

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Get positioned nodes with proper centering
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    
    // Ensure we have valid coordinates
    const x = nodeWithPosition.x - nodeWithPosition.width / 2
    const y = nodeWithPosition.y - nodeWithPosition.height / 2
    
    // Add some offset to ensure nodes are visible
    const adjustedX = Math.max(50, x)
    const adjustedY = Math.max(50, y)
    
    console.log(`Node ${node.id}: x=${x}, y=${y}, adjustedX=${adjustedX}, adjustedY=${adjustedY}`)
    
    return {
      ...node,
      position: {
        x: adjustedX,
        y: adjustedY,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export default function Home() {
  // Transform JSON data to LineageGraph, then convert to ReactFlow format
  const lineageGraph = transformJsonToLineageGraph(nodeData)
  const graph = lineageGraph.getGraph()
  
  // Convert LineageGraph to ReactFlow nodes
  const initialNodes: Node[] = graph.nodes().map(nodeKey => {
    const attributes = graph.getNodeAttributes(nodeKey)
    return {
      id: nodeKey,
      type: 'default',
      position: { x: 0, y: 0 }, // Will be overridden by layout
      data: { 
        label: attributes.label,
        properties: {
          // Extract properties from attributes (excluding label)
          ...Object.fromEntries(
            Object.entries(attributes).filter(([key]) => key !== 'label')
          )
        }
      }
    }
  })
  
  // Convert LineageGraph to ReactFlow edges
  const initialEdges: Edge[] = graph.edges().map(edgeKey => {
    const [source, target] = graph.extremities(edgeKey)
    return {
      id: edgeKey,
      source,
      target,
      type: 'smoothstep'
    }
  })

  // Apply automatic layout
  const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges, 'LR')
  
  return (
    <div className="w-full h-full">
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
