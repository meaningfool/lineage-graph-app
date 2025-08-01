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
      
      const dropzone = screen.getByText(/drop.*csv.*here/i)
      expect(dropzone).toBeInTheDocument()
    })

    it('accepts CSV file drop', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const dropzone = screen.getByText(/drop.*csv.*here/i)
      
      const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' })
      await user.upload(dropzone, file)
      
      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    it('rejects non-CSV files', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const dropzone = screen.getByText(/drop.*csv.*here/i)
      
      const file = new File(['data'], 'test.txt', { type: 'text/plain' })
      await user.upload(dropzone, file)
      
      expect(screen.getByText(/only csv files allowed/i)).toBeInTheDocument()
    })

    it('shows file name when valid CSV uploaded', async () => {
      const user = userEvent.setup()
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const dropzone = screen.getByText(/drop.*csv.*here/i)
      
      const file = new File(['id,name\n1,test'], 'my-data.csv', { type: 'text/csv' })
      await user.upload(dropzone, file)
      
      expect(screen.getByText('my-data.csv')).toBeInTheDocument()
      expect(screen.queryByText(/only csv files allowed/i)).not.toBeInTheDocument()
    })

    it('allows browsing for files via button', () => {
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const browseButton = screen.getByRole('button', { name: /browse files/i })
      expect(browseButton).toBeInTheDocument()
    })

    it('shows proper file input for accessibility', () => {
      render(<CSVImportModal isOpen={true} onClose={mockOnClose} />)
      
      const fileInput = screen.getByLabelText(/csv file/i)
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveAttribute('accept', '.csv,text/csv')
    })
  })

  describe('Modal Behavior', () => {
    it('does not render when closed', () => {
      render(<CSVImportModal isOpen={false} onClose={mockOnClose} />)
      
      expect(screen.queryByText(/drop.*csv.*here/i)).not.toBeInTheDocument()
    })
  })
})