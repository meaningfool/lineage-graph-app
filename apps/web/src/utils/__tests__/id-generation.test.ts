import { describe, it, expect } from 'vitest'
import { generateNodeIds } from '../id-generation'

describe('generateNodeIds', () => {
  it('should generate IDs from title column using slugify', () => {
    // Given: nodes array with title values like "User Count", "Total Revenue"
    const nodes = [
      { title: 'User Count', type: 'INPUT' },
      { title: 'Total Revenue', type: 'OUTPUT' },
      { title: 'Average Order Value', type: 'STEP' }
    ]
    
    // When: generateNodeIds called
    const result = generateNodeIds(nodes)
    
    // Then: should return nodes with id: "user-count", "total-revenue"
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('id', 'user-count')
    expect(result[0]).toHaveProperty('title', 'User Count')
    expect(result[0]).toHaveProperty('type', 'INPUT')
    expect(result[1]).toHaveProperty('id', 'total-revenue')
    expect(result[2]).toHaveProperty('id', 'average-order-value')
  })

  it('should handle duplicate titles by adding numeric suffixes', () => {
    // Given: nodes with duplicate titles "User Count", "User Count"
    const nodes = [
      { title: 'User Count', type: 'INPUT' },
      { title: 'User Count', type: 'STEP' },
      { title: 'User Count', type: 'OUTPUT' }
    ]
    
    // When: generateNodeIds called
    const result = generateNodeIds(nodes)
    
    // Then: should generate "user-count", "user-count-2", "user-count-3"
    expect(result[0]).toHaveProperty('id', 'user-count')
    expect(result[1]).toHaveProperty('id', 'user-count-2')
    expect(result[2]).toHaveProperty('id', 'user-count-3')
  })

  it('should preserve original data while adding generated IDs', () => {
    // Given: nodes with various CSV columns
    const nodes = [
      { 
        title: 'Monthly Active Users',
        type: 'INPUT',
        description: 'Number of unique users per month',
        owner: 'Analytics Team',
        customField: 'value123'
      }
    ]
    
    // When: generateNodeIds called
    const result = generateNodeIds(nodes)
    
    // Then: should add 'id' field without modifying other properties
    expect(result[0]).toHaveProperty('id', 'monthly-active-users')
    expect(result[0]).toHaveProperty('title', 'Monthly Active Users')
    expect(result[0]).toHaveProperty('type', 'INPUT')
    expect(result[0]).toHaveProperty('description', 'Number of unique users per month')
    expect(result[0]).toHaveProperty('owner', 'Analytics Team')
    expect(result[0]).toHaveProperty('customField', 'value123')
  })

  it('should handle special characters and spaces in titles', () => {
    // Given: nodes with special characters
    const nodes = [
      { title: 'Revenue ($USD)', type: 'OUTPUT' },
      { title: 'User % Growth', type: 'STEP' },
      { title: 'New Users (30-day)', type: 'INPUT' },
      { title: 'MRR / ARR Ratio', type: 'STEP' }
    ]
    
    // When: generateNodeIds called
    const result = generateNodeIds(nodes)
    
    // Then: should generate clean IDs
    expect(result[0]).toHaveProperty('id', 'revenue-usd')
    expect(result[1]).toHaveProperty('id', 'user-growth')
    expect(result[2]).toHaveProperty('id', 'new-users-30-day')
    expect(result[3]).toHaveProperty('id', 'mrr-arr-ratio')
  })

  it('should handle empty or missing titles gracefully', () => {
    // Given: nodes with empty or missing titles
    const nodes = [
      { title: '', type: 'INPUT' },
      { title: '   ', type: 'STEP' },
      { type: 'OUTPUT' } as any
    ]
    
    // When: generateNodeIds called
    const result = generateNodeIds(nodes)
    
    // Then: should generate fallback IDs
    expect(result[0]).toHaveProperty('id', 'node-1')
    expect(result[1]).toHaveProperty('id', 'node-2')
    expect(result[2]).toHaveProperty('id', 'node-3')
  })

  it('should handle mixed case sensitivity correctly', () => {
    // Given: nodes with different case variations
    const nodes = [
      { title: 'user count', type: 'INPUT' },
      { title: 'User Count', type: 'STEP' },
      { title: 'USER COUNT', type: 'OUTPUT' }
    ]
    
    // When: generateNodeIds called
    const result = generateNodeIds(nodes)
    
    // Then: should treat them as duplicates
    expect(result[0]).toHaveProperty('id', 'user-count')
    expect(result[1]).toHaveProperty('id', 'user-count-2')
    expect(result[2]).toHaveProperty('id', 'user-count-3')
  })
})