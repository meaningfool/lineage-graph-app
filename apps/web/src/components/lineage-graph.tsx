"use client"

import ReactFlow, { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'

interface LineageGraphProps {
  nodes: Node[]
  edges: Edge[]
}

export function LineageGraph({ nodes, edges }: LineageGraphProps) {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
    </div>
  )
} 