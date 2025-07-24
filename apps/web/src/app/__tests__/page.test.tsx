import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../page'
import nodeData from '@/data/current-lineage.json'

// Mock ReactFlow to avoid canvas rendering issues in tests
jest.mock('reactflow', () => ({
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
jest.mock('@/utils/trpc', () => ({
  api: {
    useQuery: jest.fn(() => ({
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

  it('uses automatic layout positioning', () => {
    render(<Home />)
    
    // Check that nodes are positioned by automatic layout
    // Verify that both nodes are rendered (this confirms the layout is working)
    expect(screen.getByTestId('node-new-users')).toBeInTheDocument()
    expect(screen.getByTestId('node-new-paid-users')).toBeInTheDocument()
    
    // Check that at least one node has been positioned away from origin
    const sourceNode = screen.getByTestId('node-new-users')
    const targetNode = screen.getByTestId('node-new-paid-users')
    
    const sourceX = parseInt(sourceNode.getAttribute('data-position-x') || '0')
    const targetX = parseInt(targetNode.getAttribute('data-position-x') || '0')
    
    // At least one node should be positioned by automatic layout
    expect(sourceX).toBeGreaterThanOrEqual(0)
    expect(targetX).toBeGreaterThan(0) // The target node should definitely be positioned
  })
})

describe('Connected Cards Display', () => {
  describe('Edge Connection & Direction', () => {
    it('displays an edge element when nodes are connected', () => {
      render(<Home />)
      
      // This should fail because there are no edges in the current data
      expect(screen.getByTestId('react-flow__edge')).toBeInTheDocument()
    })

    it('directs the edge from left to right (source to target)', () => {
      render(<Home />)
      
      // This should fail because there are no edges in the current data
      const edge = screen.getByTestId('react-flow__edge')
      expect(edge).toHaveAttribute('data-source', 'new-users')
      expect(edge).toHaveAttribute('data-target', 'new-paid-users')
    })

    it('connects the edge to the correct source node', () => {
      render(<Home />)
      
      // This should fail because there are no edges in the current data
      const edge = screen.getByTestId('react-flow__edge')
      const sourceNode = screen.getByTestId('node-new-users')
      
      expect(edge).toHaveAttribute('data-source', 'new-users')
      expect(sourceNode).toHaveAttribute('data-node-id', 'new-users')
    })

    it('connects the edge to the correct target node', () => {
      render(<Home />)
      
      // This should fail because there are no edges in the current data
      const edge = screen.getByTestId('react-flow__edge')
      const targetNode = screen.getByTestId('node-new-paid-users')
      
      expect(edge).toHaveAttribute('data-target', 'new-paid-users')
      expect(targetNode).toHaveAttribute('data-node-id', 'new-paid-users')
    })
  })

  describe('Automatic Layout', () => {
    it('positions source node to the left of target node in horizontal flow', () => {
      render(<Home />)
      
      const sourceNode = screen.getByTestId('node-new-users')
      const targetNode = screen.getByTestId('node-new-paid-users')
      
      const sourceX = parseInt(sourceNode.getAttribute('data-position-x') || '0')
      const targetX = parseInt(targetNode.getAttribute('data-position-x') || '0')
      
      // In horizontal flow, source should be to the left of target
      expect(sourceX).toBeLessThan(targetX)
    })

    it('maintains reasonable vertical spacing between nodes', () => {
      render(<Home />)
      
      const sourceNode = screen.getByTestId('node-new-users')
      const targetNode = screen.getByTestId('node-new-paid-users')
      
      const sourceY = parseInt(sourceNode.getAttribute('data-position-y') || '0')
      const targetY = parseInt(targetNode.getAttribute('data-position-y') || '0')
      
      // Nodes should be reasonably close vertically (within 200px)
      const verticalDistance = Math.abs(sourceY - targetY)
      expect(verticalDistance).toBeLessThan(200)
    })
  })
}) 