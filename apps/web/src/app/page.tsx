"use client"
import React, { useState, useMemo } from 'react'
import { LineageGraph } from "@/components/lineage-graph"
import nodeData from '@/data/target-lineage.json'
import { transformJsonToLineageGraph, generateLineageGraph } from '@/utils/lineagegraph'
import { applyGraphLayout } from '@/utils/graph-layout'

export default function Home() {
  // Counter to track number of generations - triggers new graph each time
  const [generationCount, setGenerationCount] = useState(0)

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
