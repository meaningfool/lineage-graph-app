export interface ValidationError {
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  rowIndex: number
  field: string
  dataType: 'nodes' | 'edges'
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