# 🚀 Quick Test Guide

## Start Testing in 30 Seconds

1. **Start Server**: `pnpm dev`
2. **Open**: http://localhost:3001  
3. **Click**: "Import CSV" button

## 📋 Essential Tests (5 minutes)

### ✅ **HAPPY PATH** (Should work perfectly)
```
Files: valid-basic-nodes.csv + valid-basic-edges.csv
Flow: Upload → Column Detection → Auto-Mapping → Validation ✅ → Import Ready
```

### ❌ **ERROR EXAMPLES** (Should show specific errors)

#### Missing Required Field
```
Files: error-missing-id-nodes.csv + valid-basic-edges.csv  
Error: "Node at row 2 is missing required field: id"
```

#### Invalid Node Type  
```
Files: error-invalid-types-nodes.csv + valid-basic-edges.csv
Error: "Node at row 2 has invalid type: PROCESSING. Must be INPUT, STEP, or OUTPUT"  
```

#### Duplicate Node IDs
```
Files: error-duplicate-ids-nodes.csv + valid-basic-edges.csv
Error: "Duplicate node ID \"user-count\" found at rows: 1, 3"
```

#### Orphaned Edges
```
Files: valid-basic-nodes.csv + error-orphaned-edges.csv  
Error: "Edge at row 2 references missing source node: missing-node"
```

### 🔧 **MANUAL MAPPING** (Tests column detection)
```
Files: valid-custom-columns-nodes.csv + valid-custom-columns-edges.csv
Flow: Upload → Column Detection → Manual Mapping Required → Validation ✅
```

## 🎯 What to Look For

### ✅ **Success Indicators**
- Green checkmarks ✅
- "All nodes validation passed"  
- "All edges validation passed"
- **Import button ENABLED**

### ❌ **Error Indicators**  
- Red X marks ❌
- Specific error messages with row numbers
- "Critical Errors (N)" counts
- **Import button DISABLED**
- "Fix required field errors" message

## 🐛 Quick Debug

**Import button disabled?** → Check validation step for specific errors  
**Column mapping stuck?** → Try manual mapping for custom column names  
**File won't upload?** → Check file format (CSV only, not empty, not malformed)

## 🏆 Success = You Can Navigate the Full Workflow

Upload Files → See Columns → Map Fields → Review Validation → Ready to Import!

Each step should provide clear feedback and guide you to the next step or show you exactly what needs to be fixed.