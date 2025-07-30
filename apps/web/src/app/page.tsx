"use client"
import React from 'react'
import { LineageGraph } from "@/components/lineage-graph"
import nodeData from '@/data/target-lineage.json'
import { transformJsonToLineageGraph } from '@/utils/lineagegraph'
import { applyGraphLayout } from '@/utils/graph-layout'

export default function Home() {
  // Transform JSON data to LineageGraph, then apply layout
  const lineageGraph = transformJsonToLineageGraph(nodeData)
  const { nodes, edges } = applyGraphLayout(lineageGraph)
  
  return (
    <div className="w-full h-full">
      <LineageGraph nodes={nodes} edges={edges} />
    </div>
  )
}
