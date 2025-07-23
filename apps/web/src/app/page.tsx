"use client"
import { LineageGraph } from "@/components/lineage-graph"
import { Node, Edge } from 'reactflow'

export default function Home() {
  // Single node with title "Revenue Growth"
  const nodes: Node[] = [
    {
      id: '1',
      type: 'default',
      position: { x: 250, y: 100 },
      data: { label: 'Revenue Growth' }
    }
  ]
  const edges: Edge[] = []
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-2">
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
