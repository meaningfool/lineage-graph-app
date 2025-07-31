import React from 'react'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Home from '../page'
import nodeData from '@/data/target-lineage.json'

// Mock viewport state for testing
const mockViewport = { x: 0, y: 0, zoom: 1 }
const mockSetViewport = vi.fn((newViewport) => {
  Object.assign(mockViewport, newViewport)
})
const mockGetViewport = vi.fn(() => mockViewport)
const mockFitView = vi.fn((options) => {
  // Simulate realistic fitView behavior by calculating optimal viewport
  // Get current nodes from the DOM to determine graph bounds
  const nodeElements = Array.from(document.querySelectorAll('[data-testid^="node-"]'))
  if (nodeElements.length === 0) return
  
  const nodePositions = nodeElements.map(el => ({
    x: Number(el.getAttribute('data-position-x')) || 0,
    y: Number(el.getAttribute('data-position-y')) || 0
  }))
  
  const minX = Math.min(...nodePositions.map(n => n.x))
  const maxX = Math.max(...nodePositions.map(n => n.x))
  const minY = Math.min(...nodePositions.map(n => n.y))
  const maxY = Math.max(...nodePositions.map(n => n.y))
  
  const graphWidth = maxX - minX + 200 // Add node buffer
  const graphHeight = maxY - minY + 120 // Add node buffer
  
  const viewportWidth = 1000
  const viewportHeight = 600
  
  // Calculate zoom to fit with padding
  const padding = options?.padding || 0.2
  const zoomToFitWidth = (viewportWidth * (1 - padding)) / graphWidth
  const zoomToFitHeight = (viewportHeight * (1 - padding)) / graphHeight
  const optimalZoom = Math.min(zoomToFitWidth, zoomToFitHeight, options?.maxZoom || 1.5)
  const finalZoom = Math.max(optimalZoom, options?.minZoom || 0.1)
  
  // Calculate center position
  const graphCenterX = (minX + maxX) / 2
  const graphCenterY = (minY + maxY) / 2
  const viewportCenterX = viewportWidth / 2
  const viewportCenterY = viewportHeight / 2
  
  // Update viewport to center the graph
  Object.assign(mockViewport, {
    x: viewportCenterX - (graphCenterX * finalZoom),
    y: viewportCenterY - (graphCenterY * finalZoom),
    zoom: finalZoom
  })
})

// Mock ReactFlow to avoid canvas rendering issues in tests
vi.mock('reactflow', () => ({
  __esModule: true,
  default: ({ nodes, edges }: any) => (
    <div data-testid="react-flow">
      {nodes.map((node: any) => (
        <div 
          key={node.id} 
          data-testid={`node-${node.id}`}
          data-position-x={node.position.x}
          data-position-y={node.position.y}
          data-node-id={node.id}
        >
          {node.data.label}
          {/* Render properties for testing */}
          {node.data.properties && (
            <div data-testid={`node-properties-${node.id}`}>
              {Object.entries(node.data.properties).map(([key, value]) => (
                <div key={key} data-testid={`property-${key}`}>
                  {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {edges.map((edge: any) => (
        <div 
          key={edge.id} 
          data-testid="react-flow__edge"
          data-source={edge.source}
          data-target={edge.target}
          data-edge-id={edge.id}
        >
          Edge from {edge.source} to {edge.target}
        </div>
      ))}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
  Handle: ({ type, position }: any) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right'
  },
  Background: ({ children }: any) => <div data-testid="background">{children}</div>,
  useReactFlow: () => ({
    getViewport: mockGetViewport,
    setViewport: mockSetViewport,
    fitView: mockFitView,
    project: vi.fn(),
    screenToFlowPosition: vi.fn(),
    flowToScreenPosition: vi.fn(),
  })
}))

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

  it('renders all nodes from the data', () => {
    render(<Home />)
    
    // Check that each node from the data is rendered
    nodeData.nodes.forEach(node => {
      const nodeElement = screen.getByTestId(`node-${node.id}`)
      expect(nodeElement).toBeInTheDocument()
    })
  })

  it('displays node properties correctly for each node', () => {
    render(<Home />)
    
    // For each node in the data, verify its properties are displayed
    nodeData.nodes.forEach(node => {
      const nodeElement = screen.getByTestId(`node-${node.id}`)
      expect(nodeElement).toBeInTheDocument()
      
      // Check that properties container exists
      const propertiesContainer = screen.getByTestId(`node-properties-${node.id}`)
      expect(propertiesContainer).toBeInTheDocument()
      
      // Check that each property is displayed within this specific node's properties container
      Object.keys(node.properties).forEach(propertyKey => {
        const propertiesContainer = screen.getByTestId(`node-properties-${node.id}`)
        const propertyElement = within(propertiesContainer).getByTestId(`property-${propertyKey}`)
        expect(propertyElement).toBeInTheDocument()
        expect(propertyElement).toHaveTextContent(String(node.properties[propertyKey as keyof typeof node.properties]))
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

  it('generated nodes have meaningful labels and properties', () => {
    render(<Home />)
    
    const generateButton = screen.getByText('Generate Graph')
    fireEvent.click(generateButton)
    
    const generatedNodes = screen.getAllByTestId(/^node-/)
    
    // Ensure we have generated nodes to test
    expect(generatedNodes.length).toBeGreaterThan(0)
    
    generatedNodes.forEach((node) => {
      // Test meaningful labels (not undefined or empty)
      const nodeText = node.textContent || ''
      const label = nodeText.split('\n')[0] // First line should be the label
      
      expect(label).toBeTruthy()
      expect(label).not.toBe('undefined')
      expect(label.trim().length).toBeGreaterThan(0)
      
      // Test minimum properties using Testing Library queries (more reliable than querySelector)
      const nodeScope = within(node)
      
      // Count property elements directly - they exist if the content generation worked
      const propertyElements = nodeScope.getAllByTestId(/^property-/)
      expect(propertyElements.length).toBeGreaterThanOrEqual(2)
      
      // Verify each property has content
      propertyElements.forEach(propertyElement => {
        expect(propertyElement.textContent).toBeTruthy()
        expect(propertyElement.textContent!.trim().length).toBeGreaterThan(0)
      })
    })
  })
}) 

describe('Automatic Camera Adjustment', () => {
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
  const testGraphDisplayQuality = (description: string) => {
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
    testGraphDisplayQuality('initial default graph')
  })

  it('adjusts camera when new graphs are generated', () => {
    render(<Home />)
    
    const generateButton = screen.getByText('Generate Graph')
    
    // Test first generated graph
    fireEvent.click(generateButton)
    testGraphDisplayQuality('first generated graph')
    
    // Test second generated graph  
    fireEvent.click(generateButton)
    testGraphDisplayQuality('second generated graph')
  })

  it('maintains optimal camera positioning after edge type changes', () => {
    render(<Home />)
    
    // Change edge type
    const edgeTypeSelect = screen.getByLabelText('Edge Type:')
    fireEvent.change(edgeTypeSelect, { target: { value: 'straight' } })
    
    testGraphDisplayQuality('graph after edge type change')
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
    
    // Get any available node
    const firstNode = screen.getAllByTestId(/^node-/)[0]
    
    // Click the node
    fireEvent.click(firstNode)
    
    // Verify side panel appears
    const sidePanel = screen.getByTestId('side-panel')
    expect(sidePanel).toBeInTheDocument()
    expect(sidePanel).toHaveTextContent('Side panel is open')
  })
}) 