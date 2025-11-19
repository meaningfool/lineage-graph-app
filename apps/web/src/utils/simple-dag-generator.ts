export interface DAGNode {
  id: string;
  label: string;
  type: "source" | "computed" | "metric";
  properties: {
    description: string;
    dataType: string;
    lastUpdated: string;
    [key: string]: any;
  };
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  properties?: {
    [key: string]: any;
  };
}

export interface DAGData {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

// Simple DAG generation without d3-dag
export function generateSimpleDAG(
  depth: number = 4,
  width: number = 3,
  edgeProbability: number = 0.3
): DAGData {
  const nodes: DAGNode[] = [];
  const edges: DAGEdge[] = [];
  const nodeIds: string[][] = [];

  // Generate nodes for each level
  for (let level = 0; level < depth; level++) {
    const levelNodes: string[] = [];
    
    for (let i = 0; i < width; i++) {
      const nodeId = `node-${level}-${i}`;
      const nodeType = level === 0 ? "source" : 
                      level === depth - 1 ? "metric" : "computed";
      
      nodes.push({
        id: nodeId,
        label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${level}-${i}`,
        type: nodeType as "source" | "computed" | "metric",
        properties: {
          description: `Auto-generated ${nodeType} node at depth ${level}`,
          dataType: ["Integer", "Float", "String", "Currency"][Math.floor(Math.random() * 4)],
          lastUpdated: new Date().toISOString().split('T')[0],
          ...(nodeType === "source" && { source: `Database ${Math.floor(Math.random() * 10) + 1}` }),
          ...(nodeType === "computed" && { formula: `Formula ${Math.floor(Math.random() * 100) + 1}` }),
          ...(nodeType === "metric" && { businessUnit: ["Sales", "Marketing", "Finance"][Math.floor(Math.random() * 3)] })
        }
      });
      
      levelNodes.push(nodeId);
    }
    nodeIds.push(levelNodes);
  }

  // Generate edges with cross-layer connections
  for (let sourceLevel = 0; sourceLevel < depth - 1; sourceLevel++) {
    const sourceLevelNodes = nodeIds[sourceLevel];
    
    // For each node in the source level, create connections to future levels
    for (const sourceId of sourceLevelNodes) {
      const sourceNode = nodes.find(n => n.id === sourceId);
      if (!sourceNode) continue;
      
      // Determine which levels this node can connect to
      const maxTargetLevel = depth - 1; // Can connect up to the last level (metrics)
      const minTargetLevel = sourceLevel + 1; // Must connect to a future level
      
      // Create connections to different target levels
      for (let targetLevel = minTargetLevel; targetLevel <= maxTargetLevel; targetLevel++) {
        const targetLevelNodes = nodeIds[targetLevel];
        
        // Probability decreases as we skip more layers
        const skipLayers = targetLevel - sourceLevel;
        const connectionProbability = edgeProbability / Math.pow(2, skipLayers - 1);
        
        // Try to connect to each target in this level
        for (const targetId of targetLevelNodes) {
          if (Math.random() < connectionProbability) {
            const edgeExists = edges.some(edge => 
              edge.source === sourceId && edge.target === targetId
            );
            
            if (!edgeExists) {
              edges.push({
                id: `edge-${sourceId}-${targetId}-cross-${sourceLevel}-${targetLevel}`,
                source: sourceId,
                target: targetId,
                properties: {
                  type: "data-flow",
                  frequency: ["real-time", "batch", "scheduled"][Math.floor(Math.random() * 3)],
                  skipLayers: skipLayers
                }
              });
            }
          }
        }
      }
    }
  }
  
  // Ensure every node has at least one path to a metric
  const metricNodes = nodes.filter(node => node.type === 'metric');
  const nonMetricNodes = nodes.filter(node => node.type !== 'metric');
  
  for (const node of nonMetricNodes) {
    const hasPathToMetric = edges.some(edge => 
      edge.source === node.id && metricNodes.some(metric => metric.id === edge.target)
    ) || edges.some(edge => 
      edge.source === node.id && hasIndirectPathToMetric(edge.target, metricNodes.map(m => m.id), edges)
    );
    
    if (!hasPathToMetric) {
      // Find a metric node to connect to
      const availableMetrics = metricNodes.filter(metric => 
        !edges.some(edge => edge.source === node.id && edge.target === metric.id)
      );
      
      if (availableMetrics.length > 0) {
        const targetMetric = availableMetrics[Math.floor(Math.random() * availableMetrics.length)];
        edges.push({
          id: `edge-${node.id}-${targetMetric.id}-ensure-metric-path`,
          source: node.id,
          target: targetMetric.id,
          properties: {
            type: "data-flow",
            frequency: ["real-time", "batch", "scheduled"][Math.floor(Math.random() * 3)],
            skipLayers: "direct-to-metric"
          }
        });
      }
    }
  }
  
  // Ensure every metric node has at least one source node upstream
  const sourceNodes = nodes.filter(node => node.type === 'source');
  
  for (const metricNode of metricNodes) {
    const hasSourceUpstream = edges.some(edge => 
      edge.target === metricNode.id && sourceNodes.some(source => source.id === edge.source)
    ) || edges.some(edge => 
      edge.target === metricNode.id && hasIndirectPathFromSource(edge.source, sourceNodes.map(s => s.id), edges)
    );
    
    if (!hasSourceUpstream) {
      // Find a source node to connect from
      const availableSources = sourceNodes.filter(source => 
        !edges.some(edge => edge.source === source.id && edge.target === metricNode.id)
      );
      
      if (availableSources.length > 0) {
        const sourceNode = availableSources[Math.floor(Math.random() * availableSources.length)];
        edges.push({
          id: `edge-${sourceNode.id}-${metricNode.id}-ensure-source-path`,
          source: sourceNode.id,
          target: metricNode.id,
          properties: {
            type: "data-flow",
            frequency: ["real-time", "batch", "scheduled"][Math.floor(Math.random() * 3)],
            skipLayers: "direct-from-source"
          }
        });
      }
    }
  }
  
  // Helper function to check if a node has an indirect path to metrics
  function hasIndirectPathToMetric(nodeId: string, metricIds: string[], allEdges: DAGEdge[]): boolean {
    const visited = new Set<string>();
    
    function dfs(currentNodeId: string): boolean {
      if (visited.has(currentNodeId)) return false;
      visited.add(currentNodeId);
      
      if (metricIds.includes(currentNodeId)) return true;
      
      const outgoingEdges = allEdges.filter(edge => edge.source === currentNodeId);
      return outgoingEdges.some(edge => dfs(edge.target));
    }
    
    return dfs(nodeId);
  }
  
  // Helper function to check if a node has an indirect path from sources
  function hasIndirectPathFromSource(nodeId: string, sourceIds: string[], allEdges: DAGEdge[]): boolean {
    const visited = new Set<string>();
    
    function dfs(currentNodeId: string): boolean {
      if (visited.has(currentNodeId)) return false;
      visited.add(currentNodeId);
      
      if (sourceIds.includes(currentNodeId)) return true;
      
      const incomingEdges = allEdges.filter(edge => edge.target === currentNodeId);
      return incomingEdges.some(edge => dfs(edge.source));
    }
    
    return dfs(nodeId);
  }

  return { nodes, edges };
}
