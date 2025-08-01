export interface ValidationError {
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  rowIndex: number
  field?: string
  dataType: 'nodes' | 'edges'
  invalidValue?: string
  validValues?: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationError[]
}

// Required fields for different data types
const REQUIRED_FIELDS = {
  nodes: ['id', 'title', 'type'],
  edges: ['source', 'target']
} as const

export function validateRequiredFields(
  data: Record<string, any>[],
  dataType: 'nodes' | 'edges'
): ValidationResult {
  const errors: ValidationError[] = []
  const requiredFields = REQUIRED_FIELDS[dataType]

  data.forEach((item, index) => {
    requiredFields.forEach((field) => {
      // Check if field is missing or empty (including empty strings)
      if (!item[field] || (typeof item[field] === 'string' && item[field].trim() === '')) {
        errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          severity: 'critical',
          message: `${dataType === 'nodes' ? 'Node' : 'Edge'} at row ${index + 1} is missing required field: ${field}`,
          rowIndex: index,
          field,
          dataType
        })
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Valid node types
const VALID_NODE_TYPES = ['INPUT', 'STEP', 'OUTPUT'] as const

export function validateNodeTypes(
  nodes: Record<string, any>[]
): ValidationResult {
  const errors: ValidationError[] = []

  nodes.forEach((node, index) => {
    if (node.type) {
      // Normalize type to uppercase for comparison
      const normalizedType = String(node.type).toUpperCase()
      
      // Check if the normalized type is valid
      if (!VALID_NODE_TYPES.includes(normalizedType as any)) {
        errors.push({
          type: 'INVALID_NODE_TYPE',
          severity: 'critical',
          message: `Node at row ${index + 1} has invalid type: ${node.type}. Must be INPUT, STEP, or OUTPUT`,
          rowIndex: index,
          invalidValue: node.type,
          validValues: [...VALID_NODE_TYPES],
          dataType: 'nodes'
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}