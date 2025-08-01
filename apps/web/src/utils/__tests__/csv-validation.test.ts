import { describe, it, expect } from 'vitest'
import { validateRequiredFields, validateNodeTypes } from '../csv-validation'

describe('validateRequiredFields', () => {
  it('should detect missing node ID with specific node identification', () => {
    // Given: nodes array with node at index 1 missing 'id' field
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'INPUT' },
      { title: 'Node 2', type: 'STEP' }, // missing id
      { id: 'node3', title: 'Node 3', type: 'OUTPUT' }
    ]

    // When: validateRequiredFields(nodes, 'nodes') called
    const result = validateRequiredFields(nodes, 'nodes')

    // Then: should return error with specific row and field identification
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({
      type: 'MISSING_REQUIRED_FIELD',
      severity: 'critical',
      message: 'Node at row 2 is missing required field: id',
      rowIndex: 1,
      field: 'id',
      dataType: 'nodes'
    })
  })

  it('should detect missing node title with row identification', () => {
    // Given: nodes array with node at index 0 having empty 'title' field
    const nodes = [
      { id: 'node1', title: '', type: 'INPUT' }, // empty title
      { id: 'node2', title: 'Node 2', type: 'STEP' }
    ]

    // When: validateRequiredFields called
    const result = validateRequiredFields(nodes, 'nodes')

    // Then: should return error with rowIndex: 0, field: 'title'
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({
      type: 'MISSING_REQUIRED_FIELD',
      severity: 'critical',
      message: 'Node at row 1 is missing required field: title',
      rowIndex: 0,
      field: 'title',
      dataType: 'nodes'
    })
  })

  it('should detect missing edge source field', () => {
    // Given: edges array with edge at index 2 missing 'source' field  
    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
      { target: 'node4' } // missing source
    ]

    // When: validateRequiredFields(edges, 'edges') called
    const result = validateRequiredFields(edges, 'edges')

    // Then: should return error with message 'Edge at row 3 is missing required field: source'
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({
      type: 'MISSING_REQUIRED_FIELD',
      severity: 'critical',
      message: 'Edge at row 3 is missing required field: source',
      rowIndex: 2,
      field: 'source',
      dataType: 'edges'
    })
  })

  it('should detect missing edge target field', () => {
    // Given: edges array with edge missing 'target' field
    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2' } // missing target
    ]

    // When: validateRequiredFields called
    const result = validateRequiredFields(edges, 'edges')

    // Then: should return appropriate error with field identification
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({
      type: 'MISSING_REQUIRED_FIELD',
      severity: 'critical',
      message: 'Edge at row 2 is missing required field: target',
      rowIndex: 1,
      field: 'target',
      dataType: 'edges'
    })
  })

  it('should detect multiple missing fields in same data', () => {
    // Given: nodes with multiple missing required fields
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'INPUT' },
      { title: 'Node 2', type: 'STEP' }, // missing id
      { id: 'node3', type: 'OUTPUT' } // missing title
    ]

    // When: validateRequiredFields called
    const result = validateRequiredFields(nodes, 'nodes')

    // Then: should return multiple errors
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].message).toBe('Node at row 2 is missing required field: id')
    expect(result.errors[1].message).toBe('Node at row 3 is missing required field: title')
  })

  it('should return success when all required fields present', () => {
    // Given: valid nodes and edges with all required fields
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'INPUT' },
      { id: 'node2', title: 'Node 2', type: 'STEP' }
    ]
    const edges = [
      { source: 'node1', target: 'node2' }
    ]

    // When: validateRequiredFields called for both
    const nodeResult = validateRequiredFields(nodes, 'nodes')
    const edgeResult = validateRequiredFields(edges, 'edges')

    // Then: should return success for both
    expect(nodeResult.isValid).toBe(true)
    expect(nodeResult.errors).toHaveLength(0)
    expect(edgeResult.isValid).toBe(true)
    expect(edgeResult.errors).toHaveLength(0)
  })
})

describe('validateNodeTypes', () => {
  it('should detect invalid node type with specific node identification', () => {
    // Given: node at index 1 with type 'PROCESSING' (invalid)
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'INPUT' },
      { id: 'node2', title: 'Node 2', type: 'PROCESSING' }, // invalid type
      { id: 'node3', title: 'Node 3', type: 'OUTPUT' }
    ]

    // When: validateNodeTypes called
    const result = validateNodeTypes(nodes)

    // Then: should return error with specific details
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({
      type: 'INVALID_NODE_TYPE',
      severity: 'critical',
      message: 'Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT',
      rowIndex: 1,
      invalidValue: 'PROCESSING',
      validValues: ['INPUT', 'STEP', 'OUTPUT'],
      dataType: 'nodes'
    })
  })

  it('should handle case-insensitive type validation', () => {
    // Given: node with type 'input' (lowercase)
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'input' }
    ]

    // When: validateNodeTypes called
    const result = validateNodeTypes(nodes)

    // Then: should normalize to 'INPUT' and pass validation
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    // Note: The function should normalize the type internally
  })

  it('should handle mixed case types correctly', () => {
    // Given: nodes with various case combinations
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'Input' },
      { id: 'node2', title: 'Node 2', type: 'STEP' },
      { id: 'node3', title: 'Node 3', type: 'output' }
    ]

    // When: validateNodeTypes called
    const result = validateNodeTypes(nodes)

    // Then: should normalize all and pass validation
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect multiple invalid node types', () => {
    // Given: multiple nodes with invalid types
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'INPUT' },
      { id: 'node2', title: 'Node 2', type: 'PROCESSING' }, // invalid
      { id: 'node3', title: 'Node 3', type: 'CALCULATION' } // invalid
    ]

    // When: validateNodeTypes called
    const result = validateNodeTypes(nodes)

    // Then: should return multiple errors
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].message).toBe('Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT')
    expect(result.errors[1].message).toBe('Node at row 3 has invalid type: CALCULATION. Must be INPUT, STEP, or OUTPUT')
  })

  it('should return success for valid node types', () => {
    // Given: nodes with types ['INPUT', 'STEP', 'OUTPUT']
    const nodes = [
      { id: 'node1', title: 'Node 1', type: 'INPUT' },
      { id: 'node2', title: 'Node 2', type: 'STEP' },
      { id: 'node3', title: 'Node 3', type: 'OUTPUT' }
    ]

    // When: validateNodeTypes called
    const result = validateNodeTypes(nodes)

    // Then: should return success
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should handle empty nodes array', () => {
    // Given: empty nodes array
    const nodes: any[] = []

    // When: validateNodeTypes called
    const result = validateNodeTypes(nodes)

    // Then: should return success
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})