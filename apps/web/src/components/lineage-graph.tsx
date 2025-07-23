"use client"

import ReactFlow, { Node, Edge, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'

interface NodeData {
  label: string
  properties?: {
    [key: string]: any
  }
}

// Custom node component that displays label and all properties
function CustomNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-gray-300 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex flex-col gap-2">
        <div className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
          {data.label}
        </div>
        {data.properties && (
          <div className="space-y-1">
            {Object.entries(data.properties).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="ml-1 text-gray-600">{value}</span>
              </div>
            ))}
          </div>
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