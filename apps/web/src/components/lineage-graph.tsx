"use client"

import React, { useMemo, useEffect, useState } from 'react'
import ReactFlow, { Handle, Position, Background, ReactFlowProvider, useReactFlow } from 'reactflow'
import type { Node, Edge } from 'reactflow'
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
    <div className="px-3 py-2 shadow-sm rounded-sm bg-white border border-gray-200 min-w-[150px] max-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 opacity-0" />
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
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 opacity-0" />
    </div>
  )
}

// Define nodeTypes outside component to prevent recreation on every render
const nodeTypes = {
  custom: CustomNode,
}

interface LineageGraphProps {
  nodes: Node[]
  edges: Edge[]
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep'
}

// Inner component that uses the ReactFlow context
function LineageGraphInner({ nodes, edges, edgeType = 'smoothstep' }: LineageGraphProps) {
  const { fitView } = useReactFlow()
  const [sidePanelVisible, setSidePanelVisible] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSidePanelVisible(true)
    setSelectedNode(node)
  }

  const handleCloseSidePanel = () => {
    setSidePanelVisible(false)
  }

  // Memoize nodes conversion to prevent unnecessary re-renders
  const customNodes = useMemo(() => nodes.map(node => ({
    ...node,
    type: 'custom'
  })), [nodes])

  // Memoize edges conversion to prevent unnecessary re-renders
  const customEdges = useMemo(() => edges.map(edge => ({
    ...edge,
    type: edgeType, // Use dynamic edge type
    animated: false, // Remove animation
    style: { stroke: '#6b7280', strokeWidth: 2 }, // Plain line style
    markerEnd: {
      type: 'arrowclosed' as any,
      width: 12,
      height: 12,
      color: '#6b7280',
    },
  })), [edges, edgeType]) // Add edgeType as dependency

  // Automatically fit view when nodes, edges, or edge type change
  useEffect(() => {
    // Small delay to ensure nodes are rendered before fitting view
    const timer = setTimeout(() => {
      fitView({ 
        padding: 0.2,      // 20% padding around the graph
        duration: 500,     // Smooth animation duration
        minZoom: 0.1,      // Allow zooming out to see large graphs
        maxZoom: 1.5       // Prevent over-zooming for readability
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [customNodes, customEdges, edgeType, fitView])

  console.log('LineageGraph nodes:', customNodes)
  console.log('LineageGraph edges:', customEdges)

  if (!customNodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500">No nodes to display</div>
      </div>
    )
  }

  return (
    <>
      <ReactFlow
        nodes={customNodes}
        edges={customEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={"dots" as any}
          gap={20} 
          size={1.5} 
          color="#9ca3af"
        />
      </ReactFlow>
      
      {sidePanelVisible && (
        <div 
          data-testid="side-panel"
          className="fixed top-0 right-0 w-80 h-full bg-white border-l border-gray-300 shadow-lg z-50 transition-transform duration-300 ease-in-out"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Node Properties</h3>
              <button
                data-testid="close-side-panel"
                onClick={handleCloseSidePanel}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close side panel"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>
            {selectedNode && (
              <div>
                <p className="font-medium text-gray-800">{selectedNode.data.label}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function LineageGraph({ nodes, edges, edgeType = 'smoothstep' }: LineageGraphProps) {
  return (
    <div className="w-full" style={{ height: '100vh', minHeight: '600px' }}>
      <ReactFlowProvider>
        <LineageGraphInner nodes={nodes} edges={edges} edgeType={edgeType} />
      </ReactFlowProvider>
    </div>
  )
} 