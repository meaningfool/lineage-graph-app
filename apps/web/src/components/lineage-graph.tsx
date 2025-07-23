"use client"

import ReactFlow, { Node, Edge, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'

interface NodeData {
  label: string
  properties?: {
    description?: string
    [key: string]: any
  }
}

// Custom node component that can display label and properties
function CustomNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex flex-col">
        <div className="text-lg font-bold">{data.label}</div>
        {data.properties?.description && (
          <div className="text-sm text-gray-600 mt-1">{data.properties.description}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

interface LineageGraphProps {
  nodes: Node[]
  edges: Edge[]
}

export function LineageGraph({ nodes, edges }: LineageGraphProps) {
  // Convert nodes to use custom type
  const customNodes = nodes.map(node => ({
    ...node,
    type: 'custom'
  }))

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactFlow
        nodes={customNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      />
    </div>
  )
} 