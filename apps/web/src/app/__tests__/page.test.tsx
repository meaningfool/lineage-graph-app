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
}) 