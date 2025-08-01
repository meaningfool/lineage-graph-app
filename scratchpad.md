# CSV Import Feature - User-Centric Development Plan

## COMPLETED ITERATIONS (✅)

### ✅ Phase 1: Basic UI Entry Point (DONE)
**User sees**: Import button on the main canvas
**User can**: Click button to open CSV import modal
**Implementation**: Green "Import CSV" button next to "Generate Graph"

### ✅ Phase 2: File Upload Interface (DONE)
**User sees**: Professional modal with drag & drop file zone
**User can**: Drag & drop or browse for CSV files
**Feedback**: File accepted/rejected messages with visual feedback
**Implementation**: React-dropzone integration with shadcn/ui modal

### ✅ Phase 3: Basic CSV Validation (DONE)
**User sees**: Real-time validation with processing states and detailed error messages
**User can**: See if their CSV is valid format with specific error types
**Errors shown**: Empty file, malformed CSV, parsing errors
**Success feedback**: Row count and file confirmation
**Implementation**: PapaParse integration with comprehensive validation

## NEXT ITERATIONS (📋)

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

## CURRENT TECHNICAL IMPLEMENTATION (✅)

### Libraries Integrated
- ✅ **@radix-ui/react-dialog** - Professional modal system
- ✅ **react-dropzone** - Drag & drop file upload with validation  
- ✅ **PapaParse** - Robust CSV parsing and validation
- ✅ **shadcn/ui** - Consistent UI components (Dialog, Button)
- ✅ **Lucide React** - Professional icons (Upload, FileText, AlertCircle, Loader2)

### Current State Management
- ✅ **File upload state**: uploadedFile, error, isProcessing
- ✅ **Parse results**: parseResult with data, meta, and errors
- ✅ **Validation pipeline**: Async CSV processing with user feedback
- ✅ **Error categorization**: Empty file, format errors, parsing errors

### Implemented File Processing Pipeline
1. ✅ **File validation** (type: CSV only, dropzone rejection)
2. ✅ **CSV parsing** (PapaParse with header detection)
3. ✅ **Format validation** (empty file, malformed CSV detection)
4. ✅ **Success feedback** (row count, file confirmation)
5. 🔄 **Structure validation** (NEXT: domain-specific validation)
6. 🔄 **Graph construction** (NEXT: convert to lineage graph)
7. 🔄 **Import to canvas** (NEXT: replace current graph)

### Test Coverage Achieved
- ✅ **16 total tests passing** (12 component + 4 E2E)
- ✅ **Manual test files** in `/test-csv-files/` directory
- ✅ **Comprehensive validation scenarios** covered

## CONTEXT CONTINUATION SUMMARY

### What We've Built (4 Complete Iterations)
1. ✅ **Import Button** - Added green "Import CSV" button to main page with coming soon functionality
2. ✅ **Modal System** - Professional dialog with open/close functionality using Radix UI
3. ✅ **File Drop Zone** - Drag & drop CSV upload with react-dropzone integration
4. ✅ **CSV Validation** - Comprehensive parsing and validation with PapaParse

### Current State
- **Fully functional CSV import modal** with professional UX
- **Robust validation system** handling all CSV edge cases
- **16 passing tests** covering all functionality
- **Manual test files** for validation verification
- **Clean codebase** following TDD workflow with separate commits

### Ready for Next Development Session
- **Dual file upload** (nodes + edges CSV files)
- **Column detection and mapping** UI
- **Domain-specific validation** for lineage graph data
- **Graph construction** from validated CSV data
- **Canvas integration** to replace current graph

### Key Files
- `apps/web/src/components/csv-import-modal.tsx` - Main modal component
- `apps/web/src/components/ui/dialog.tsx` - Reusable dialog component
- `apps/web/src/components/__tests__/csv-import-modal.test.tsx` - Component tests
- `tests/e2e/csv-import-modal.spec.ts` - E2E tests
- `test-csv-files/` - Manual testing files with README

### Development Workflow Established
- **Strict TDD**: RED (failing tests) → GREEN (implementation) → Commit
- **Separate commits**: Tests and implementation committed separately
- **User approval**: Always ask for commit permission
- **Iterative approach**: Small, testable increments with user value