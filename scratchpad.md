# CSV Import Feature - User-Centric Development Plan

## High-Level Development Flow

### Phase 1: Basic UI Entry Point
**User sees**: Import button on the main canvas
**User can**: Click button (shows "coming soon" or opens empty modal)

### Phase 2: File Upload Interface
**User sees**: Modal/popup with file drop zones
**User can**: Drag & drop or browse for CSV files
**Feedback**: File accepted/rejected messages

### Phase 3: Basic CSV Validation
**User sees**: Success or error messages after file upload
**User can**: See if their CSV is valid format
**Errors shown**: File type, empty file, malformed CSV

### Phase 4: Dual File Upload
**User sees**: Two drop zones (nodes & edges)
**User can**: Upload both required files
**Feedback**: Which file is missing, both files ready

### Phase 5: Column Detection & Display
**User sees**: List of columns found in each CSV
**User can**: See preview of their data structure
**Feedback**: Column count, sample data

### Phase 6: Column Mapping Interface
**User sees**: Dropdowns to map columns to required fields
**User can**: Select which columns to use for ID, title, type
**Feedback**: Mapping validation, missing required mappings

### Phase 7: Data Validation & Error Reporting
**User sees**: Detailed validation results
**User can**: Understand what's wrong with their data
**Errors shown**: Invalid types, missing references, duplicates

### Phase 8: Graph Preview & Import
**User sees**: Preview of valid graph that can be imported
**User can**: See what will be imported vs excluded
**Actions**: Import to canvas, download error report

### Phase 9: Advanced Error Recovery
**User sees**: Extracted valid subgraph despite errors
**User can**: Import partial data, fix and re-upload
**Features**: Non-blocking validation, smart extraction

## Detailed Implementation Plan

### Iteration 1: Add Import Button

#### RED Phase - Test First
```typescript
// apps/web/src/app/__tests__/page.test.tsx
test('displays CSV import button on page', async () => {
  render(<Home />)
  const importButton = screen.getByRole('button', { name: /import csv/i })
  expect(importButton).toBeInTheDocument()
})

test('shows coming soon message when import button clicked', async () => {
  render(<Home />)
  const importButton = screen.getByRole('button', { name: /import csv/i })
  await userEvent.click(importButton)
  expect(screen.getByText(/csv import coming soon/i)).toBeInTheDocument()
})
```

#### GREEN Phase - Implementation
- Add button to main page
- Show toast/alert on click
- Position button appropriately (floating action button?)

### Iteration 2: Basic Modal/Popup

#### RED Phase - Test First
```typescript
// E2E test
test('opens import modal when button clicked', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Import CSV")')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Import Graph from CSV')).toBeVisible()
})

test('closes modal when cancel clicked', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Import CSV")')
  await page.click('button:has-text("Cancel")')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})
```

#### GREEN Phase - Implementation
- Create modal component
- Wire up open/close logic
- Add title and cancel button

### Iteration 3: Single File Drop Zone

#### RED Phase - Test First
```typescript
// Component test
test('accepts CSV file drop', async () => {
  render(<CSVImportModal isOpen={true} />)
  const dropzone = screen.getByText(/drop.*csv.*here/i)
  
  const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' })
  await userEvent.upload(dropzone, file)
  
  expect(screen.getByText('test.csv')).toBeInTheDocument()
})

test('rejects non-CSV files', async () => {
  render(<CSVImportModal isOpen={true} />)
  const dropzone = screen.getByText(/drop.*csv.*here/i)
  
  const file = new File(['data'], 'test.txt', { type: 'text/plain' })
  await userEvent.upload(dropzone, file)
  
  expect(screen.getByText(/only csv files allowed/i)).toBeInTheDocument()
})
```

#### GREEN Phase - Implementation
- Integrate react-dropzone
- Configure for CSV only
- Show file name when uploaded
- Display error for wrong file type

### Iteration 4: Basic File Validation

#### RED Phase - Test First
```typescript
test('shows error for empty CSV file', async () => {
  render(<CSVImportModal isOpen={true} />)
  const file = new File([''], 'empty.csv', { type: 'text/csv' })
  await uploadFile(file)
  
  expect(screen.getByText(/file is empty/i)).toBeInTheDocument()
})

test('shows error for malformed CSV', async () => {
  render(<CSVImportModal isOpen={true} />)
  const file = new File(['col1,col2\n"unclosed quote'], 'bad.csv', { type: 'text/csv' })
  await uploadFile(file)
  
  expect(screen.getByText(/invalid csv format/i)).toBeInTheDocument()
})

test('shows success for valid CSV', async () => {
  render(<CSVImportModal isOpen={true} />)
  const file = new File(['col1,col2\nval1,val2'], 'good.csv', { type: 'text/csv' })
  await uploadFile(file)
  
  expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument()
})
```

#### GREEN Phase - Implementation
- Integrate PapaParse
- Parse on file upload
- Show appropriate success/error messages
- Keep errors generic (not domain-specific yet)

## Technical Architecture Notes

### Libraries
- **PapaParse** - CSV parsing
- **react-dropzone** - File upload UI
- **Zod** - Data validation
- **Radix UI Dialog** - Modal component (or similar from shadcn/ui)

### State Management
- Use React state for file upload flow
- Consider reducer for complex validation state
- Store parsed data temporarily in modal component

### Error Handling Strategy
- Categorize errors early (blocking vs non-blocking)
- Consistent error message format
- Accumulate errors for batch display

### File Processing Pipeline
1. File validation (type, size)
2. CSV parsing
3. Structure validation
4. Domain validation
5. Graph construction
6. Import to canvas

## Next Steps After Initial Iterations

Once we have basic file upload working with validation:

5. **Dual file support** - Separate nodes/edges uploads
6. **Column detection** - Show available columns
7. **Column mapping UI** - Let user select columns
8. **Domain validation** - Check node types, references
9. **Graph preview** - Show what will be imported
10. **Smart extraction** - Import valid subset

## Notes for Development

- Keep each iteration small and focused
- Always deliver visible user value
- Build error handling incrementally
- Test user interactions, not implementation details
- Refactor as patterns emerge