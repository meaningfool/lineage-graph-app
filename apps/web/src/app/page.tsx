"use client"
import React, { useState, useMemo } from 'react'
import { LineageGraph } from "@/components/lineage-graph"
import nodeData from '@/data/target-lineage.json'
import { transformJsonToLineageGraph, generateLineageGraph } from '@/utils/lineagegraph'
import { applyGraphLayout } from '@/utils/graph-layout'

export default function Home() {
  // State to track whether to use generated data or default data
  const [useGeneratedData, setUseGeneratedData] = useState(false)

  // Transform and layout the graph based on current state
  const { nodes, edges } = useMemo(() => {
    if (useGeneratedData) {
      // Generate a sample graph with different characteristics
      const generatedGraph = generateLineageGraph({
        depth: 4,
        width: 3,
        seed: 42 // Use a fixed seed for consistent testing
      })
      return applyGraphLayout(generatedGraph)
    } else {
      // Use default data
      const lineageGraph = transformJsonToLineageGraph(nodeData)
      return applyGraphLayout(lineageGraph)
    }
  }, [useGeneratedData])

  const handleGenerateGraph = () => {
    setUseGeneratedData(true)
  }
  
  return (
    <div className="w-full h-full relative">
      {/* Generate Graph Button positioned on top of the canvas */}
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={handleGenerateGraph}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
        >
          Generate Graph
        </button>
      </div>
      
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
