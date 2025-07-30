import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from '../page'
import nodeData from '@/data/target-lineage.json'

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
  Handle: ({ type, position }: any) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right'
  },
  Background: ({ children }: any) => <div data-testid="background">{children}</div>
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