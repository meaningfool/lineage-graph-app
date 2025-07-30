"use client"
import React, { useState, useMemo } from 'react'
import { LineageGraph } from "@/components/lineage-graph"
import nodeData from '@/data/target-lineage.json'
import { transformJsonToLineageGraph, generateLineageGraph } from '@/utils/lineagegraph'
import { applyGraphLayout } from '@/utils/graph-layout'

// Available edge types in ReactFlow
const EDGE_TYPES = [
  { value: 'default', label: 'Bezier (Default)' },
  { value: 'straight', label: 'Straight' },
  { value: 'step', label: 'Step' },
  { value: 'smoothstep', label: 'Smooth Step' },
] as const

type EdgeType = typeof EDGE_TYPES[number]['value']

export default function Home() {
  // Counter to track number of generations - triggers new graph each time
  const [generationCount, setGenerationCount] = useState(0)
  
  // Edge type selection state
  const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType>('smoothstep')

  // Transform and layout the graph based on current state
  const { nodes, edges } = useMemo(() => {
    if (generationCount > 0) {
      // Generate random parameters for each generation
      const depth = 4 + Math.floor(Math.random() * 5)  // 4-8 layers
      const width = 3 + Math.floor(Math.random() * 8)  // 3-10 nodes
      const seed = Date.now() + generationCount        // Always different seed
      
      // Generate a random graph with varying characteristics
      const generatedGraph = generateLineageGraph({
        depth,
        width,
        seed
      })
      return applyGraphLayout(generatedGraph)
    } else {
      // Use default data when no generations have been triggered
      const lineageGraph = transformJsonToLineageGraph(nodeData)
      return applyGraphLayout(lineageGraph)
    }
  }, [generationCount])

  const handleGenerateGraph = () => {
    // Increment counter - this will always trigger a new generation
    setGenerationCount(prev => prev + 1)
  }

  const handleEdgeTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEdgeType(event.target.value as EdgeType)
  }
  
  return (
    <div className="w-full h-full relative">
      {/* Controls positioned on top of the canvas */}
      <div className="absolute top-4 left-4 z-10 flex gap-3 items-center">
        <button 
          onClick={handleGenerateGraph}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
        >
          Generate Graph
        </button>
        
        <div className="flex items-center gap-2">
          <label htmlFor="edge-type-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Edge Type:
          </label>
          <select
            id="edge-type-select"
            value={selectedEdgeType}
            onChange={handleEdgeTypeChange}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {EDGE_TYPES.map((edgeType) => (
              <option key={edgeType.value} value={edgeType.value}>
                {edgeType.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <LineageGraph nodes={nodes} edges={edges} edgeType={selectedEdgeType} />
    </div>
  )
}
