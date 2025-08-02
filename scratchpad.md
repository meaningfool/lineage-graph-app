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

### ✅ Phase 4: Dual File Upload System (DONE)
**User sees**: Two separate drop zones for nodes and edges CSV files
**User can**: Upload both required files with individual validation
**Feedback**: File status summary showing upload progress for each file
**Implementation**: Dual dropzone system with separate state management

### ✅ Phase 5: Column Detection & Preview (DONE)
**User sees**: Detected columns displayed as color-coded badges with row counts
**User can**: Review parsed column structure and navigate between steps
**Feedback**: Clear visualization of detected columns and data preview
**Implementation**: Step-based navigation with column parsing and preview UI

### ✅ Phase 6: Column Mapping Interface (DONE)
**User sees**: Dropdown selectors for mapping CSV columns to required fields
**User can**: Map columns with intelligent auto-detection and manual override
**Feedback**: Real-time validation and clear error messages for missing mappings
**Implementation**: Smart auto-detection algorithm with validation and dropdown mapping interface

### ✅ Phase 7: Data Format Validation (DONE)
**User sees**: Detailed validation results for data format and structure
**User can**: Understand what's wrong with their data before import
**Errors shown**: Missing required fields, invalid node types, duplicate IDs, orphaned edges
**Feedback**: Clear categorization of critical errors vs warnings
**Implementation**: Comprehensive validation system with Mini-Iterations 7.1-7.5 completed

### ✅ Phase 8.1: Graph Structure Validation (DONE)
**User sees**: Graph connectivity validation with lineage-specific rules
**User can**: Understand graph structure issues before import
**Errors shown**: Isolated INPUT/OUTPUT nodes (warnings), orphaned STEP nodes (critical errors)
**Feedback**: Critical errors block import, warnings allow import with notification
**Implementation**: Node connectivity validation with severity levels (critical/warning)

## NEXT ITERATIONS (📋)

### Phase 7.6: UX Improvements & ID Strategy Refinement
**User sees**: Streamlined workflow without redundant column detection step
**User can**: Go directly from upload to mapping with auto-generated node IDs
**Changes**: Remove column detection screen, implement auto-ID generation from title column
**Strategy**: Always generate internal IDs from title column (ignore user-provided ID columns)

### Phase 8: Graph Preview & Import
**User sees**: Preview of the actual graph that will be imported to canvas
**User can**: See visual representation of nodes and edges before import
**Actions**: Import to canvas, download validation report, adjust settings
**Preview**: Mini graph visualization showing structure and connections

### Phase 9: Advanced Error Recovery & Partial Import
**User sees**: Options to import valid subgraph despite some data errors
**User can**: Choose to import partial data, exclude problematic rows, fix and re-upload
**Features**: Non-blocking validation, smart data extraction, error filtering
**Recovery**: Automatic orphaned edge removal, duplicate resolution

## DETAILED TDD IMPLEMENTATION PLANS - PROGRESSIVE APPROACH

### Phase 7.6 - UX Improvements & ID Strategy Refinement

#### Mini-Iteration 7.6A: Remove Column Detection Screen

**RED Phase 7.6A-1: Update Navigation Flow**
**File**: `apps/web/src/components/csv-import-modal.tsx`
**Test Type**: E2E Test

**Tests to update in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Streamlined Navigation', () => {
  it('should navigate directly from upload to mapping step', () => {
    // Given: successful dual file upload
    // When: files are validated and parsed
    // Then: should skip column detection and go directly to step 2 (mapping)
  })

  it('should remove column detection UI elements', () => {
    // Given: CSV import modal opened with files uploaded
    // When: navigation occurs
    // Then: should not display column badges or detection step
  })
})
```

**GREEN Phase 7.6A-2: Implement Streamlined Navigation**
- Remove column detection step from navigation flow
- Update step indicators to show: Upload → Mapping → Validation
- Remove column badge UI and related state management

#### Mini-Iteration 7.6B: Auto-Generated ID Strategy

**RED Phase 7.6B-1: ID Generation Logic**
**File**: `apps/web/src/utils/id-generation.ts`
**Test Type**: Unit Test

**Tests to write in id-generation.test.ts:**
```typescript
describe('generateNodeIds', () => {
  it('should generate IDs from title column using slugify', () => {
    // Given: nodes array with title values like "User Count", "Total Revenue"
    // When: generateNodeIds called
    // Then: should return nodes with id: "user-count", "total-revenue"
  })

  it('should handle duplicate titles by adding numeric suffixes', () => {
    // Given: nodes with duplicate titles "User Count", "User Count"
    // When: generateNodeIds called
    // Then: should generate "user-count", "user-count-2"
  })

  it('should preserve original data while adding generated IDs', () => {
    // Given: nodes with various CSV columns
    // When: generateNodeIds called
    // Then: should add 'id' field without modifying other properties
  })
})
```

**GREEN Phase 7.6B-2: Implement ID Generation**
- Create generateNodeIds function with slugify logic
- Add duplicate handling with numeric suffixes
- Integrate with existing CSV processing pipeline

**RED Phase 7.6B-3: Update Column Mapping UI**
**File**: `apps/web/src/components/csv-import-modal.tsx`
**Test Type**: E2E Test

**Tests to update in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Auto-Generated IDs', () => {
  it('should not show ID column mapping option', () => {
    // Given: CSV import at mapping step
    // When: mapping interface loads
    // Then: should not display "Node ID" dropdown selector
  })

  it('should show auto-generation notice for IDs', () => {
    // Given: mapping step loaded
    // When: user views mapping interface
    // Then: should display "Node IDs will be auto-generated from title column"
  })

  it('should preview generated IDs in validation step', () => {
    // Given: completed mapping with title column selected
    // When: validation step loads
    // Then: should show "Generated IDs: user-count, total-revenue, ..." preview
  })
})
```

**GREEN Phase 7.6B-4: Update Column Mapping Interface**
- Remove ID column mapping dropdown from nodes mapping
- Add informational text about auto-generated IDs
- Update validation step to show generated ID preview

### Phase 7 - Data Format Validation (Progressive Mini-Iterations) - COMPLETED ✅

#### Mini-Iteration 7.1: Required Fields Validation

**RED Phase 7.1A: Required Fields Validation Logic**
**File**: `apps/web/src/utils/csv-validation.ts`
**Test Type**: Unit Test

**Tests to write in csv-validation.test.ts:**
```typescript
describe('validateRequiredFields', () => {
  it('should detect missing node ID with specific node identification', () => {
    // Given: nodes array with node at index 1 missing 'id' field
    // When: validateRequiredFields(nodes, 'nodes') called
    // Then: should return { 
    //   isValid: false, 
    //   errors: [{ 
    //     type: 'MISSING_REQUIRED_FIELD',
    //     severity: 'critical',
    //     message: 'Node at row 2 is missing required field: id',
    //     rowIndex: 1,
    //     field: 'id',
    //     dataType: 'nodes'
    //   }]
    // }
  })

  it('should detect missing node title with row identification', () => {
    // Given: nodes array with node at index 0 having empty 'title' field
    // When: validateRequiredFields called
    // Then: should return error with rowIndex: 0, field: 'title'
  })

  it('should detect missing edge source field', () => {
    // Given: edges array with edge at index 2 missing 'source' field  
    // When: validateRequiredFields(edges, 'edges') called
    // Then: should return error with message 'Edge at row 3 is missing required field: source'
  })

  it('should detect missing edge target field', () => {
    // Given: edges array with edge missing 'target' field
    // When: validateRequiredFields called
    // Then: should return appropriate error with field identification
  })

  it('should return success when all required fields present', () => {
    // Given: valid nodes and edges with all required fields
    // When: validateRequiredFields called
    // Then: should return { isValid: true, errors: [] }
  })
})
```

**Expected**: Tests fail - validateRequiredFields function doesn't exist

**GREEN Phase 7.1B: Implement Required Fields Validation**
- Create validateRequiredFields function with detailed error reporting
- Add ValidationError interface with rowIndex, field, dataType
- Implement specific error messages with row identification

**RED Phase 7.1C: Required Fields UI Integration**
**File**: `apps/web/src/components/csv-import-modal.tsx`
**Test Type**: E2E Test

**Tests to write in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Required Fields Validation', () => {
  it('should show specific missing field errors in validation step', () => {
    // Given: CSV with node missing 'id' at row 2
    // When: user reaches validation step
    // Then: should display "Node at row 2 is missing required field: id"
  })

  it('should prevent import when required fields missing', () => {
    // Given: validation shows missing required fields
    // When: validation step loads
    // Then: Import button should be disabled with message "Fix required field errors"
  })
})
```

**Expected**: Tests fail - validation step doesn't show field-specific errors

**GREEN Phase 7.1D: Implement Required Fields UI**
- Add validateRequiredFields integration to validation step
- Display specific field errors with row numbers
- Disable import when required field errors exist

#### Mini-Iteration 7.2: Node Type Validation

**RED Phase 7.2A: Node Type Validation Logic**
**File**: `apps/web/src/utils/csv-validation.ts`  
**Test Type**: Unit Test

**Tests to write in csv-validation.test.ts:**
```typescript
describe('validateNodeTypes', () => {
  it('should detect invalid node type with specific node identification', () => {
    // Given: node at index 1 with type 'PROCESSING' (invalid)
    // When: validateNodeTypes called
    // Then: should return error {
    //   type: 'INVALID_NODE_TYPE', 
    //   message: 'Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT',
    //   rowIndex: 1,
    //   invalidValue: 'PROCESSING',
    //   validValues: ['INPUT', 'STEP', 'OUTPUT']
    // }
  })

  it('should handle case-insensitive type validation', () => {
    // Given: node with type 'input' (lowercase)
    // When: validateNodeTypes called
    // Then: should normalize to 'INPUT' and pass validation
  })

  it('should return success for valid node types', () => {
    // Given: nodes with types ['INPUT', 'STEP', 'OUTPUT']
    // When: validateNodeTypes called
    // Then: should return { isValid: true, errors: [] }
  })
})
```

**Expected**: Tests fail - validateNodeTypes function doesn't exist

**GREEN Phase 7.2B: Implement Node Type Validation**
- Create validateNodeTypes with case-insensitive validation
- Add type normalization logic
- Include valid values in error messages

**RED Phase 7.2C: Node Type UI Integration**
**Test Type**: E2E Test

**Tests to write in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Node Type Validation', () => {
  it('should show invalid node type errors with suggestions', () => {
    // Given: CSV with invalid node type 'PROCESSING'
    // When: validation step loads
    // Then: should show "Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT"
  })
})
```

**GREEN Phase 7.2D: Implement Node Type UI**
- Integrate validateNodeTypes into validation step
- Display type errors with valid options

#### Mini-Iteration 7.3: Duplicate Node ID Detection

**RED Phase 7.3A: Duplicate Detection Logic**
**Test Type**: Unit Test

**Tests to write in csv-validation.test.ts:**
```typescript
describe('validateDuplicateNodeIds', () => {
  it('should detect duplicate node IDs with all affected rows', () => {
    // Given: nodes with duplicate ID 'user-count' at rows 1 and 4
    // When: validateDuplicateNodeIds called
    // Then: should return error {
    //   type: 'DUPLICATE_NODE_ID',
    //   message: 'Duplicate node ID "user-count" found at rows: 2, 5',
    //   duplicateId: 'user-count',
    //   rowIndexes: [1, 4]
    // }
  })

  it('should detect multiple sets of duplicates', () => {
    // Given: multiple duplicate IDs in dataset
    // When: validateDuplicateNodeIds called
    // Then: should return separate error for each duplicate set
  })
})
```

**GREEN Phase 7.3B: Implement Duplicate Detection**
- Create validateDuplicateNodeIds with all affected rows
- Group duplicates and report all occurrences

**RED Phase 7.3C: Duplicate Detection UI**
**Test Type**: E2E Test

**Tests to write in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Duplicate ID Validation', () => {
  it('should show duplicate ID errors with all affected rows', () => {
    // Given: CSV with duplicate node IDs
    // When: validation step loads
    // Then: should display "Duplicate node ID 'user-count' found at rows: 2, 5"
  })
})
```

**GREEN Phase 7.3D: Implement Duplicate Detection UI**
- Integrate duplicate detection into validation step
- Display all affected rows for each duplicate

#### Mini-Iteration 7.4: Edge Reference Validation

**RED Phase 7.4A: Edge Reference Logic**
**Test Type**: Unit Test

**Tests to write in csv-validation.test.ts:**
```typescript
describe('validateEdgeReferences', () => {
  it('should detect orphaned edge with missing source node', () => {
    // Given: edge at row 2 with source 'missing-node' not in nodes
    // When: validateEdgeReferences called
    // Then: should return error {
    //   type: 'ORPHANED_EDGE_SOURCE',
    //   message: 'Edge at row 3 references missing source node: missing-node',
    //   rowIndex: 2,
    //   missingNodeId: 'missing-node'
    // }
  })

  it('should detect orphaned edge with missing target node', () => {
    // Given: edge with target node not found
    // When: validateEdgeReferences called  
    // Then: should return appropriate error with target identification
  })
})
```

**GREEN Phase 7.4B: Implement Edge Reference Validation**
- Create validateEdgeReferences with specific node identification
- Check both source and target references

**RED Phase 7.4C: Edge Reference UI**
**Test Type**: E2E Test

**GREEN Phase 7.4D: Implement Edge Reference UI**
- Integrate edge reference validation
- Display missing node references clearly

#### Mini-Iteration 7.5: Validation Integration & UI

**RED Phase 7.5A: Complete Validation Integration**
**Test Type**: E2E Test

**Tests to write in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Complete Data Validation', () => {
  it('should run all validations and display categorized results', () => {
    // Given: CSV with multiple validation issues
    // When: validation step loads
    // Then: should show "Critical Errors (3)", "Warnings (1)" sections
    // And: should list all specific errors by category
  })

  it('should enable import only when no critical errors exist', () => {
    // Given: validation with warnings but no critical errors
    // When: validation completes
    // Then: Import button should be enabled with warning message
  })
})
```

**GREEN Phase 7.5B: Complete Validation System**
- Integrate all validation functions
- Create comprehensive validation step UI
- Add step 4 to CSV import modal

### Phase 8 - Graph Structure Validation & Preview

#### Mini-Iteration 8.1: Graph Structure Validation (Lineage Graph Semantics)

**RED Phase 8.1A: Node Connectivity Validation Logic**
**File**: `apps/web/src/utils/graph-structure-validation.ts`
**Test Type**: Unit Test

**Tests to write in graph-structure-validation.test.ts:**
```typescript
describe('validateNodeConnectivity', () => {
  it('should detect INPUT nodes without outgoing edges', () => {
    // Given: INPUT node with no outgoing edges in edge list
    // When: validateNodeConnectivity called
    // Then: should return warning {
    //   type: 'INPUT_NO_OUTGOING',
    //   severity: 'warning',
    //   message: 'INPUT node "raw-data" at row 1 has no outgoing connections',
    //   nodeId: 'raw-data',
    //   nodeType: 'INPUT'
    // }
  })

  it('should detect OUTPUT nodes without incoming edges', () => {
    // Given: OUTPUT node with no incoming edges
    // When: validateNodeConnectivity called
    // Then: should return warning for OUTPUT node isolation
  })

  it('should detect STEP nodes without both incoming and outgoing edges', () => {
    // Given: STEP node missing either incoming or outgoing connections
    // When: validateNodeConnectivity called
    // Then: should return critical error for incomplete STEP node
  })

  it('should detect completely orphaned nodes', () => {
    // Given: node with no connections at all
    // When: validateNodeConnectivity called
    // Then: should return critical error for isolated node
  })
})
```

**Expected**: Tests fail - validateNodeConnectivity function doesn't exist

**GREEN Phase 8.1B: Implement Graph Structure Validation**
- Create validateNodeConnectivity with lineage-specific rules
- Add severity levels (critical vs warning) for different violations
- Implement connectivity analysis logic

**RED Phase 8.1C: Graph Structure UI Integration**
**Test Type**: E2E Test

**Tests to write in csv-import-modal.test.tsx:**
```typescript
describe('CSV Import Modal - Graph Structure Validation', () => {
  it('should show connectivity warnings for isolated nodes', () => {
    // Given: CSV with INPUT node having no outgoing edges
    // When: graph structure validation runs
    // Then: should display "Warning: INPUT node 'raw-data' has no outgoing connections"
  })

  it('should allow import with connectivity warnings', () => {
    // Given: graph structure validation shows warnings only
    // When: validation completes
    // Then: Import button should be enabled with "Import with warnings" text
  })
})
```

**GREEN Phase 8.1D: Implement Graph Structure UI**
- Integrate graph structure validation into validation step
- Display connectivity warnings with appropriate severity

#### Mini-Iteration 8.2: CSV to Graph Conversion

**RED Phase 8.2A: Graph Construction Logic**
**File**: `apps/web/src/utils/csv-to-graph.ts`
**Test Type**: Unit Test

**Tests to write in csv-to-graph.test.ts:**
```typescript
describe('createGraphFromCSV', () => {
  it('should create LineageGraph from validated CSV data', () => {
    // Given: valid nodes and edges CSV data with column mappings
    // When: createGraphFromCSV called
    // Then: should return LineageGraph instance with correct node count
  })

  it('should convert CSV rows to graph nodes with proper types', () => {
    // Given: nodes CSV with id, title, type columns mapped
    // When: createGraphFromCSV called
    // Then: should create nodes with correct NodeType (INPUT/STEP/OUTPUT)
  })

  it('should preserve additional CSV columns as node properties', () => {
    // Given: CSV with extra columns like "description", "owner"
    // When: createGraphFromCSV called  
    // Then: should include extra properties in node.data
  })
})
```

**GREEN Phase 8.2B: Implement Graph Construction**
- Create createGraphFromCSV function
- Add CSV data transformation logic
- Integrate with existing LineageGraph class

#### Mini-Iteration 8.3: Graph Preview Component

**RED Phase 8.3A: Mini Graph Preview Logic**
**File**: `apps/web/src/components/mini-graph-preview.tsx`
**Test Type**: Unit Test

**Tests to write in mini-graph-preview.test.tsx:**
```typescript
describe('MiniGraphPreview', () => {
  it('should render preview graph with correct stats', () => {
    // Given: LineageGraph with 5 nodes and 4 edges
    // When: MiniGraphPreview rendered
    // Then: should display "5 nodes, 4 connections" summary
  })

  it('should fit preview within modal container', () => {
    // Given: large graph with many nodes
    // When: MiniGraphPreview rendered
    // Then: should scale to fit within 400px container
  })
})
```

**GREEN Phase 8.3B: Implement Graph Preview**
- Create MiniGraphPreview component with ReactFlow
- Add automatic layout and scaling for modal
- Integrate preview into validation step

#### Mini-Iteration 8.4: Canvas Integration

**RED Phase 8.4A: Canvas Import Integration**
**File**: Update main page component
**Test Type**: E2E Test

**Tests to write in page.test.tsx:**
```typescript
describe('CSV Import - Canvas Integration', () => {
  it('should replace current graph when import confirmed', () => {
    // Given: completed CSV import with preview
    // When: user clicks "Import to Canvas"
    // Then: should replace canvas graph with imported data
  })

  it('should show success notification after import', () => {
    // Given: successful graph import
    // When: import completes
    // Then: should display "Graph imported successfully" message
  })
})
```

**GREEN Phase 8.4B: Complete Canvas Integration**
- Add graph replacement logic to main component
- Implement success feedback and modal cleanup
- Complete import workflow

### Phase 9 - Advanced Error Recovery & Partial Import

#### Mini-Iteration 9.1: Error Recovery Options

**RED Phase 9.1A: Recovery Options Logic**
**File**: `apps/web/src/components/error-recovery-options.tsx`
**Test Type**: Unit Test

**Tests to write in error-recovery-options.test.tsx:**
```typescript
describe('ErrorRecoveryOptions', () => {
  it('should calculate recovery options from validation errors', () => {
    // Given: validation results with multiple error types
    // When: ErrorRecoveryOptions processes errors
    // Then: should offer specific recovery strategies per error type
  })

  it('should preview impact of recovery choices', () => {
    // Given: recovery options selected
    // When: impact calculation runs
    // Then: should show "Original: 10 nodes" vs "After cleanup: 7 nodes"
  })
})
```

**GREEN Phase 9.1B: Implement Error Recovery**
- Create ErrorRecoveryOptions component
- Add recovery strategy calculation logic
- Implement impact preview functionality

#### Mini-Iteration 9.2: Partial Import System

**RED Phase 9.2A: Data Filtering Logic**
**Test Type**: Unit Test

**Tests to write in csv-validation.test.ts:**
```typescript
describe('filterDataByRecoveryOptions', () => {
  it('should exclude problematic rows based on recovery choices', () => {
    // Given: CSV data with validation errors and recovery options
    // When: filterDataByRecoveryOptions called
    // Then: should return cleaned dataset excluding selected error rows
  })

  it('should maintain referential integrity after filtering', () => {
    // Given: filtering that removes nodes
    // When: filterDataByRecoveryOptions called
    // Then: should automatically remove orphaned edges
  })
})
```

**GREEN Phase 9.2B: Implement Partial Import**
- Create data filtering logic based on recovery options
- Add referential integrity maintenance
- Implement import summary reporting

#### Mini-Iteration 9.3: Advanced Merge Capabilities

**RED Phase 9.3A: Merge Detection Logic**
**Test Type**: Unit Test

**Tests to write in csv-merge.test.ts:**
```typescript
describe('detectMergeConflicts', () => {
  it('should detect duplicate node IDs between current and new data', () => {
    // Given: existing graph and new CSV with overlapping node IDs
    // When: detectMergeConflicts called
    // Then: should return conflict details with resolution options
  })
})
```

**GREEN Phase 9.3B: Implement Merge System**
- Create merge conflict detection
- Add conflict resolution UI
- Complete advanced import workflow

