import React from 'react'
import { render, screen, within } from '@testing-library/react'
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
  default: ({ nodes, edges, onNodeClick }: any) => (
    <div data-testid="react-flow">
      {nodes.map((node: any) => (
        <div 
          key={node.id} 
          data-testid={`node-${node.id}`}
          data-position-x={node.position.x}
          data-position-y={node.position.y}
          data-node-id={node.id}
          onClick={(event) => onNodeClick && onNodeClick(event, node)}
        >
          {node.data.label}
          {/* Properties no longer rendered in nodes - moved to side panel */}
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

  it('displays node labels only without properties in nodes', () => {
    render(<Home />)
    
    // For each node in the data, verify only labels are displayed (no properties in nodes)
    nodeData.nodes.forEach(node => {
      const nodeElement = screen.getByTestId(`node-${node.id}`)
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

 

// Data-Driven Edge Testing: REMOVED - now covered by E2E tests
// - tests/e2e/data-validation.spec.ts covers edge count
// - tests/e2e/graph-interactions.spec.ts covers edge functionality

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

  // Graph generation behavior: REMOVED - now covered by E2E tests
  // - tests/e2e/basic-functionality.spec.ts covers button functionality
  // - tests/e2e/data-validation.spec.ts covers generated graph data
}) 

// Automatic Camera Adjustment: REMOVED - implementation detail not crucial for E2E coverage
// ReactFlow fitView functionality is tested through visual verification in E2E tests

// Edge Type Selection: REMOVED - now covered by E2E tests
// - tests/e2e/graph-interactions.spec.ts covers all edge type functionality comprehensively

// Side Panel: REMOVED - now comprehensively covered by E2E tests
// - tests/e2e/side-panel-consolidated.spec.ts has 10 thorough tests covering all side panel functionality:
//   * Basic open/close behavior
//   * Transition classes
//   * Keyboard navigation  
//   * Node property display
//   * Content updates when switching nodes
//   * Complete open-close-reopen cycles
//   * Behavior with graph regeneration
//   * Properties for generated graph nodes 