"use client"

import ReactFlow, { Node, Edge, Handle, Position, Background } from 'reactflow'
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
    <div className="px-2 py-1.5 shadow-sm rounded-sm bg-white border border-gray-200 min-w-[120px] max-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-1.5 h-1.5" />
      <div className="flex flex-col gap-0.5">
        <div className="text-xs font-medium text-gray-900 border-b border-gray-100 pb-0.5">
          {data.label}
        </div>
        {data.properties && (
          <div className="space-y-0.5">
            {Object.entries(data.properties).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-medium text-gray-600 capitalize text-xs">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="ml-1 text-gray-500 text-xs">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-1.5 h-1.5" />
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
    <div className="w-full h-full">
      <ReactFlow
        nodes={customNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant="dots" 
          gap={20} 
          size={1.5} 
          color="#9ca3af"
        />
      </ReactFlow>
    </div>
  )
} 