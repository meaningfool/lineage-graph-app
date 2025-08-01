import React, { useState, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { validateRequiredFields, validateNodeTypes, validateDuplicateNodeIds, type ValidationResult } from '@/utils/csv-validation'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ParseResult {
  data: any[]
  meta: Papa.ParseMeta
  errors: Papa.ParseError[]
}

type Step = 'upload' | 'columns' | 'mapping' | 'validation'

interface ColumnMapping {
  nodeId: string
  nodeTitle: string
  nodeType: string
  sourceNode: string
  targetNode: string
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [nodesFile, setNodesFile] = useState<File | null>(null)
  const [edgesFile, setEdgesFile] = useState<File | null>(null)
  const [nodesError, setNodesError] = useState<string | null>(null)
  const [edgesError, setEdgesError] = useState<string | null>(null)
  const [isProcessingNodes, setIsProcessingNodes] = useState(false)
  const [isProcessingEdges, setIsProcessingEdges] = useState(false)
  const [nodesParseResult, setNodesParseResult] = useState<ParseResult | null>(null)
  const [edgesParseResult, setEdgesParseResult] = useState<ParseResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    nodeId: '',
    nodeTitle: '',
    nodeType: '',
    sourceNode: '',
    targetNode: ''
  })

  // Validation state
  const [validationResult, setValidationResult] = useState<{
    nodes: ValidationResult | null
    edges: ValidationResult | null
  }>({
    nodes: null,
    edges: null
  })

  const validateCSV = useCallback(async (file: File, fileType: 'nodes' | 'edges') => {
    const setProcessing = fileType === 'nodes' ? setIsProcessingNodes : setIsProcessingEdges
    const setError = fileType === 'nodes' ? setNodesError : setEdgesError
    const setFile = fileType === 'nodes' ? setNodesFile : setEdgesFile
    const setParseResult = fileType === 'nodes' ? setNodesParseResult : setEdgesParseResult
    
    setProcessing(true)
    setError(null)
    
    return new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          setProcessing(false)
          
          // Check for empty file
          if (file.size === 0 || results.data.length === 0) {
            setError('File is empty')
            setFile(null)
            resolve()
            return
          }
          
          // Check for parsing errors
          if (results.errors.length > 0) {
            const hasFormatErrors = results.errors.some(error => 
              error.type === 'Quotes' || error.type === 'FieldMismatch'
            )
            
            if (hasFormatErrors) {
              setError('Invalid CSV format')
            } else {
              setError('CSV parsing error')
            }
            setFile(null)
            resolve()
            return
          }
          
          // Success
          setParseResult(results)
          setFile(file)
          resolve()
        },
        error: (error: Papa.ParseError) => {
          setProcessing(false)
          setError('Invalid CSV format')
          setFile(null)
          resolve()
        }
      })
    })
  }, [])

  const createOnDrop = useCallback((fileType: 'nodes' | 'edges') => {
    return async (acceptedFiles: File[], rejectedFiles: any[]) => {
      const setError = fileType === 'nodes' ? setNodesError : setEdgesError
      const setFile = fileType === 'nodes' ? setNodesFile : setEdgesFile
      const setParseResult = fileType === 'nodes' ? setNodesParseResult : setEdgesParseResult
      
      setError(null)
      setFile(null)
      setParseResult(null)
      
      if (rejectedFiles.length > 0) {
        setError('Only CSV files allowed')
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        await validateCSV(file, fileType)
      }
    }
  }, [validateCSV])

  const nodesDropzone = useDropzone({
    onDrop: createOnDrop('nodes'),
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  })
  
  const edgesDropzone = useDropzone({
    onDrop: createOnDrop('edges'),
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  })

  // Auto-detect column mappings when navigating to mapping step
  const autoDetectMappings = useCallback(() => {
    if (!nodesParseResult || !edgesParseResult) return

    const nodeColumns = nodesParseResult.meta.fields || []
    const edgeColumns = edgesParseResult.meta.fields || []

    const newMapping: ColumnMapping = {
      nodeId: nodeColumns.find(col => 
        col.toLowerCase().includes('id') || col.toLowerCase() === 'id'
      ) || '',
      nodeTitle: nodeColumns.find(col => 
        col.toLowerCase().includes('title') || col.toLowerCase().includes('name') || col.toLowerCase() === 'title'
      ) || '',
      nodeType: nodeColumns.find(col => 
        col.toLowerCase().includes('type') || col.toLowerCase() === 'type'
      ) || '',
      sourceNode: edgeColumns.find(col => 
        col.toLowerCase().includes('source') || col.toLowerCase().includes('from') || col.toLowerCase() === 'source'
      ) || '',
      targetNode: edgeColumns.find(col => 
        col.toLowerCase().includes('target') || col.toLowerCase().includes('to') || col.toLowerCase() === 'target'
      ) || ''
    }

    setColumnMapping(newMapping)
  }, [nodesParseResult, edgesParseResult])

  // Check if required mappings are complete
  const isValidMapping = columnMapping.nodeId && columnMapping.nodeTitle && 
                        columnMapping.sourceNode && columnMapping.targetNode

  // Handle mapping field changes
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Run validation when entering validation step
  const runValidation = useCallback(() => {
    if (!nodesParseResult || !edgesParseResult) return

    // Map CSV data using column mappings
    const mappedNodes = nodesParseResult.data.map(row => ({
      id: row[columnMapping.nodeId],
      title: row[columnMapping.nodeTitle],
      type: row[columnMapping.nodeType]
    }))

    const mappedEdges = edgesParseResult.data.map(row => ({
      source: row[columnMapping.sourceNode],
      target: row[columnMapping.targetNode]
    }))

    // Run required fields validation
    const nodesRequiredFieldsValidation = validateRequiredFields(mappedNodes, 'nodes')
    const edgesRequiredFieldsValidation = validateRequiredFields(mappedEdges, 'edges')
    
    // Run node type validation
    const nodeTypesValidation = validateNodeTypes(mappedNodes)
    
    // Run duplicate node ID validation
    const duplicateNodesValidation = validateDuplicateNodeIds(mappedNodes)

    // Combine all validation results
    const combinedNodesValidation: ValidationResult = {
      isValid: nodesRequiredFieldsValidation.isValid && nodeTypesValidation.isValid && duplicateNodesValidation.isValid,
      errors: [...nodesRequiredFieldsValidation.errors, ...nodeTypesValidation.errors, ...duplicateNodesValidation.errors]
    }

    setValidationResult({
      nodes: combinedNodesValidation,
      edges: edgesRequiredFieldsValidation
    })
  }, [nodesParseResult, edgesParseResult, columnMapping])

  // Check if validation has critical errors
  const hasValidationErrors = useMemo(() => {
    if (!validationResult.nodes || !validationResult.edges) return true
    return validationResult.nodes.errors.length > 0 || validationResult.edges.errors.length > 0
  }, [validationResult])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Graph from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {currentStep === 'upload' && (
            <>
              {/* Nodes File Drop Zone */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Upload Nodes CSV</h3>
                <div
                  {...nodesDropzone.getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${nodesDropzone.isDragActive 
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/50' 
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <input 
                    {...nodesDropzone.getInputProps()} 
                    aria-label="Nodes CSV file upload"
                    accept=".csv,text/csv"
                  />
                  
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        {nodesDropzone.isDragActive 
                          ? 'Drop nodes CSV here' 
                          : 'Drop nodes CSV here or click to browse'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contains node data (id, title, type, etc.)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" type="button">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>

              {/* Edges File Drop Zone */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Upload Edges CSV</h3>
                <div
                  {...edgesDropzone.getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${edgesDropzone.isDragActive 
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/50' 
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <input 
                    {...edgesDropzone.getInputProps()} 
                    aria-label="Edges CSV file upload"
                    accept=".csv,text/csv"
                  />
                  
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        {edgesDropzone.isDragActive 
                          ? 'Drop edges CSV here' 
                          : 'Drop edges CSV here or click to browse'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contains edge data (source, target, etc.)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" type="button">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Status Summary */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium">Upload Status</h4>
                
                {/* Nodes File Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nodes file:</span>
                  <div className="flex items-center space-x-2">
                    {isProcessingNodes && (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    )}
                    {nodesFile && !isProcessingNodes && !nodesError && (
                      <FileText className="h-4 w-4 text-green-600" />
                    )}
                    {nodesError && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {nodesFile ? nodesFile.name : 'Not uploaded'}
                    </span>
                  </div>
                </div>
                
                {/* Edges File Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Edges file:</span>
                  <div className="flex items-center space-x-2">
                    {isProcessingEdges && (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    )}
                    {edgesFile && !isProcessingEdges && !edgesError && (
                      <FileText className="h-4 w-4 text-green-600" />
                    )}
                    {edgesError && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {edgesFile ? edgesFile.name : 'Not uploaded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {nodesError && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Nodes file: {nodesError}
                  </p>
                </div>
              )}
              
              {edgesError && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Edges file: {edgesError}
                  </p>
                </div>
              )}
            </>
          )}

          {currentStep === 'columns' && (
            <>
              {/* Column Detection View */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Column Detection</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review the columns found in your CSV files
                  </p>
                </div>

                {/* Nodes File Columns */}
                {nodesParseResult && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Nodes File Columns</h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {nodesParseResult.meta.fields?.map((column, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded"
                          >
                            {column}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {nodesParseResult.data.length} rows found
                      </p>
                    </div>
                  </div>
                )}

                {/* Edges File Columns */}
                {edgesParseResult && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Edges File Columns</h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {edgesParseResult.meta.fields?.map((column, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded"
                          >
                            {column}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {edgesParseResult.data.length} rows found
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {currentStep === 'mapping' && (
            <>
              {/* Column Mapping View */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Column Mapping</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Map your CSV columns to the required fields
                  </p>
                </div>

                {/* Nodes Mapping */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Node Fields</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="node-id" className="text-sm font-medium">
                        Node ID Column *
                      </label>
                      <select
                        id="node-id"
                        aria-label="Node ID column mapping"
                        className="w-full p-2 border rounded-md text-sm"
                        value={columnMapping.nodeId}
                        onChange={(e) => handleMappingChange('nodeId', e.target.value)}
                      >
                        <option value="">Select column...</option>
                        {nodesParseResult?.meta.fields?.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="node-title" className="text-sm font-medium">
                        Node Title Column *
                      </label>
                      <select
                        id="node-title"
                        aria-label="Node title column mapping"
                        className="w-full p-2 border rounded-md text-sm"
                        value={columnMapping.nodeTitle}
                        onChange={(e) => handleMappingChange('nodeTitle', e.target.value)}
                      >
                        <option value="">Select column...</option>
                        {nodesParseResult?.meta.fields?.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="node-type" className="text-sm font-medium">
                        Node Type Column
                      </label>
                      <select
                        id="node-type"
                        aria-label="Node type column mapping"
                        className="w-full p-2 border rounded-md text-sm"
                        value={columnMapping.nodeType}
                        onChange={(e) => handleMappingChange('nodeType', e.target.value)}
                      >
                        <option value="">Select column...</option>
                        {nodesParseResult?.meta.fields?.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Edges Mapping */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Edge Fields</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="source-node" className="text-sm font-medium">
                        Source Node Column *
                      </label>
                      <select
                        id="source-node"
                        aria-label="Source node column mapping"
                        className="w-full p-2 border rounded-md text-sm"
                        value={columnMapping.sourceNode}
                        onChange={(e) => handleMappingChange('sourceNode', e.target.value)}
                      >
                        <option value="">Select column...</option>
                        {edgesParseResult?.meta.fields?.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="target-node" className="text-sm font-medium">
                        Target Node Column *
                      </label>
                      <select
                        id="target-node"
                        aria-label="Target node column mapping"
                        className="w-full p-2 border rounded-md text-sm"
                        value={columnMapping.targetNode}
                        onChange={(e) => handleMappingChange('targetNode', e.target.value)}
                      >
                        <option value="">Select column...</option>
                        {edgesParseResult?.meta.fields?.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Validation Messages */}
                {!isValidMapping && (
                  <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Required fields missing
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Please map all required fields: Node ID, Node Title, Source Node, and Target Node
                    </p>
                  </div>
                )}

                {!columnMapping.sourceNode && !columnMapping.targetNode && columnMapping.nodeId && columnMapping.nodeTitle && (
                  <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Source and Target fields required
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {currentStep === 'validation' && (
            <>
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Step 4: Validate Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review data validation results before import
                  </p>
                </div>

                {/* Validation Results */}
                <div className="space-y-4">
                  {validationResult.nodes && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Nodes Validation
                      </h4>
                      
                      {validationResult.nodes.isValid ? (
                        <div className="flex items-center gap-2 text-green-600 mt-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">All nodes validation passed</span>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Critical Errors ({validationResult.nodes.errors.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {validationResult.nodes.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-600 ml-6">
                                {error.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {validationResult.edges && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Edges Validation
                      </h4>
                      
                      {validationResult.edges.isValid ? (
                        <div className="flex items-center gap-2 text-green-600 mt-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">All edges validation passed</span>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Critical Errors ({validationResult.edges.errors.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {validationResult.edges.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-600 ml-6">
                                {error.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {hasValidationErrors && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Fix required field errors</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        Please go back and ensure all required fields are properly filled in your CSV files.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {(currentStep === 'columns' || currentStep === 'mapping' || currentStep === 'validation') && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (currentStep === 'validation') {
                  setCurrentStep('mapping')
                } else if (currentStep === 'mapping') {
                  setCurrentStep('columns')
                } else {
                  setCurrentStep('upload')
                }
              }}
            >
              Back
            </Button>
          )}
          
          {currentStep === 'upload' && (
            <Button 
              disabled={!nodesFile || !edgesFile || isProcessingNodes || isProcessingEdges || !!nodesError || !!edgesError}
              onClick={() => setCurrentStep('columns')}
            >
              Continue
            </Button>
          )}
          
          {currentStep === 'columns' && (
            <Button 
              onClick={() => {
                setCurrentStep('mapping')
                // Auto-detect mappings when navigating to mapping step
                autoDetectMappings()
              }}
            >
              Continue
            </Button>
          )}

          {currentStep === 'mapping' && (
            <Button 
              disabled={!isValidMapping}
              onClick={() => {
                setCurrentStep('validation')
                runValidation()
              }}
            >
              Continue
            </Button>
          )}

          {currentStep === 'validation' && (
            <Button 
              disabled={hasValidationErrors}
              onClick={() => {
                // TODO: Import graph data
                console.log('Import graph with mapping:', columnMapping)
                console.log('Validation passed, importing...')
              }}
            >
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}