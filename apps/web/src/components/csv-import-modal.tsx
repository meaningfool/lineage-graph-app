import React, { useState, useCallback } from 'react'
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
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ParseResult {
  data: any[]
  meta: Papa.ParseMeta
  errors: Papa.ParseError[]
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const [nodesFile, setNodesFile] = useState<File | null>(null)
  const [edgesFile, setEdgesFile] = useState<File | null>(null)
  const [nodesError, setNodesError] = useState<string | null>(null)
  const [edgesError, setEdgesError] = useState<string | null>(null)
  const [isProcessingNodes, setIsProcessingNodes] = useState(false)
  const [isProcessingEdges, setIsProcessingEdges] = useState(false)
  const [nodesParseResult, setNodesParseResult] = useState<ParseResult | null>(null)
  const [edgesParseResult, setEdgesParseResult] = useState<ParseResult | null>(null)

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Graph from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            disabled={!nodesFile || !edgesFile || isProcessingNodes || isProcessingEdges || !!nodesError || !!edgesError}
            onClick={() => {
              // TODO: Navigate to next step (column detection)
              console.log('Continue to column detection')
            }}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}