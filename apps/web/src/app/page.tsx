"use client"
import { LineageGraph } from "@/components/lineage-graph"
import { Node, Edge } from 'reactflow'
import nodeData from '@/data/simple-node.json'

export default function Home() {
  // Load node data from file
  const nodes: Node[] = nodeData.nodes.map(node => ({
    id: node.id,
    type: 'default',
    position: node.position,
    data: { 
      label: node.label,
      properties: node.properties
    }
  }))
  
  const edges: Edge[] = nodeData.edges
  
  return (
    <div className="w-full h-full">
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
