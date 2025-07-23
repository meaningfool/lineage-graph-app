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
  it('should display a single node with title "Revenue Growth" when user visits the page', async () => {
    // Arrange & Act
    render(<Home />)
    
    // Assert - user sees the node title
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument()
  })

  it('should display the "Number of New Paid Users" node with its description when user visits the page', async () => {
    // Arrange & Act
    render(<Home />)
    
    // Assert - user sees the node title
    expect(screen.getByText('Number of New Paid Users')).toBeInTheDocument()
    
    // Assert - user sees the description from the data file
    expect(screen.getByText('Calculated number of new paid users')).toBeInTheDocument()
  })
}) 