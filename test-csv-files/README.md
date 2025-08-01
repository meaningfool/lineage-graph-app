# CSV Import Test Files

This directory contains comprehensive test CSV files for manually testing the complete CSV import workflow with Phase 7 validation.

## 🎯 Complete Testing Workflow

### Step 1: Basic File Upload Testing
Test the basic file upload and parsing functionality.

### Step 2: Column Detection Testing  
Test column detection and mapping with various column name patterns.

### Step 3: Data Format Validation Testing (Phase 7)
Test all validation scenarios implemented in Phase 7:
- Required fields validation
- Node type validation  
- Duplicate node ID detection
- Edge reference validation

## 📁 Test File Categories

### ✅ VALID TEST CASES (Should Pass All Validation)

#### `valid-basic-nodes.csv` & `valid-basic-edges.csv`
- **Purpose**: Basic valid workflow test
- **Expected Result**: ✅ All validation passes, Import button enabled
- **Tests**: Standard column names auto-detection, valid data

#### `valid-custom-columns-nodes.csv` & `valid-custom-columns-edges.csv`  
- **Purpose**: Test custom column names with manual mapping
- **Expected Result**: ✅ Manual mapping required, then passes validation
- **Tests**: Non-standard column names, manual mapping workflow

#### `valid-case-insensitive-nodes.csv` & `valid-case-insensitive-edges.csv`
- **Purpose**: Test case-insensitive node type validation
- **Expected Result**: ✅ Node types normalized (input → INPUT), passes validation
- **Tests**: Mixed case node types

### ❌ VALIDATION ERROR TEST CASES (Should Show Specific Errors)

#### Missing Required Fields Tests
- `error-missing-id-nodes.csv` + `valid-basic-edges.csv`
- `error-missing-title-nodes.csv` + `valid-basic-edges.csv`  
- `valid-basic-nodes.csv` + `error-missing-source-edges.csv`
- `valid-basic-nodes.csv` + `error-missing-target-edges.csv`

#### Invalid Node Type Tests
- `error-invalid-types-nodes.csv` + `valid-basic-edges.csv`

#### Duplicate Node ID Tests  
- `error-duplicate-ids-nodes.csv` + `valid-basic-edges.csv`

#### Orphaned Edge Tests
- `valid-basic-nodes.csv` + `error-orphaned-edges.csv`

#### Multiple Error Tests
- `error-multiple-issues-nodes.csv` + `error-multiple-issues-edges.csv`

### 🚫 FILE FORMAT ERROR TEST CASES (Should Fail Before Validation)

#### `error-empty.csv`
- **Purpose**: Test empty file detection
- **Expected Result**: ❌ "File is empty" error

#### `error-malformed.csv`
- **Purpose**: Test malformed CSV parsing
- **Expected Result**: ❌ "Invalid CSV format" error

## 🧪 Testing Instructions

### Complete Workflow Test
1. **Start Server**: `pnpm dev`
2. **Open App**: http://localhost:3001
3. **Click**: "Import CSV" button

### Test Each Scenario:

#### ✅ **Success Path Test**
```
Files: valid-basic-nodes.csv + valid-basic-edges.csv
Expected Flow:
1. Upload → Both files accepted ✅
2. Column Detection → Shows detected columns ✅  
3. Column Mapping → Auto-detects mappings ✅
4. Validation → "All validation passed" ✅
5. Import → Button enabled ✅
```

#### ❌ **Error Path Tests**
```
Files: error-missing-id-nodes.csv + valid-basic-edges.csv
Expected Flow:
1. Upload → Both files accepted ✅
2. Column Detection → Shows columns ✅
3. Column Mapping → Maps successfully ✅
4. Validation → Shows "Node at row 2 is missing required field: id" ❌
5. Import → Button disabled ❌
```

#### 🔧 **Manual Mapping Test**  
```
Files: valid-custom-columns-nodes.csv + valid-custom-columns-edges.csv
Expected Flow:
1. Upload → Both files accepted ✅
2. Column Detection → Shows custom column names ✅
3. Column Mapping → Requires manual mapping ⚙️
4. Validation → Passes after proper mapping ✅
5. Import → Button enabled ✅
```

### Expected Validation Messages

#### ✅ Success Messages
- "All nodes validation passed"
- "All edges validation passed"  
- Import button: **Enabled**

#### ❌ Error Messages (Examples)
- "Node at row 2 is missing required field: id"
- "Node at row 3 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT"  
- "Duplicate node ID \"user-count\" found at rows: 1, 3"
- "Edge at row 2 references missing source node: missing-node"
- Import button: **Disabled**
- "Fix required field errors" message shown

## 📊 Test Coverage Matrix

| Test Scenario | Files | Expected Result |
|---------------|-------|----------------|
| **Basic Valid** | valid-basic-* | ✅ Import enabled |
| **Custom Columns** | valid-custom-* | ⚙️ Manual mapping → ✅ |
| **Case Insensitive** | valid-case-* | ✅ Types normalized |
| **Missing ID** | error-missing-id-* | ❌ Row-specific error |
| **Missing Title** | error-missing-title-* | ❌ Row-specific error |
| **Missing Source** | error-missing-source-* | ❌ Row-specific error |
| **Missing Target** | error-missing-target-* | ❌ Row-specific error |
| **Invalid Types** | error-invalid-types-* | ❌ Type suggestions shown |
| **Duplicate IDs** | error-duplicate-ids-* | ❌ All rows listed |
| **Orphaned Edges** | error-orphaned-* | ❌ Missing nodes identified |
| **Multiple Errors** | error-multiple-* | ❌ All errors shown |
| **Empty File** | error-empty.csv | ❌ File format error |
| **Malformed** | error-malformed.csv | ❌ CSV parsing error |

## 🔍 Debugging Tips

- **Check Console**: Open browser dev tools for detailed logs
- **Error Details**: Each error shows exact row number and field
- **Navigation**: Use Back button to fix file issues and retry
- **Step-by-Step**: Each step must pass before proceeding to next

## 📈 Success Criteria

✅ **File Upload**: Both nodes + edges files accepted  
✅ **Column Detection**: Shows all detected columns with row counts  
✅ **Column Mapping**: Auto-detection works OR manual mapping successful  
✅ **Validation**: Specific, actionable error messages OR validation success  
✅ **Import Control**: Button properly enabled/disabled based on validation  

This test suite validates the complete Phase 7 implementation with comprehensive data format validation!