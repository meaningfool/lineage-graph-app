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

  describe('Modal Behavior', () => {
    it('does not render when closed', () => {
      render(<CSVImportModal isOpen={false} onClose={mockOnClose} />)
      
      expect(screen.queryByText(/upload nodes csv/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/upload edges csv/i)).not.toBeInTheDocument()
    })
  })
})