"use client"
import { LineageGraph } from "@/components/lineage-graph"
import { Node, Edge } from 'reactflow'
import dagre from 'dagre'
import nodeData from '@/data/simple-node.json'

// Layout utility function using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction })

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 80 })
  })

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Get positioned nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export default function Home() {
  // Load node data from file
  const initialNodes: Node[] = nodeData.nodes.map(node => ({
    id: node.id,
    type: 'default',
    position: { x: 0, y: 0 }, // Will be overridden by layout
    data: { 
      label: node.label,
      properties: node.properties
    }
  }))
  
  const initialEdges: Edge[] = nodeData.edges.map(edge => ({
    ...edge,
    type: 'smoothstep'
  }))

  // Apply automatic layout
  const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges, 'LR')
  
  return (
    <div className="w-full h-full">
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
