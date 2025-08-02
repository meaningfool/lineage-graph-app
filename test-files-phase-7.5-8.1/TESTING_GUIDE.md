# Comprehensive Testing Guide - Phase 7.5 & 8.1 Validation

## Quick Start

1. **Start the development server:**
   ```bash
   cd /Users/josselinperrus/Projects/data-lineage-app
   pnpm dev
   ```

2. **Open the application:**
   - Navigate to http://localhost:3001
   - Click the green "Import CSV" button

3. **Test each scenario below by uploading the corresponding node and edge CSV files**

## Test Scenarios & Expected Results

### 1. Missing Required Fields (`01-missing-required-fields/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ❌ **Import button should be DISABLED**
- 🔴 **Critical Errors should show:**
  - "Node at row 2 is missing required field: title" (empty title)
  - "Node at row 3 has invalid type: INVALID_TYPE. Must be INPUT, STEP, or OUTPUT"
  - "Node at row 4 is missing required field: type" (empty type)
  - "Edge at row 2 is missing required field: source" (empty source)
  - "Edge at row 3 references missing source node: missing-node"

### 2. Duplicate Node IDs (`02-duplicate-node-ids/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ❌ **Import button should be DISABLED**
- 🔴 **Critical Error should show:**
  - "Duplicate node ID 'user-count' found at rows: 2, 4"
- 📊 **Generated IDs Preview should show:** "raw-data", "user-count", "order-data", "user-count-2", "final-metric"

### 3. Orphaned Edges (`03-orphaned-edges/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ❌ **Import button should be DISABLED**  
- 🔴 **Critical Errors should show:**
  - "Edge at row 2 references missing source node: missing-source"
  - "Edge at row 3 references missing target node: missing-target"
  - "Edge at row 4 references missing source node: phantom-node"
  - "Edge at row 4 references missing target node: ghost-node"

### 4. Isolated INPUT Nodes (`04-isolated-input-nodes/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ✅ **Import button should be ENABLED**
- 🟡 **Graph Structure Validation should show WARNING:**
  - "INPUT node 'isolated-input' at row 2 has no outgoing connections"
- ✅ **Should show:** "Warnings (1)" in Graph Structure Validation section

### 5. Isolated OUTPUT Nodes (`05-isolated-output-nodes/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ✅ **Import button should be ENABLED**
- 🟡 **Graph Structure Validation should show WARNING:**
  - "OUTPUT node 'isolated-output' at row 4 has no incoming connections"
- ✅ **Should show:** "Warnings (1)" in Graph Structure Validation section

### 6. Orphaned STEP Nodes (`06-orphaned-step-nodes/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ❌ **Import button should be DISABLED**
- 🔴 **Graph Structure Validation should show CRITICAL ERRORS:**
  - "STEP node 'orphaned-step' at row 3 has no incoming or outgoing connections"
  - "STEP node 'dead-end-step' at row 4 has no outgoing connections"
  - "STEP node 'floating-step' at row 5 has no incoming connections"
- ❌ **Should show:** "Critical Errors (3)" in Graph Structure Validation section

### 7. Mixed Warnings and Errors (`07-mixed-warnings-and-errors/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ❌ **Import button should be DISABLED** (due to critical error)
- 🔴 **Critical Error:**
  - "STEP node 'orphaned-step' at row 4 has no incoming or outgoing connections"
- 🟡 **Warnings:**
  - "INPUT node 'isolated-input' at row 2 has no outgoing connections"
  - "OUTPUT node 'isolated-output' at row 6 has no incoming connections"
- 📊 **Should show both:** "Critical Errors (1)" and "Warnings (2)"

### 8. Warnings Only - Should Allow Import (`08-warnings-only-should-allow-import/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ✅ **Import button should be ENABLED**
- 🟡 **Graph Structure Validation should show WARNINGS only:**
  - "INPUT node 'isolated-input-1' at row 2 has no outgoing connections"
  - "INPUT node 'isolated-input-2' at row 3 has no outgoing connections"
  - "OUTPUT node 'isolated-output-1' at row 6 has no incoming connections"
  - "OUTPUT node 'isolated-output-2' at row 7 has no incoming connections"
- 🟡 **Should show:** "Warnings (4)" with NO critical errors

### 9. Perfect Valid Graph (`09-perfect-valid-graph/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ✅ **Import button should be ENABLED**
- ✅ **All validation sections should show SUCCESS:**
  - "All nodes validation passed" ✅
  - "All edges validation passed" ✅  
  - "All graph structure validation passed" ✅
- 📊 **Generated IDs Preview:** Shows 7 auto-generated IDs
- 🎉 **No errors or warnings anywhere**

### 10. Complex Validation Errors (`10-complex-validation-errors/`)
**What to test:** Upload nodes.csv and edges.csv from this folder

**Expected Results:**
- ❌ **Import button should be DISABLED**
- 🔴 **Multiple types of critical errors:**
  - **Required Fields:** Missing titles and types
  - **Invalid Types:** "INVALID" is not a valid node type
  - **Duplicate IDs:** "duplicate-node" appears twice
  - **Orphaned Edges:** References to non-existent nodes
  - **Graph Structure:** Orphaned STEP node with no connections

## Validation Behavior Summary

| Error Type | Severity | Import Allowed? | Button State | Color |
|------------|----------|-----------------|--------------|-------|
| Missing Required Fields | Critical | ❌ No | Disabled | 🔴 Red |
| Invalid Node Types | Critical | ❌ No | Disabled | 🔴 Red |
| Duplicate Node IDs | Critical | ❌ No | Disabled | 🔴 Red |
| Orphaned Edges | Critical | ❌ No | Disabled | 🔴 Red |
| Orphaned STEP Nodes | Critical | ❌ No | Disabled | 🔴 Red |
| Isolated INPUT Nodes | Warning | ✅ Yes | Enabled | 🟡 Yellow |
| Isolated OUTPUT Nodes | Warning | ✅ Yes | Enabled | 🟡 Yellow |

## Key Features to Verify

### Auto-Generated IDs
- Node IDs are auto-generated from title column using slug format
- Preview shows generated IDs like "raw-user-data", "final-dashboard"
- Duplicates get numeric suffixes: "user-count", "user-count-2"

### Validation Step UI
- **Step 4: Validate Data** appears after column mapping
- Three validation sections: Nodes, Edges, Graph Structure
- Each section shows ✅ success or 🔴/🟡 errors with counts
- Error messages include specific row numbers and field names

### Import Button Logic
- **Disabled** when ANY critical errors exist
- **Enabled** when only warnings exist or no errors
- **Enabled** for perfect valid data

### Error Categorization
- **Critical Errors** block import and show in red
- **Warnings** allow import and show in yellow  
- **Success** shows green checkmarks

## Troubleshooting

If you encounter issues:

1. **Server not responding:** Run `./scripts/ensure-dev-running.sh`
2. **Modal not opening:** Check browser console for errors
3. **Files not uploading:** Ensure files are saved as .csv format
4. **Navigation issues:** Try refreshing the page and starting over

## Additional Test Cases

Feel free to create your own test files by following these patterns:
- **Node CSV:** Must have `title` and `type` columns (ID auto-generated)
- **Edge CSV:** Must have `source` and `target` columns
- **Valid node types:** INPUT, STEP, OUTPUT (case-insensitive)
- **Connectivity rules:** 
  - INPUT should have outgoing connections
  - OUTPUT should have incoming connections
  - STEP must have both incoming AND outgoing connections