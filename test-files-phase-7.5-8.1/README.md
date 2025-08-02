# Test Files for Phase 7.5 & 8.1 Validation

This directory contains comprehensive test files to verify the Phase 7.5 (Complete Data Validation) and Phase 8.1 (Graph Structure Validation) implementations.

## Test Scenarios

### Phase 7.5 - Complete Data Validation
- **Required Fields Validation**: Missing IDs, titles, sources, targets
- **Node Type Validation**: Invalid types, case sensitivity
- **Duplicate ID Detection**: Multiple nodes with same ID
- **Edge Reference Validation**: Orphaned edges referencing missing nodes

### Phase 8.1 - Graph Structure Validation
- **INPUT Node Connectivity**: INPUT nodes without outgoing connections (warnings)
- **OUTPUT Node Connectivity**: OUTPUT nodes without incoming connections (warnings)
- **STEP Node Connectivity**: STEP nodes with incomplete connections (critical errors)
- **Mixed Scenarios**: Valid graphs with warnings vs critical errors

## How to Test

1. Start the development server: `pnpm dev`
2. Open http://localhost:3001
3. Click "Import CSV" button
4. Upload the test files provided in this directory
5. Navigate through the import process to see validation results

## Expected Behavior

- **Critical Errors**: Should disable the Import button and show red error messages
- **Warnings**: Should allow import with yellow warning messages
- **Success Cases**: Should enable import with green success indicators