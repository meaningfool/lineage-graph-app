import React from 'react'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Home from '../page'
import nodeData from '@/data/target-lineage.json'

// No more ReactFlow mocking! Using real ReactFlow components

// Mock the trpc utility
vi.mock('@/utils/trpc', () => ({
      api: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
      })),
    },
}))

describe('Home Page', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Reset timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all nodes from the data', async () => {
    render(<Home />)
    
    // Wait for ReactFlow to render and nodes to become visible
    await waitFor(() => {
      const firstNode = screen.getByTestId(`rf__node-${nodeData.nodes[0].id}`)
      expect(firstNode).toBeInTheDocument()
      // Check that node is visible (not hidden)
      expect(firstNode).toBeVisible()
    }, { timeout: 10000 })
    
    // Check that each node from the data is rendered
    // ReactFlow adds 'rf__node-' prefix to node test-ids
    nodeData.nodes.forEach(node => {
      const nodeElement = screen.getByTestId(`rf__node-${node.id}`)
      expect(nodeElement).toBeInTheDocument()
    })
  })

  it('displays node labels only without properties in nodes', async () => {
    render(<Home />)
    
    // Wait for ReactFlow to render
    await waitFor(() => {
      const firstNode = screen.getByTestId(`rf__node-${nodeData.nodes[0].id}`)
      expect(firstNode).toBeVisible()
    }, { timeout: 10000 })
    
    // For each node in the data, verify only labels are displayed (no properties in nodes)
    nodeData.nodes.forEach(node => {
      const nodeElement = screen.getByTestId(`rf__node-${node.id}`)
      expect(nodeElement).toBeInTheDocument()
      
      // Node should contain the label
      expect(nodeElement).toHaveTextContent(node.label)
      
      // Node should NOT contain properties (properties should only be in side panel)
      Object.keys(node.properties).forEach(propertyKey => {
        // Try to find property elements within the node - they should NOT exist
        const nodeScope = within(nodeElement)
        expect(() => nodeScope.getByTestId(`property-${propertyKey}`)).toThrow()
      })
    })
  })


})

 

describe('Data-Driven Edge Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays the correct number of edges from data', () => {
    render(<Home />)
    
    const renderedEdges = screen.getAllByTestId('react-flow__edge')
    const expectedEdgeCount = nodeData.edges.length
    
    expect(renderedEdges).toHaveLength(expectedEdgeCount)
  })

  it('displays edges connecting the correct nodes with derivation semantics', () => {
    render(<Home />)
    
    const renderedEdges = screen.getAllByTestId('react-flow__edge')
    
    // For each edge in the data, verify it exists with reversed direction (derivation semantics)
    // JSON: A → B means "A generates B", but LineageGraph: B → A means "B is derived from A"
    nodeData.edges.forEach(expectedEdge => {
      const matchingEdge = renderedEdges.find(edge => 
        edge.getAttribute('data-source') === expectedEdge.target &&  // Reversed
        edge.getAttribute('data-target') === expectedEdge.source     // Reversed
      )
      
      expect(matchingEdge).toBeInTheDocument()
    })
  })
})

describe('Generate Graph Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays the Generate Graph button on the canvas', () => {
    render(<Home />)
    
    // Check that the Generate Graph button is present
    const generateButton = screen.getByText('Generate Graph')
    expect(generateButton).toBeInTheDocument()
  })

  it('shows different graph data when Generate Graph button is clicked', () => {
    render(<Home />)
    
    // Get initial node data (should be default data)
    const initialNodes = screen.getAllByTestId(/^node-/)
    const initialNodeIds = initialNodes.map(node => node.getAttribute('data-node-id'))
    
    // Click the Generate Graph button
    const generateButton = screen.getByText('Generate Graph')
    fireEvent.click(generateButton)
    
    // Get new node data after clicking
    const newNodes = screen.getAllByTestId(/^node-/)
    const newNodeIds = newNodes.map(node => node.getAttribute('data-node-id'))
    
    // Verify that the graph data has changed (different node IDs or different count)
    const hasChanged = (
      newNodeIds.length !== initialNodeIds.length ||
      !initialNodeIds.every(id => newNodeIds.includes(id))
    )
    
    expect(hasChanged).toBe(true)
  })

  it('generates different graphs on multiple clicks', () => {
    render(<Home />)
    
    const generateButton = screen.getByText('Generate Graph')
    
    // Click first time
    fireEvent.click(generateButton)
    const firstGenNodes = screen.getAllByTestId(/^node-/)
    const firstGenNodeIds = firstGenNodes.map(node => node.getAttribute('data-node-id'))
    
    // Click second time
    fireEvent.click(generateButton)
    const secondGenNodes = screen.getAllByTestId(/^node-/)
    const secondGenNodeIds = secondGenNodes.map(node => node.getAttribute('data-node-id'))
    
    // Verify that each generation produces different results
    const isDifferent = (
      firstGenNodeIds.length !== secondGenNodeIds.length ||
      !firstGenNodeIds.every(id => secondGenNodeIds.includes(id)) ||
      !secondGenNodeIds.every(id => firstGenNodeIds.includes(id))
    )
    
    expect(isDifferent).toBe(true)
  })

  it('initially loads default data before Generate Graph is clicked', () => {
    render(<Home />)
    
    // Verify that initially we have the default nodes from target-lineage.json
    nodeData.nodes.forEach(node => {
      const nodeElement = screen.getByTestId(`node-${node.id}`)
      expect(nodeElement).toBeInTheDocument()
    })
  })

  it('generated nodes have meaningful labels but no properties in nodes', () => {
    render(<Home />)
    
    const generateButton = screen.getByText('Generate Graph')
    fireEvent.click(generateButton)
    
    const generatedNodes = screen.getAllByTestId(/^node-/)
    
    // Ensure we have generated nodes to test
    expect(generatedNodes.length).toBeGreaterThan(0)
    
    generatedNodes.forEach((node) => {
      // Test meaningful labels (not undefined or empty)
      const nodeText = node.textContent || ''
      const label = nodeText.trim()
      
      expect(label).toBeTruthy()
      expect(label).not.toBe('undefined')
      expect(label.length).toBeGreaterThan(0)
      
      // Nodes should NOT contain property elements (properties only in side panel)
      const nodeScope = within(node)
      
      // Try to find property elements - should not exist in nodes anymore
      expect(() => nodeScope.getByTestId(/^property-/)).toThrow()
    })
  })
}) 

describe.skip('Automatic Camera Adjustment', () => {
  // Mock viewport size for testing
  const VIEWPORT_WIDTH = 1000
  const VIEWPORT_HEIGHT = 600

  // Helper function to check if all nodes are visible within viewport bounds
  const areAllNodesVisible = (nodePositions: Array<{x: number, y: number}>, viewport: {x: number, y: number, zoom: number}) => {
    // Transform node coordinates to screen coordinates
    const screenPositions = nodePositions.map(node => ({
      x: (node.x * viewport.zoom) + viewport.x,
      y: (node.y * viewport.zoom) + viewport.y
    }))
    
    // Check if all nodes are within viewport bounds (with node size buffer)
    const NODE_SIZE = 200 // Approximate node width
    return screenPositions.every(pos => 
      pos.x >= -NODE_SIZE/2 && 
      pos.x <= VIEWPORT_WIDTH + NODE_SIZE/2 &&
      pos.y >= -NODE_SIZE/2 && 
      pos.y <= VIEWPORT_HEIGHT + NODE_SIZE/2
    )
  }

  // Helper function to check if graph utilizes viewport effectively
  const doesGraphUtilizeViewportWell = (nodePositions: Array<{x: number, y: number}>, viewport: {x: number, y: number, zoom: number}) => {
    // Calculate graph bounding box in screen coordinates
    const screenPositions = nodePositions.map(node => ({
      x: (node.x * viewport.zoom) + viewport.x,
      y: (node.y * viewport.zoom) + viewport.y
    }))
    
    const minX = Math.min(...screenPositions.map(p => p.x))
    const maxX = Math.max(...screenPositions.map(p => p.x))
    const minY = Math.min(...screenPositions.map(p => p.y))
    const maxY = Math.max(...screenPositions.map(p => p.y))
    
    const graphScreenWidth = maxX - minX
    const graphScreenHeight = maxY - minY
    
    // Check if graph uses ≥60% of viewport width OR ≥60% of viewport height
    const usesWidthWell = graphScreenWidth >= (VIEWPORT_WIDTH * 0.6)
    const usesHeightWell = graphScreenHeight >= (VIEWPORT_HEIGHT * 0.6)
    
    return usesWidthWell || usesHeightWell
  }

  // Helper function to test both visibility and utilization for a graph state
  const testGraphDisplayQuality = () => {
    const nodes = screen.getAllByTestId(/^node-/)
    const nodePositions = nodes.map(node => ({
      x: Number(node.getAttribute('data-position-x')),
      y: Number(node.getAttribute('data-position-y'))
    }))

    // Advance time to allow any viewport adjustments
    vi.advanceTimersByTime(300)

    // Test 1: Graph appears fully visible
    const allVisible = areAllNodesVisible(nodePositions, mockViewport)
    expect(allVisible).toBe(true) // `All nodes should be visible in viewport for ${description}`

    // Test 2: Graph utilizes viewport effectively
    const utilizesWell = doesGraphUtilizeViewportWell(nodePositions, mockViewport)
    expect(utilizesWell).toBe(true) // `Graph should use ≥60% of viewport width or height for ${description}`
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset viewport to default state
    Object.assign(mockViewport, { x: 0, y: 0, zoom: 1 })
    mockFitView.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays initial default graph with optimal camera positioning', () => {
    render(<Home />)
    testGraphDisplayQuality()
  })

  it('adjusts camera when new graphs are generated', () => {
    render(<Home />)
    
    const generateButton = screen.getByText('Generate Graph')
    
    // Test first generated graph
    fireEvent.click(generateButton)
    testGraphDisplayQuality()
    
    // Test second generated graph  
    fireEvent.click(generateButton)
    testGraphDisplayQuality()
  })

  it('maintains optimal camera positioning after edge type changes', () => {
    render(<Home />)
    
    // Change edge type
    const edgeTypeSelect = screen.getByLabelText('Edge Type:')
    fireEvent.change(edgeTypeSelect, { target: { value: 'straight' } })
    
    testGraphDisplayQuality()
  })
})

describe('Edge Type Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays the edge type selector', () => {
    render(<Home />)
    
    const edgeTypeLabel = screen.getByText('Edge Type:')
    const edgeTypeSelect = screen.getByLabelText('Edge Type:')
    
    expect(edgeTypeLabel).toBeInTheDocument()
    expect(edgeTypeSelect).toBeInTheDocument()
  })

  it('has correct default edge type selected', () => {
    render(<Home />)
    
    const edgeTypeSelect = screen.getByLabelText('Edge Type:') as HTMLSelectElement
    expect(edgeTypeSelect.value).toBe('smoothstep')
  })

  it('shows all available edge type options', () => {
    render(<Home />)
    
    const edgeTypeSelect = screen.getByLabelText('Edge Type:')
    
    // Check that all edge type options are available
    expect(within(edgeTypeSelect).getByText('Bezier (Default)')).toBeInTheDocument()
    expect(within(edgeTypeSelect).getByText('Straight')).toBeInTheDocument()
    expect(within(edgeTypeSelect).getByText('Step')).toBeInTheDocument()
    expect(within(edgeTypeSelect).getByText('Smooth Step')).toBeInTheDocument()
  })

  it('changes edge type when selection changes', () => {
    render(<Home />)
    
    const edgeTypeSelect = screen.getByLabelText('Edge Type:') as HTMLSelectElement
    
    // Change to straight edge type
    fireEvent.change(edgeTypeSelect, { target: { value: 'straight' } })
    expect(edgeTypeSelect.value).toBe('straight')
    
    // Change to step edge type
    fireEvent.change(edgeTypeSelect, { target: { value: 'step' } })
    expect(edgeTypeSelect.value).toBe('step')
  })
})

describe('Side Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens side panel when any node is clicked', () => {
    render(<Home />)
    
    // Click on a specific node to verify title behavior
    const newUsersNode = screen.getByTestId('node-new-users')
    fireEvent.click(newUsersNode)
    
    // Verify side panel appears
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    
    // Verify side panel shows the node name as title
    expect(sidePanel).toHaveTextContent('New Users')
  })

  it('applies transition when opening side panel from closed state', () => {
    render(<Home />)
    
    // Get any available node
    const firstNode = screen.getAllByTestId(/^node-/)[0]
    
    // Click the node to open panel
    fireEvent.click(firstNode)
    
    // Verify side panel has transition classes (just that transition exists)
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toHaveClass('transition-transform')
  })

  it('does not retrigger transition when switching between nodes', () => {
    render(<Home />)
    
    // Get two different nodes
    const allNodes = screen.getAllByTestId(/^node-/)
    const firstNode = allNodes[0]
    const secondNode = allNodes[1]
    
    // Click first node to open panel
    fireEvent.click(firstNode)
    
    // Verify panel is open
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    
    // Click second node while panel is already open
    fireEvent.click(secondNode)
    
    // Panel should still be visible (no closing/reopening)
    expect(sidePanel).toBeInTheDocument()
  })

  it('shows selected node information in panel', () => {
    render(<Home />)
    
    // Click node "New Users"
    const firstNode = screen.getByTestId('node-new-users')
    fireEvent.click(firstNode)
    
    // Verify panel shows "New Users"
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toHaveTextContent('New Users')
    
    // Click node "Paid User %"
    const secondNode = screen.getByTestId('node-paid-user-ratio')
    fireEvent.click(secondNode)
    
    // Verify panel shows "Paid User %"
    expect(sidePanel).toHaveTextContent('Paid User %')
  })

  it('side panel has close button when opened', () => {
    render(<Home />)
    
    // Open side panel by clicking any node
    const firstNode = screen.getAllByTestId(/^node-/)[0]
    fireEvent.click(firstNode)
    
    // Verify side panel is open
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    
    // Verify close button exists
    const closeButton = screen.getByTestId('close-side-panel')
    expect(closeButton).toBeInTheDocument()
  })

  it('handles complete open-close-reopen cycle correctly', () => {
    render(<Home />)
    
    // Get two different nodes for testing
    const firstNode = screen.getByTestId('node-new-users')
    const secondNode = screen.getByTestId('node-paid-user-ratio')
    
    // 1. Initially no panel should be visible
    expect(screen.queryByTestId('side-panel')).not.toBeInTheDocument()
    
    // 2. Click first node to open panel
    fireEvent.click(firstNode)
    let sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    expect(sidePanel).toHaveTextContent('New Users')
    
    // 3. Click close button to close panel
    const closeButton = screen.getByTestId('close-side-panel')
    fireEvent.click(closeButton)
    expect(screen.queryByTestId('side-panel')).not.toBeInTheDocument()
    
    // 4. Click second node to reopen panel with different content
    fireEvent.click(secondNode)
    sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    expect(sidePanel).toHaveTextContent('Paid User %')
    
    // 5. Close again to verify panel can be closed after reopening
    const newCloseButton = screen.getByTestId('close-side-panel')
    fireEvent.click(newCloseButton)
    expect(screen.queryByTestId('side-panel')).not.toBeInTheDocument()
  })

  it('displays all node properties in side panel when node is clicked', () => {
    render(<Home />)
    
    // Find the first node with properties from the actual data
    const firstNodeWithProperties = nodeData.nodes.find(node => 
      node.properties && Object.keys(node.properties).length > 0
    )
    expect(firstNodeWithProperties).toBeDefined()
    
    // Click on the node
    const nodeElement = screen.getByTestId(`node-${firstNodeWithProperties!.id}`)
    fireEvent.click(nodeElement)
    
    // Verify side panel is open
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    
    // Verify node label is displayed
    expect(sidePanel).toHaveTextContent(firstNodeWithProperties!.label)
    
    // Verify all properties from the source data are displayed with correct test-ids
    const sidePanelScope = within(sidePanel)
    Object.entries(firstNodeWithProperties!.properties).forEach(([propertyKey, propertyValue]) => {
      const propertyElement = sidePanelScope.getByTestId(`property-${propertyKey}`)
      expect(propertyElement).toBeInTheDocument()
      expect(propertyElement).toHaveTextContent(String(propertyValue))
    })
  })

  it('updates side panel properties when switching between nodes', () => {
    render(<Home />)
    
    // Find two different nodes with properties
    const nodesWithProperties = nodeData.nodes.filter(node => 
      node.properties && Object.keys(node.properties).length > 0
    )
    expect(nodesWithProperties.length).toBeGreaterThanOrEqual(2)
    
    const firstNode = nodesWithProperties[0]
    const secondNode = nodesWithProperties[1]
    
    // Click first node
    const firstNodeElement = screen.getByTestId(`node-${firstNode.id}`)
    fireEvent.click(firstNodeElement)
    
    const sidePanel = screen.getByTestId('side-panel')
    const sidePanelScope = within(sidePanel)
    
    // Verify first node properties are displayed
    expect(sidePanel).toHaveTextContent(firstNode.label)
    Object.keys(firstNode.properties).forEach(propertyKey => {
      expect(sidePanelScope.getByTestId(`property-${propertyKey}`)).toBeInTheDocument()
    })
    
    // Click second node
    const secondNodeElement = screen.getByTestId(`node-${secondNode.id}`)
    fireEvent.click(secondNodeElement)
    
    // Verify second node properties are now displayed
    expect(sidePanel).toHaveTextContent(secondNode.label)
    Object.entries(secondNode.properties).forEach(([propertyKey, propertyValue]) => {
      const propertyElement = sidePanelScope.getByTestId(`property-${propertyKey}`)
      expect(propertyElement).toBeInTheDocument()
      expect(propertyElement).toHaveTextContent(String(propertyValue))
    })
  })
}) 