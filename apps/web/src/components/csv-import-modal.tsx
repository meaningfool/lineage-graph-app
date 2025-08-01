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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)

  const validateCSV = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    
    return new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          setIsProcessing(false)
          
          // Check for empty file
          if (file.size === 0 || results.data.length === 0) {
            setError('File is empty')
            setUploadedFile(null)
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
            setUploadedFile(null)
            resolve()
            return
          }
          
          // Success
          setParseResult(results)
          setUploadedFile(file)
          resolve()
        },
        error: (error: Papa.ParseError) => {
          setIsProcessing(false)
          setError('Invalid CSV format')
          setUploadedFile(null)
          resolve()
        }
      })
    })
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)
    setUploadedFile(null)
    setParseResult(null)
    
    if (rejectedFiles.length > 0) {
      setError('Only CSV files allowed')
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      await validateCSV(file)
    }
  }, [validateCSV])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
        
        <div className="py-4 space-y-4">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/50' 
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }
            `}
          >
            <input 
              {...getInputProps()} 
              aria-label="CSV file upload"
              accept=".csv,text/csv"
            />
            
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  {isDragActive 
                    ? 'Drop CSV file here' 
                    : 'Drop CSV file here or click to browse'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv files only
                </p>
              </div>
              <Button variant="outline" size="sm" type="button">
                Browse Files
              </Button>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Processing file...
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Validating CSV format and parsing data
                </p>
              </div>
            </div>
          )}

          {/* File Upload Success */}
          {uploadedFile && !isProcessing && !error && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
              <FileText className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  File uploaded successfully
                </p>
                {parseResult && (
                  <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                    {parseResult.data.length} rows parsed
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}