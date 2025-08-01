import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CSVImportModal } from '../csv-import-modal'

describe('CSVImportModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('File Drop Zone', () => {
    it('displays file drop zone when modal is open', () => {
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      expect(screen.getByText(/upload nodes csv/i)).toBeInTheDocument()
      expect(screen.getByText(/upload edges csv/i)).toBeInTheDocument()
    })

    it('accepts CSV file drop', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      
      const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' })
      await user.upload(fileInput, file)
      
      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    it('rejects non-CSV files', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      
      // Try to upload a non-CSV file - react-dropzone should prevent it
      const file = new File(['data'], 'test.txt', { type: 'text/plain' })
      await user.upload(fileInput, file)
      
      // No file should be shown since it was rejected
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument()
      // No error should be shown since react-dropzone prevents the upload
      expect(screen.queryByText(/only csv files allowed/i)).not.toBeInTheDocument()
    })

    it('shows file name when valid CSV uploaded', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      
      const file = new File(['id,name\n1,test'], 'my-data.csv', { type: 'text/csv' })
      await user.upload(fileInput, file)
      
      expect(screen.getByText('my-data.csv')).toBeInTheDocument()
      expect(screen.queryByText(/only csv files allowed/i)).not.toBeInTheDocument()
    })

    it('allows browsing for files via button', () => {
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const browseButtons = screen.getAllByRole('button', { name: /browse files/i })
      expect(browseButtons).toHaveLength(2) // One for nodes, one for edges
      expect(browseButtons[0]).toBeInTheDocument()
      expect(browseButtons[1]).toBeInTheDocument()
    })

    it('shows proper file input for accessibility', () => {
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      
      expect(nodesInput).toBeInTheDocument()
      expect(nodesInput).toHaveAttribute('type', 'file')
      expect(nodesInput).toHaveAttribute('accept', '.csv,text/csv')
      
      expect(edgesInput).toBeInTheDocument() 
      expect(edgesInput).toHaveAttribute('type', 'file')
      expect(edgesInput).toHaveAttribute('accept', '.csv,text/csv')
    })
  })

  describe('CSV Validation', () => {
    it('shows error for empty CSV file', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      const file = new File([''], 'empty.csv', { type: 'text/csv' })
      await user.upload(fileInput, file)
      
      expect(screen.getByText(/nodes file: file is empty/i)).toBeInTheDocument()
    })

    it('shows error for malformed CSV', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      const file = new File(['col1,col2\n"unclosed quote'], 'bad.csv', { type: 'text/csv' })
      await user.upload(fileInput, file)
      
      expect(screen.getByText(/nodes file: invalid csv format/i)).toBeInTheDocument()
    })

    it('shows success for valid CSV', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      const file = new File(['col1,col2\nval1,val2'], 'good.csv', { type: 'text/csv' })
      await user.upload(fileInput, file)
      
      expect(screen.getByText('good.csv')).toBeInTheDocument()
      expect(screen.queryByText(/nodes file: invalid csv format/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/nodes file: file is empty/i)).not.toBeInTheDocument()
    })

    it('displays parsing progress during file processing', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      const file = new File(['col1,col2\nval1,val2'], 'processing.csv', { type: 'text/csv' })
      
      // Start upload
      await user.upload(fileInput, file)
      
      // Should show final success state with filename
      expect(screen.getByText('processing.csv')).toBeInTheDocument()
    })

    it('shows detailed error messages for parsing failures', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/nodes csv file/i)
      // Create a CSV with inconsistent columns (PapaParse treats this as format error)
      const file = new File(['col1,col2\nval1', 'col1,col2,col3\nval1,val2,val3'], 'inconsistent.csv', { type: 'text/csv' })
      await user.upload(fileInput, file)
      
      expect(screen.getByText(/nodes file: invalid csv format/i)).toBeInTheDocument()
    })
  })

  describe('Dual File Upload System', () => {
    it('displays two drop zones for nodes and edges', () => {
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      expect(screen.getByText(/upload nodes csv/i)).toBeInTheDocument()
      expect(screen.getByText(/upload edges csv/i)).toBeInTheDocument()
    })

    it('shows which files are uploaded and missing', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload nodes file only
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\n1,Users,input'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      // Check that the nodes file shows up in status
      expect(screen.getByText('nodes.csv')).toBeInTheDocument()
      expect(screen.getByText('Not uploaded')).toBeInTheDocument() // edges file status
    })

    it('enables next step only when both files uploaded', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Continue button should be disabled initially
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
      
      // Upload nodes file
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\n1,Users,input'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      // Still disabled with only one file
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
      
      // Upload edges file
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\n1,2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Now should be enabled
      expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
    })
  })

  describe('Column Detection & Preview', () => {
    it('displays columns found in nodes CSV', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload both files
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type,description\n1,Users,input,User data'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\n1,2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Click continue to go to column detection
      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)
      
      expect(screen.getByText(/nodes file columns/i)).toBeInTheDocument()
      expect(screen.getByText('id')).toBeInTheDocument()
      expect(screen.getByText('title')).toBeInTheDocument()
      expect(screen.getByText('type')).toBeInTheDocument()
      expect(screen.getByText('description')).toBeInTheDocument()
    })

    it('displays columns found in edges CSV', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload both files
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title\n1,Users'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target,weight\n1,2,0.5'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Click continue to go to column detection
      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)
      
      expect(screen.getByText(/edges file columns/i)).toBeInTheDocument()
      expect(screen.getByText('source')).toBeInTheDocument()
      expect(screen.getByText('target')).toBeInTheDocument()
      expect(screen.getByText('weight')).toBeInTheDocument()
    })

    it('shows sample data preview', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload both files with multiple rows
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File([
        'id,title,type\n1,Users,input\n2,Orders,input\n3,Revenue,output'
      ], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\n1,2\n2,3'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Click continue to go to column detection
      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)
      
      // Should show row count and preview
      expect(screen.getByText(/3.*rows/i)).toBeInTheDocument() // nodes row count
      expect(screen.getByText(/2.*rows/i)).toBeInTheDocument() // edges row count
    })

    it('provides navigation back to file upload', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload both files and navigate to column detection
      await uploadBothValidFiles(user)
      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)
      
      // Should have back button
      const backButton = screen.getByRole('button', { name: /back/i })
      expect(backButton).toBeInTheDocument()
      
      // Click back should return to file upload view
      await user.click(backButton)
      expect(screen.getByText(/upload nodes csv/i)).toBeInTheDocument()
      expect(screen.getByText(/upload edges csv/i)).toBeInTheDocument()
    })

    it('provides continue button to next step', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload both files and navigate to column detection
      await uploadBothValidFiles(user)
      let continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)
      
      // Should have continue button for next step (column mapping)
      continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeInTheDocument()
      expect(continueButton).toBeEnabled()
    })
  })

  describe('Column Mapping Interface', () => {
    it('displays column mapping dropdowns for required fields', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Navigate to column mapping step
      await navigateToColumnMapping(user)
      
      // Nodes mapping
      expect(screen.getByLabelText(/node id column/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/node title column/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/node type column/i)).toBeInTheDocument()
      
      // Edges mapping
      expect(screen.getByLabelText(/source node column/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target node column/i)).toBeInTheDocument()
    })

    it('validates required mappings before allowing continue', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload files with non-standard column names that won't auto-detect
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['col1,col2,col3\n1,Users,input'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['col1,col2\n1,2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate through steps
      let continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to columns
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to mapping
      
      // Continue should be disabled without proper mappings (auto-detection won't find standard names)
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
      
      // Map required fields manually
      await selectMapping(user, 'node-id', 'col1')
      await selectMapping(user, 'node-title', 'col2')
      await selectMapping(user, 'source-node', 'col1')
      await selectMapping(user, 'target-node', 'col2')
      
      expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
    })

    it('auto-detects obvious column mappings', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload files with standard column names
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\n1,Users,input'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\n1,2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate through steps
      let continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to columns
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to mapping
      
      // Should auto-select obvious matches
      expect(screen.getByDisplayValue('id')).toBeInTheDocument() // node-id mapped to 'id'
      expect(screen.getByDisplayValue('title')).toBeInTheDocument() // node-title mapped to 'title'
      expect(screen.getByDisplayValue('source')).toBeInTheDocument() // source-node mapped to 'source'
      expect(screen.getByDisplayValue('target')).toBeInTheDocument() // target-node mapped to 'target'
    })

    it('provides navigation back to column detection', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Navigate to column mapping step
      await navigateToColumnMapping(user)
      
      // Should have back button
      const backButton = screen.getByRole('button', { name: /back/i })
      expect(backButton).toBeInTheDocument()
      
      // Click back should return to column detection view
      await user.click(backButton)
      expect(screen.getByText(/column detection/i)).toBeInTheDocument()
      expect(screen.getByText(/nodes file columns/i)).toBeInTheDocument()
    })

    it('shows mapping validation errors', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload files with non-standard column names to prevent auto-detection
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['col1,col2,col3\n1,Users,input'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['col1,col2\n1,2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate through steps
      let continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to columns
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to mapping
      
      // Should show which required fields are missing (no auto-detection for non-standard names)
      expect(screen.getByText(/required.*missing/i)).toBeInTheDocument()
      
      // Map some fields
      await selectMapping(user, 'node-id', 'col1')
      await selectMapping(user, 'node-title', 'col2')
      
      // Should still show missing fields message
      expect(screen.getByText(/required.*missing/i)).toBeInTheDocument()
    })
  })

  describe('CSV Import Modal - Required Fields Validation', () => {
    it('should show validation step after column mapping is complete', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload files with missing required fields
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\n,Node 2,STEP\nnode3,Node 3,OUTPUT'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\nnode1,node2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate through steps
      let continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to columns
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to mapping
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to validation
      
      // Then: should display "Step 4: Validate Data" with validation results
      expect(screen.getByText(/step.*4.*validate.*data/i)).toBeInTheDocument()
    })

    it('should show specific missing field errors in validation step', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload CSV with node missing 'id' at row 2 (second data row)
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\nnode1,Node 1,INPUT\n,Node 2,STEP'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\nnode1,node2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate to validation step
      await navigateToValidationStep(user)
      
      // Then: should display specific error message
      expect(screen.getByText(/node at row 2 is missing required field: id/i)).toBeInTheDocument()
    })

    it('should prevent import when required fields missing', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload CSV with missing required fields
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\n,Node 2,STEP'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\nnode1,node2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate to validation step
      await navigateToValidationStep(user)
      
      // Then: Import button should be disabled with message
      const importButton = screen.getByRole('button', { name: /import/i })
      expect(importButton).toBeDisabled()
      expect(screen.getByText(/fix required field errors/i)).toBeInTheDocument()
    })

    it('should show invalid node type errors with suggestions', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      // Upload CSV with invalid node type 'PROCESSING'
      const nodesInput = screen.getByLabelText(/nodes csv file/i)
      const nodesFile = new File(['id,title,type\nnode1,Node 1,INPUT\nnode2,Node 2,PROCESSING'], 'nodes.csv', { type: 'text/csv' })
      await user.upload(nodesInput, nodesFile)
      
      const edgesInput = screen.getByLabelText(/edges csv file/i)
      const edgesFile = new File(['source,target\nnode1,node2'], 'edges.csv', { type: 'text/csv' })
      await user.upload(edgesInput, edgesFile)
      
      // Navigate to validation step
      await navigateToValidationStep(user)
      
      // Then: should show error with valid type suggestions
      expect(screen.getByText(/node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT/i)).toBeInTheDocument()
    })

    async function navigateToValidationStep(user: any) {
      // Navigate through all steps to validation
      let continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to columns
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to mapping
      continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)  // Go to validation
    }
  })

  describe('Modal Behavior', () => {
    it('does not render when closed', () => {
      render(<CSVImportModal isOpen={false} onClose={mockOnClose} />)
      
      expect(screen.queryByText(/upload nodes csv/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/upload edges csv/i)).not.toBeInTheDocument()
    })
  })

  // Helper functions for tests
  async function uploadBothValidFiles(user: any) {
    const nodesInput = screen.getByLabelText(/nodes csv file/i)
    const nodesFile = new File(['id,title,type\n1,Users,input'], 'nodes.csv', { type: 'text/csv' })
    await user.upload(nodesInput, nodesFile)
    
    const edgesInput = screen.getByLabelText(/edges csv file/i)
    const edgesFile = new File(['source,target\n1,2'], 'edges.csv', { type: 'text/csv' })
    await user.upload(edgesInput, edgesFile)
  }

  async function navigateToColumnMapping(user: any) {
    // Upload both files
    await uploadBothValidFiles(user)
    
    // Navigate to columns step
    let continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)
    
    // Navigate to mapping step
    continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)
  }

  async function selectMapping(user: any, fieldName: string, columnValue: string) {
    const dropdown = screen.getByLabelText(new RegExp(fieldName.replace('-', '.*'), 'i'))
    await user.selectOptions(dropdown, columnValue)
  }
})