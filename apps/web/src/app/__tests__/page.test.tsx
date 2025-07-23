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
  it('should display the application title when user visits the page', async () => {
    // Arrange & Act
    render(<Home />)
    
    // Assert - look for the ASCII art content that's actually displayed
    expect(screen.getByText(/██████╗/)).toBeInTheDocument()
    expect(screen.getByText(/██╔══██╗/)).toBeInTheDocument()
  })

  it('should display API status section when user visits the page', async () => {
    // Arrange & Act
    render(<Home />)
    
    // Assert
    expect(screen.getByText('API Status')).toBeInTheDocument()
  })
}) 