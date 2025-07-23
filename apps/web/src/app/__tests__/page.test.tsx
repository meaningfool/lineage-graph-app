import { render, screen } from '@testing-library/react'
import Home from '../page'

// Mock the trpc utility
jest.mock('@/utils/trpc', () => ({
  trpc: {
    healthCheck: {
      queryOptions: () => ({
        queryKey: ['healthCheck'],
        queryFn: () => Promise.resolve({ status: 'ok' }),
      }),
    },
  },
}))

// Mock the useQuery hook
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { status: 'ok' },
    isLoading: false,
  }),
}))

describe('Home Page', () => {
  it('should display the "Number of New Paid Users" node with all its properties when user visits the page', async () => {
    // Arrange & Act
    render(<Home />)
    
    // Assert - user sees the node title
    expect(screen.getByText('Number of New Paid Users')).toBeInTheDocument()
    
    // Assert - user sees all properties from the data file
    expect(screen.getByText('Calculated number of new paid users')).toBeInTheDocument()
    expect(screen.getByText('Integer')).toBeInTheDocument()
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    expect(screen.getByText('New Users × Paid User %')).toBeInTheDocument()
  })
}) 