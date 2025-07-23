"use client"
import { LineageGraph } from "@/components/lineage-graph"
import { Node, Edge } from 'reactflow'

export default function Home() {
  // Static data for now - will be replaced with actual node data
  const nodes: Node[] = []
  const edges: Edge[] = []
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-2">
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
