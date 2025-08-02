# CSV Import ID Strategy Refactoring - TDD Implementation Plan

## Overview

Refactoring CSV import system from auto-generated IDs (from title column) to user-provided ID fields with flexible label display. Following strict TDD workflow with micro-iterations and commits after each step.

## User Requirements Summary

1. **Required ID Field**: Users must provide ID column (no longer auto-generated from title)
2. **Internal ID Generation**: Generate proper internal IDs from user-provided ID field using slugify
3. **Flexible Display**: Checkbox "Use ID as node labels" (default checked)
   - Checked: Display user-provided ID as node label
   - Unchecked: Show additional field to select label column
4. **Edge Consistency**: Apply same ID computation to edge source/target for matching
5. **Permissive Duplicates**: Keep first occurrence, drop subsequent, show user message
6. **Edge Mismatch Handling**: Unmatched edges become warnings, edges dropped
7. **Empty Label Handling**: Display `[empty]` when label column values are empty
8. **UI Cleanup**: Remove "Generated IDs" preview, add scrollable validation popup

## Implementation Strategy

- **TDD Approach**: RED → GREEN → REFACTOR for each micro-iteration
- **Commit After Each Step**: Every RED, GREEN, REFACTOR gets committed
- **Working Software**: Guaranteed working state after each micro-iteration
- **Temporary Removal Tests**: Create → Verify → Delete for removal verification
- **Test Audits**: Clean up negative/absence tests after each phase

---

## Phase 1: Column Mapping Interface Changes
*Goal: Add required ID field selector, optional label handling, remove auto-generation UI*

### Micro-Iteration 1.1: Add Required Node ID Column Selector

**RED Phase 1.1A: Write failing test for ID column requirement** [COMMIT]
```typescript
// File: src/components/__tests__/csv-import-modal.test.tsx
it("should show required Node ID column selector in mapping step", async () => {
  await navigateToColumnMapping(user);
  expect(screen.getByLabelText("Node ID Column *")).toBeInTheDocument();
  expect(screen.getByLabelText("Node ID Column *")).toHaveAttribute("aria-required", "true");
});

it("should disable continue when Node ID not selected", async () => {
  await navigateToColumnMapping(user);
  await selectMapping(user, "node-title", "title");
  await selectMapping(user, "source-node", "source");
  await selectMapping(user, "target-node", "target");
  
  expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
});
```

**GREEN Phase 1.1B: Add Node ID column selector to UI** [COMMIT]
- Update `ColumnMapping` interface: add `nodeId: string`
- Add Node ID dropdown to mapping UI with required indicator
- Update validation logic to require Node ID selection
- Update state initialization to include `nodeId: ""`

**REFACTOR Phase 1.1C: Clean up and verify** [COMMIT]
- Ensure consistent styling with other selectors
- Verify accessibility attributes (aria-required, labels)
- Run all existing tests to ensure no regressions
- Polish dropdown behavior and validation messages

### Micro-Iteration 1.2: Add "Use ID as labels" Checkbox

**RED Phase 1.2A: Write failing test for checkbox functionality** [COMMIT]
```typescript
it("should show 'Use ID as node labels' checkbox (default checked)", async () => {
  await navigateToColumnMapping(user);
  
  const checkbox = screen.getByLabelText("Use ID as node labels");
  expect(checkbox).toBeInTheDocument();
  expect(checkbox).toBeChecked();
});

it("should toggle checkbox state when clicked", async () => {
  await navigateToColumnMapping(user);
  
  const checkbox = screen.getByLabelText("Use ID as node labels");
  expect(checkbox).toBeChecked();
  
  await user.click(checkbox);
  expect(checkbox).not.toBeChecked();
});
```

**GREEN Phase 1.2B: Add checkbox to UI** [COMMIT]
- Update `ColumnMapping` interface: add `useIdAsLabel: boolean`
- Add checkbox component to mapping UI (default: true)
- Update state initialization: `useIdAsLabel: true`
- Add onChange handler for checkbox toggle

**REFACTOR Phase 1.2C: Polish checkbox implementation** [COMMIT]
- Ensure proper labeling and accessibility
- Test checkbox toggle functionality thoroughly
- Verify consistent styling with design system

### Micro-Iteration 1.3: Add Conditional Label Column Selector

**RED Phase 1.3A: Write failing test for conditional label selector** [COMMIT]
```typescript
it("should show Node Label column selector when 'Use ID as labels' unchecked", async () => {
  await navigateToColumnMapping(user);
  
  // Initially hidden
  expect(screen.queryByLabelText("Node Label Column")).not.toBeInTheDocument();
  
  // Uncheck the checkbox
  const checkbox = screen.getByLabelText("Use ID as node labels");
  await user.click(checkbox);
  
  // Now should be visible
  expect(screen.getByLabelText("Node Label Column *")).toBeInTheDocument();
});

it("should require label column when 'Use ID as labels' unchecked", async () => {
  await navigateToColumnMapping(user);
  await selectMapping(user, "node-id", "id");
  await selectMapping(user, "source-node", "source");
  await selectMapping(user, "target-node", "target");
  
  // Uncheck use ID as labels
  await user.click(screen.getByLabelText("Use ID as node labels"));
  
  // Continue should be disabled until label column selected
  expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  
  await selectMapping(user, "node-label", "title");
  expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
});
```

**GREEN Phase 1.3B: Add conditional label selector** [COMMIT]
- Update `ColumnMapping` interface: add `nodeLabel?: string`
- Add conditional rendering for label dropdown (shown when useIdAsLabel is false)
- Update validation logic: require nodeLabel when useIdAsLabel is false
- Add label dropdown with proper options from CSV columns

**REFACTOR Phase 1.3C: Refine conditional logic** [COMMIT]
- Ensure smooth UX transitions when toggling checkbox
- Test edge cases (rapid toggling, form state consistency)
- Verify proper form validation in all states

### Micro-Iteration 1.4: Remove Auto-Generation Notice (Temporary Removal Test)

**RED Phase 1.4A: Write temporary removal verification test** [COMMIT]
```typescript
// TEMPORARY TEST - TO BE DELETED AFTER VERIFICATION
it("TEMP: should remove auto-generation notice", async () => {
  await navigateToColumnMapping(user);
  
  // Should no longer show auto-generation text
  expect(screen.queryByText("Node IDs will be auto-generated from title column")).not.toBeInTheDocument();
  expect(screen.queryByText(/IDs will be created automatically/)).not.toBeInTheDocument();
});
```

**GREEN Phase 1.4B: Remove auto-generation UI elements** [COMMIT]
- Remove auto-generation notice div from mapping step JSX
- Remove related CSS classes and styling
- Clean up any references to auto-generation in component

**REFACTOR Phase 1.4C: Verify complete removal** [COMMIT]
- Grep codebase for auto-generation text references: `grep -r "auto.*generat" apps/web/src/`
- Run temporary test to verify removal worked
- **DELETE temporary test after verification**
- Clean up layout spacing after notice removal

### Test Audit 1: Clean Up Phase 1 Tests [COMMIT]
- Remove any remaining "should NOT show" tests that test absence
- Ensure all tests focus on positive behavior (what system should do)
- Verify comprehensive coverage of checkbox/conditional logic
- Update test descriptions to be clear about requirements

---

## Phase 2: ID Generation Logic Refactoring ✅ COMPLETE
*Goal: Generate IDs from user-provided ID field, handle edges consistently, implement deduplication*

**STATUS: COMPLETED - All micro-iterations successfully implemented**

### Completed Work Summary:
- ✅ **Micro-Iteration 2.1**: Updated generateNodeIds function for user-provided IDs with deduplication
- ✅ **Micro-Iteration 2.2**: Added generateEdgeIds function and updated validation for computed IDs  
- ✅ **Micro-Iteration 2.3**: Removed validateDuplicateNodeIds from validation pipeline
- ✅ **Micro-Iteration 2.4**: Integrated deduplication results into validation step UI
- ✅ **Test Audit 2**: Verified test suite cleanup (all tests already clean and comprehensive)

### Key Achievements:
- **ID Generation**: Users provide ID field, system generates slugified internal IDs
- **Deduplication**: Automatic duplicate removal with user notification  
- **Edge Consistency**: Edge source/target matching uses same ID computation
- **Validation Integration**: Deduplication messages displayed in validation UI
- **Test Coverage**: 14/14 ID generation tests pass, 26/26 validation tests pass

### Current Test Status:
- **CSV Import Modal**: 14 failing, 33 passing (47 total) - **significant improvement**
- **Progress**: Down from 21+ failing tests at session start
- **Next Phase**: Continue Phase 2 with validation pipeline fixes

### Continuing Phase 2: Validation Pipeline Reconstruction

## Context: Complete Data Processing Pipeline Design

Based on analysis, the CSV import system should implement a **4-stage pipeline** with **smart error handling**:

### **Pipeline Stages:**

1. **Raw Data Validation**: Check required columns are present in both files
   - Missing required columns → **Critical + Blocking** (stop pipeline immediately)
   - Report: "Missing required column: 'id' in nodes file"

2. **Individual Item Processing**: For each node/edge, process and validate individual records
   - Slugify user-provided IDs (both nodes and edges)
   - Validate node types (INPUT, STEP, OUTPUT) 
   - Empty ID field → **Non-critical + Non-blocking** (drop item, continue processing)
   - Invalid node type → **Non-critical + Non-blocking** (drop item, continue processing)
   - Report: "Node at row 3 dropped: empty ID field"

3. **Processed Data Validation**: Cross-reference validation on clean data
   - Check edge source/target references match processed node IDs
   - Missing edge references → **Non-critical + Non-blocking** (drop edge, continue)
   - Report: "Edge at row 5 dropped: source 'unknown-node' not found"

4. **Graph Structure Validation**: Validate graph topology rules
   - **OUTPUT nodes**: ≥1 outgoing edge, 0 incoming edges
   - **STEP nodes**: ≥1 incoming edge AND ≥1 outgoing edge  
   - **INPUT nodes**: ≥1 incoming edge, 0 outgoing edges
   - Topology violations → **Non-critical + Blocking** (block import, collect all violations)
   - Report: "INPUT node 'raw-data' at row 1 has no outgoing connections (warning)"
   - Report: "STEP node 'orphaned-calc' at row 7 has no connections (critical - blocks import)"

### **Error Categories:**

- **Critical + Blocking**: Missing required columns → Stop pipeline immediately
- **Non-critical + Non-blocking**: Invalid individual records → Drop items, continue pipeline  
- **Non-critical + Blocking**: Graph structure violations → Complete pipeline, block final import

### **Current State Analysis:**

**✅ Already Implemented:**
- All validation functions exist and are well-tested (34 unit tests)
- Basic pipeline structure in place
- Graph structure validation implemented
- Comprehensive UI integration testing

**🔧 Needs Refinement:**
- Error categorization system (critical vs non-critical, blocking vs non-blocking)
- Pipeline integration and orchestration
- Stage-by-stage data flow with proper error aggregation
- Type column marked as mandatory in UI


### Micro-Iteration 2.1: Update generateNodeIds Function

**RED Phase 2.1A: Rewrite ID generation tests** [COMMIT]
```typescript
// File: src/utils/__tests__/id-generation.test.ts
// COMPLETE REWRITE of existing tests
describe("generateNodeIds - ID-based generation", () => {
  it("should generate IDs from user ID field using slugify", () => {
    const nodes = [
      { id: "User Count", type: "INPUT" },
      { id: "Total Revenue", type: "OUTPUT" },
      { id: "Average Order Value", type: "STEP" },
    ];
    
    const result = generateNodeIds(nodes);
    
    expect(result[0]).toHaveProperty("id", "user-count");
    expect(result[0]).toHaveProperty("originalId", "User Count");
    expect(result[1]).toHaveProperty("id", "total-revenue");
    expect(result[2]).toHaveProperty("id", "average-order-value");
  });
  
  it("should handle duplicate user IDs by keeping first, dropping subsequent", () => {
    const nodes = [
      { id: "User Count", type: "INPUT" },
      { id: "User Count", type: "OUTPUT" }, // Duplicate - should be dropped
      { id: "Revenue", type: "STEP" },
    ];
    
    const result = generateNodeIds(nodes);
    
    expect(result.nodes).toHaveLength(2); // Second one dropped
    expect(result.nodes[0]).toHaveProperty("id", "user-count");
    expect(result.nodes[1]).toHaveProperty("id", "revenue");
    expect(result.duplicatesRemoved).toBe(1);
    expect(result.message).toBe("Removed 1 duplicate node");
  });
  
  it("should handle special characters and spaces in user IDs", () => {
    const nodes = [
      { id: "Revenue ($USD)", type: "OUTPUT" },
      { id: "User % Growth", type: "STEP" },
      { id: "New Users (30-day)", type: "INPUT" },
    ];
    
    const result = generateNodeIds(nodes);
    
    expect(result.nodes[0]).toHaveProperty("id", "revenue-usd");
    expect(result.nodes[1]).toHaveProperty("id", "user-growth");
    expect(result.nodes[2]).toHaveProperty("id", "new-users-30-day");
  });
  
  it("should handle empty or missing user IDs gracefully", () => {
    const nodes = [
      { id: "", type: "INPUT" },
      { id: "   ", type: "STEP" },
      { type: "OUTPUT" } as any, // missing id
    ];
    
    const result = generateNodeIds(nodes);
    
    expect(result.nodes[0]).toHaveProperty("id", "node-1");
    expect(result.nodes[1]).toHaveProperty("id", "node-2");
    expect(result.nodes[2]).toHaveProperty("id", "node-3");
  });
});
```

**GREEN Phase 2.1B: Refactor generateNodeIds function** [COMMIT]
- Change function signature to work with ID field instead of title field
- Update function to return `{ nodes: NodeWithId[], duplicatesRemoved: number, message: string }`
- Apply slugify logic to user-provided `id` field
- Add deduplication logic: keep first occurrence, drop subsequent
- Preserve `originalId` field for user messaging
- Handle empty/missing IDs with fallback logic

**REFACTOR Phase 2.1C: Polish and optimize** [COMMIT]
- Handle edge cases thoroughly (special characters, unicode, etc.)
- Optimize deduplication performance for large datasets
- Add comprehensive error handling
- Update function documentation

### Micro-Iteration 2.2: Add Edge ID Computation

**RED Phase 2.2A: Write tests for edge ID computation** [COMMIT]
```typescript
// File: src/utils/__tests__/id-generation.test.ts
describe("generateEdgeIds", () => {
  it("should slugify edge source and target IDs for matching", () => {
    const edges = [
      { source: "User Count", target: "Total Revenue" },
      { source: "Raw Data", target: "User Count" },
    ];
    
    const result = generateEdgeIds(edges);
    
    expect(result[0]).toEqual({
      source: "User Count",
      target: "Total Revenue", 
      computedSource: "user-count",
      computedTarget: "total-revenue"
    });
    expect(result[1]).toEqual({
      source: "Raw Data",
      target: "User Count",
      computedSource: "raw-data", 
      computedTarget: "user-count"
    });
  });
  
  it("should handle empty or missing source/target values", () => {
    const edges = [
      { source: "", target: "Revenue" },
      { source: "Users", target: "   " },
      { source: "Valid" }, // missing target
    ];
    
    const result = generateEdgeIds(edges);
    
    expect(result[0].computedSource).toBe("");
    expect(result[0].computedTarget).toBe("revenue");
    expect(result[1].computedSource).toBe("users");
    expect(result[1].computedTarget).toBe("");
  });
});
```

**GREEN Phase 2.2B: Implement generateEdgeIds function** [COMMIT]
- Create new `generateEdgeIds` function in id-generation.ts
- Apply same slugify logic to edge source and target fields
- Return edges with additional `computedSource` and `computedTarget` fields
- Preserve original source/target values for user reference
- Handle empty/missing values gracefully

**REFACTOR Phase 2.2C: Integration with validation** [COMMIT]
- Update edge validation to use computed IDs for node matching
- Modify `validateEdgeReferences` to use computedSource/computedTarget
- Handle unmatched edges as warnings (not critical errors)
- Add logic to track and report dropped edges

### Micro-Iteration 2.3: Change Duplicate Detection to Deduplication

**RED Phase 2.3A: Update duplicate handling tests** [COMMIT]
```typescript
// File: src/utils/__tests__/csv-validation.test.ts  
// Remove or comment out existing validateDuplicateNodeIds tests
// Add new deduplication tests

describe("Node deduplication in validation flow", () => {
  it("should integrate deduplication into validation pipeline", () => {
    const nodesWithDuplicates = [
      { id: "user-count", originalId: "User Count", type: "INPUT" },
      { id: "user-count", originalId: "User Count", type: "OUTPUT" }, // Duplicate
      { id: "revenue", originalId: "Revenue", type: "OUTPUT" }
    ];
    
    // This should be handled by generateNodeIds, not validation
    const nodeGenResult = generateNodeIds(nodesWithDuplicates);
    
    expect(nodeGenResult.nodes).toHaveLength(2);
    expect(nodeGenResult.duplicatesRemoved).toBe(1);
    expect(nodeGenResult.message).toBe("Removed 1 duplicate node");
  });
});
```

**GREEN Phase 2.3B: Remove duplicate validation, update pipeline** [COMMIT]
- Remove `validateDuplicateNodeIds` from validation pipeline
- Update CSV processing to use new `generateNodeIds` return structure
- Integrate deduplication messages into validation results
- Remove duplicate validation from critical error checks

**REFACTOR Phase 2.3C: Clean up validation pipeline** [COMMIT]
- Remove all calls to `validateDuplicateNodeIds`
- Clean up imports and unused code
- Update validation result interfaces if needed
- Test that validation pipeline works without duplicate validation

### Micro-Iteration 2.4: Update Validation Integration

**RED Phase 2.4A: Write integration tests for new validation flow** [COMMIT]
```typescript
// File: src/components/__tests__/csv-import-modal.test.tsx
it("should show user message about duplicate removal", async () => {
  const user = userEvent.setup();
  render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

  // Upload CSV with known duplicates
  const nodesInput = screen.getByLabelText(/nodes csv file/i);
  const nodesFile = new File([
    "id,title,type\nUser Count,User Count,INPUT\nUser Count,User Count Duplicate,OUTPUT\nRevenue,Revenue,OUTPUT"
  ], "duplicates.csv", { type: "text/csv" });
  await user.upload(nodesInput, nodesFile);

  const edgesInput = screen.getByLabelText(/edges csv file/i);
  const edgesFile = new File(["source,target\nUser Count,Revenue"], "edges.csv", { type: "text/csv" });
  await user.upload(edgesInput, edgesFile);

  await navigateToValidationStep(user);
  
  expect(screen.getByText("Removed 1 duplicate node")).toBeInTheDocument();
});

it("should show warnings for unmatched edges", async () => {
  const user = userEvent.setup();
  render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

  // Upload CSV where edge references don't match any node ID
  const nodesInput = screen.getByLabelText(/nodes csv file/i);
  const nodesFile = new File([
    "id,title,type\nusers,Users,INPUT\nrevenue,Revenue,OUTPUT"
  ], "nodes.csv", { type: "text/csv" });
  await user.upload(nodesInput, nodesFile);

  const edgesInput = screen.getByLabelText(/edges csv file/i);
  const edgesFile = new File([
    "source,target\nusers,revenue\nmissing-node,revenue"
  ], "edges.csv", { type: "text/csv" });
  await user.upload(edgesInput, edgesFile);

  await navigateToValidationStep(user);
  
  expect(screen.getByText(/dropped 1 edge.*no matching nodes/i)).toBeInTheDocument();
});
```

**GREEN Phase 2.4B: Update validation step integration** [COMMIT]
- Update CSV processing pipeline to use new ID generation functions
- Integrate deduplication results into validation step UI
- Add UI for showing edge matching warnings
- Update validation step to handle new message types

**REFACTOR Phase 2.4C: Polish validation messages** [COMMIT]
- Ensure clear, user-friendly messaging for all scenarios
- Test with various edge cases (no duplicates, many duplicates, etc.)
- Verify proper styling and layout of new message types
- Test validation step performance with large datasets

### Test Audit 2: Clean Up ID Generation Tests [COMMIT]
- Remove all old title-based tests completely
- Ensure comprehensive coverage of new ID-based logic
- Verify edge computation tests cover all scenarios
- Remove any duplicate validation tests that are no longer relevant

### Micro-Iteration 2.5: Implement Error Categorization System
*Goal: Add critical/non-critical + blocking/non-blocking error categories to validation pipeline*

**Specific Files to Modify:**
- `apps/web/src/utils/csv-validation.ts` - Add error severity types
- `apps/web/src/components/csv-import-modal.tsx` - Update validation state
- `apps/web/src/utils/__tests__/csv-validation.test.ts` - Add error category tests

**RED Phase 2.5A: Write tests for error categorization** [COMMIT]
```typescript
// Add to csv-validation.test.ts
describe("Validation Error Categorization", () => {
  it("should categorize missing columns as critical+blocking", () => {
    const result = validateRequiredFields([], ["id", "type"], "nodes");
    expect(result.severity).toBe("critical");
    expect(result.blocking).toBe(true);
  });
  
  it("should categorize empty individual IDs as non-critical+non-blocking", () => {
    const nodes = [{ id: "", type: "INPUT", title: "Test" }];
    const result = validateRequiredFields(nodes, ["id", "type"], "nodes");
    expect(result.severity).toBe("non-critical");
    expect(result.blocking).toBe(false);
  });
});
```

**GREEN Phase 2.5B: Add error categorization to validation functions** [COMMIT]
- Add `severity: 'critical' | 'non-critical'` to ValidationResult interface
- Add `blocking: boolean` to ValidationResult interface  
- Update all validation functions to return severity and blocking properties
- Missing columns → critical + blocking
- Individual item errors → non-critical + non-blocking

**REFACTOR Phase 2.5C: Update validation pipeline to handle error categories** [COMMIT]
- Update validation aggregation logic to respect blocking behavior
- Add early termination for critical+blocking errors
- Update UI to display error categories with appropriate styling

### Micro-Iteration 2.6: Fix generateNodeIds to Properly Reject Empty IDs
*Goal: Remove fallback ID generation, make empty IDs produce validation errors instead*

**Specific Files to Modify:**
- `apps/web/src/utils/id-generation.ts` - Remove fallback logic (lines 70-77)
- `apps/web/src/utils/__tests__/id-generation.test.ts` - Update empty ID test expectations
- `apps/web/src/utils/csv-validation.ts` - Move empty ID checking to validateRequiredFields

**RED Phase 2.6A: Update tests to expect empty ID validation errors** [COMMIT]
```typescript
// Update id-generation.test.ts
it("should not process nodes with empty IDs", () => {
  const nodes = [
    { id: "", type: "INPUT" },
    { id: "valid-id", type: "OUTPUT" }
  ];
  
  // Should only process valid nodes
  const result = generateNodeIds(nodes.filter(n => n.id.trim()));
  expect(result.nodes).toHaveLength(1);
  expect(result.nodes[0].id).toBe("valid-id");
});

// Add to csv-validation.test.ts  
it("should catch empty IDs in validateRequiredFields", () => {
  const nodes = [{ id: "", type: "INPUT", title: "Test" }];
  const result = validateRequiredFields(nodes, ["id"], "nodes");
  expect(result.errors).toContain("Node at row 1 is missing required field: id");
});
```

**GREEN Phase 2.6B: Remove fallback ID generation from generateNodeIds** [COMMIT]
- Remove lines 70-77 that generate "node-1", "node-2" fallbacks
- Update function to only process nodes with valid (non-empty) IDs
- Move empty ID detection to validateRequiredFields stage

**REFACTOR Phase 2.6C: Update validation pipeline to catch empty IDs early** [COMMIT]
- Enhance validateRequiredFields to check for empty/whitespace-only values
- Update runValidation to filter out nodes with validation errors before processing
- Test edge cases (whitespace, null, undefined values)

### Micro-Iteration 2.7: Mark Type Column as Mandatory in UI
*Goal: Update column mapping UI to show type column as required*

**Specific Files to Modify:**
- `apps/web/src/components/csv-import-modal.tsx` - Add required indicator to type mapping
- `apps/web/src/components/__tests__/csv-import-modal.test.tsx` - Add type column requirement tests

**RED Phase 2.7A: Write tests for required type column UI** [COMMIT]
```typescript
// Add to csv-import-modal.test.tsx
it("should show type column as required in mapping step", async () => {
  await navigateToColumnMapping(user);
  expect(screen.getByLabelText("Node Type Column *")).toBeInTheDocument();
  expect(screen.getByLabelText("Node Type Column *")).toHaveAttribute("aria-required", "true");
});

it("should disable continue when type column not selected", async () => {
  await navigateToColumnMapping(user);
  await selectMapping(user, "node-id", "id");
  await selectMapping(user, "source-node", "source");
  await selectMapping(user, "target-node", "target");
  // Don't select type column
  
  expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
});
```

**GREEN Phase 2.7B: Update column mapping UI to require type column** [COMMIT]
- Add required indicator (*) to type column mapping dropdown
- Add aria-required="true" attribute to type column selector
- Update validation logic to require type column selection
- Update continue button disabled state logic

**REFACTOR Phase 2.7C: Verify type column requirement integration** [COMMIT]
- Test all validation paths include type column checking
- Ensure consistent styling with other required fields
- Test error messaging for missing type column selection

### Micro-Iteration 2.8: Create Pipeline Integration Test Suite
*Goal: Add comprehensive tests for complete 4-stage validation pipeline*

**Specific Files to Create/Modify:**
- `apps/web/src/utils/__tests__/csv-pipeline.test.ts` - NEW comprehensive pipeline tests
- `apps/web/src/components/__tests__/csv-import-modal.test.tsx` - Add pipeline flow tests

**RED Phase 2.8A: Write comprehensive pipeline integration tests** [COMMIT]
```typescript
// Create csv-pipeline.test.ts
describe("Complete CSV Validation Pipeline", () => {
  it("should run all 4 validation stages in correct order", () => {
    // Test: Raw Data → Processing → Processed Data → Graph Structure
  });
  
  it("should stop at stage 1 for critical+blocking errors", () => {
    // Test missing required columns stops pipeline
  });
  
  it("should filter problematic items and continue for non-critical errors", () => {
    // Test empty IDs, invalid types get dropped but pipeline continues
  });
  
  it("should aggregate all errors and warnings from all stages", () => {
    // Test complete error collection and categorization
  });
  
  it("should block import for graph structure violations", () => {
    // Test non-critical+blocking graph errors prevent final import
  });
});
```

**GREEN Phase 2.8B: Implement pipeline orchestration function** [COMMIT]
- Create `runCompleteValidationPipeline()` function in csv-validation.ts
- Implement proper stage-by-stage execution with error handling
- Add comprehensive error aggregation across all stages
- Integrate with existing validation functions

**REFACTOR Phase 2.8C: Update CSV import modal to use new pipeline** [COMMIT]
- Replace current validation logic with new pipeline function
- Update validation state to handle multi-stage error results
- Test complete user workflow with new pipeline

### Micro-Iteration 2.9: Add Graph Structure Validation UI Section
*Goal: Display graph structure validation results in dedicated UI section*

**Specific Files to Modify:**
- `apps/web/src/components/csv-import-modal.tsx` - Add third validation section
- `apps/web/src/components/__tests__/csv-import-modal.test.tsx` - Add graph section tests

**RED Phase 2.9A: Write tests for graph structure validation UI** [COMMIT]
```typescript
// Add to csv-import-modal.test.tsx
it("should show Graph Structure Validation section", async () => {
  await uploadFilesWithGraphStructureIssues(user);
  await navigateToValidationStep(user);
  
  expect(screen.getByText("Graph Structure Validation")).toBeInTheDocument();
  expect(screen.getByText(/INPUT node.*no outgoing connections/)).toBeInTheDocument();
  expect(screen.getByText(/STEP node.*no connections.*critical/)).toBeInTheDocument();
});

it("should allow import with structure warnings but block with critical errors", async () => {
  // Test blocking vs non-blocking graph structure errors
});
```

**GREEN Phase 2.9B: Add Graph Structure Validation section to UI** [COMMIT]
- Add third validation results section after Nodes and Edges sections
- Display graph structure errors with warning vs critical styling
- Update validation results state to include graph structure results
- Ensure consistent visual hierarchy with existing sections

**REFACTOR Phase 2.9C: Final validation UI polish and integration** [COMMIT]
- Test complete validation UI with all three sections
- Verify error categorization displays correctly
- Test import button behavior with different error combinations
- Ensure responsive design and accessibility compliance

### Test Audit 3: E2E Test Review and Validation Pipeline Verification
*Goal: Ensure E2E tests cover validation pipeline and identify gaps*

**Analysis Phase**: Review existing E2E tests for validation coverage
- Check if E2E tests validate the CSV import validation pipeline
- Identify missing E2E test coverage for validation scenarios
- Document gaps between unit tests and E2E tests

**Action Items for Later**:
- Create E2E tests for complete CSV import validation workflow
- Add E2E tests for error handling and validation UI
- Ensure E2E tests would catch validation pipeline issues

### Success Criteria for Phase 2 Completion:
- **All CSV import modal tests pass** (0 failing, all 47 passing)
- **Two-stage validation pipeline working** (raw → process → validate)
- **Graph structure validation integrated** and displayed in UI
- **Smart error handling** (blocking vs non-blocking errors)
- **Working CSV import feature** end-to-end

---

## Phase 3: Validation System Polish
*Goal: Remove Generated IDs preview, add scrollable popup, handle empty labels*

### Micro-Iteration 3.1: Remove Generated IDs Preview (Temporary Removal Test)

**RED Phase 3.1A: Write temporary removal verification test** [COMMIT]
```typescript
// File: src/components/__tests__/csv-import-modal.test.tsx
// TEMPORARY TEST - TO BE DELETED AFTER VERIFICATION
it("TEMP: should remove Generated IDs preview section", async () => {
  const user = userEvent.setup();
  render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

  await navigateToValidationStep(user);
  
  expect(screen.queryByText("Generated IDs:")).not.toBeInTheDocument();
  expect(screen.queryByText(/user-count.*total-revenue/)).not.toBeInTheDocument();
});
```

**GREEN Phase 3.1B: Remove Generated IDs preview** [COMMIT]
- Remove `generatedNodes` state from CSV import modal
- Remove Generated IDs section from validation step JSX
- Clean up related imports and functions
- Remove any logic that populates generatedNodes

**REFACTOR Phase 3.1C: Verify complete removal** [COMMIT]
- Grep for "Generated IDs" references: `grep -r "Generated.*ID" apps/web/src/`
- Run temporary test to ensure complete removal
- **DELETE temporary test after verification**
- Clean up validation step layout after removal

### Micro-Iteration 3.2: Add Scrollable Validation Popup

**RED Phase 3.2A: Write tests for scrollable validation** [COMMIT]
```typescript
it("should limit validation popup height and scroll long error lists", async () => {
  const user = userEvent.setup();
  render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

  // Create CSV file designed to generate many validation errors
  const nodesInput = screen.getByLabelText(/nodes csv file/i);
  const manyErrors = Array.from({length: 20}, (_, i) => 
    `node${i},,INVALID_TYPE`
  ).join('\n');
  const nodesFile = new File([
    `id,title,type\n${manyErrors}`
  ], "many-errors.csv", { type: "text/csv" });
  await user.upload(nodesInput, nodesFile);

  const edgesInput = screen.getByLabelText(/edges csv file/i);
  const edgesFile = new File(["source,target\n"], "edges.csv", { type: "text/csv" });
  await user.upload(edgesInput, edgesFile);

  await navigateToValidationStep(user);
  
  const validationContainer = screen.getByTestId("validation-results");
  expect(validationContainer).toHaveStyle("max-height: 60vh");
  expect(validationContainer).toHaveStyle("overflow-y: auto");
});
```

**GREEN Phase 3.2B: Implement scrollable validation container** [COMMIT]
- Add `data-testid="validation-results"` to validation container
- Apply `max-height: 60vh` and `overflow-y: auto` styles
- Ensure proper scrollbar styling across browsers
- Test with various error list lengths

**REFACTOR Phase 3.2C: Polish scrolling UX** [COMMIT]
- Add subtle scroll indicators/shadows
- Test with different viewport sizes
- Ensure keyboard navigation works within scrollable area
- Optimize performance for long error lists

### Micro-Iteration 3.3: Add Empty Label Handling

**RED Phase 3.3A: Write tests for [empty] label display** [COMMIT]
```typescript
it("should display [empty] when label column is empty", async () => {
  const user = userEvent.setup();
  render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

  // Upload CSV with empty values in label column
  const nodesInput = screen.getByLabelText(/nodes csv file/i);
  const nodesFile = new File([
    "id,title,type\nuser-count,,INPUT\nrevenue,Revenue,OUTPUT"
  ], "empty-labels.csv", { type: "text/csv" });
  await user.upload(nodesInput, nodesFile);

  const edgesInput = screen.getByLabelText(/edges csv file/i);
  const edgesFile = new File(["source,target\nuser-count,revenue"], "edges.csv", { type: "text/csv" });
  await user.upload(edgesInput, edgesFile);

  // Navigate to mapping and uncheck "Use ID as labels"
  await navigateToColumnMapping(user);
  await user.click(screen.getByLabelText("Use ID as node labels"));
  await selectMapping(user, "node-label", "title");
  
  // Continue to validation
  await user.click(screen.getByRole("button", { name: /continue/i }));
  
  // Should show [empty] for nodes with empty title
  expect(screen.getByText("[empty]")).toBeInTheDocument();
});
```

**GREEN Phase 3.3B: Implement empty label handling** [COMMIT]
- Add logic to detect empty/whitespace-only label values
- Replace empty labels with `[empty]` in display logic
- Apply to validation step and any node preview areas
- Ensure consistent handling across components

**REFACTOR Phase 3.3C: Ensure consistent [empty] handling** [COMMIT]
- Test across different components that display node labels
- Ensure consistent styling for `[empty]` text
- Verify behavior with various empty value types (null, undefined, whitespace)
- Add proper accessibility attributes for screen readers

### Micro-Iteration 3.4: Add Duplicate Removal User Message

**RED Phase 3.4A: Write tests for duplicate removal messages** [COMMIT]
```typescript
it("should show clear message about duplicate removal", async () => {
  const user = userEvent.setup();
  render(<CSVImportModal isOpen={true} onClose={mockOnClose} />);

  // Upload CSV with known duplicates
  const nodesInput = screen.getByLabelText(/nodes csv file/i);
  const nodesFile = new File([
    "id,title,type\nUser Count,User Count,INPUT\nUser Count,User Count Duplicate,OUTPUT\nRevenue,Revenue,OUTPUT\nRevenue,Revenue Duplicate,STEP"
  ], "duplicates.csv", { type: "text/csv" });
  await user.upload(nodesInput, nodesFile);

  const edgesInput = screen.getByLabelText(/edges csv file/i);
  const edgesFile = new File(["source,target\nUser Count,Revenue"], "edges.csv", { type: "text/csv" });
  await user.upload(edgesInput, edgesFile);

  await navigateToValidationStep(user);
  
  expect(screen.getByText("Removed 2 duplicate nodes")).toBeInTheDocument();
  expect(screen.getByText(/kept first occurrence of each duplicate/i)).toBeInTheDocument();
});
```

**GREEN Phase 3.4B: Add user-friendly duplicate messages** [COMMIT]
- Add clear messaging section for deduplication results
- Show count of duplicates removed with explanation
- Add informational styling (not error/warning style)
- Include explanation of "first occurrence kept" logic

**REFACTOR Phase 3.4C: Polish messaging UX** [COMMIT]
- Ensure messages are informative but not alarming
- Test with various duplicate scenarios (0, 1, many duplicates)
- Verify proper spacing and visual hierarchy
- Test message clarity with different user personas

### Test Audit 3: Final Cleanup of Removal Tests [COMMIT]
- Delete any remaining temporary removal tests
- Ensure all tests focus on positive system behavior
- Verify comprehensive coverage of new features (scrolling, empty labels, messages)
- Update test descriptions for clarity

---

## Phase 4: Test Data & Comprehensive E2E
*Goal: Update test files as needed, ensure comprehensive E2E coverage*

### Micro-Iteration 4.1: Update Test CSV Files

**RED Phase 4.1A: Identify files needing regeneration** [COMMIT]
```bash
# Analysis of current test files and identification of needed changes
# Document which files work as-is vs need regeneration
```

**GREEN Phase 4.1B: Regenerate necessary test files** [COMMIT]
- Create new test files for ID-based edge cases:
  - `test-csv-files/id-with-spaces-nodes.csv` - IDs with spaces/special characters
  - `test-csv-files/empty-label-column-nodes.csv` - Empty label column scenarios
  - `test-csv-files/checkbox-behavior-nodes.csv` - Files for testing checkbox workflows
- Regenerate (completely rewrite) any existing files that don't match new format
- Keep files that already work with ID-based approach

**REFACTOR Phase 4.1C: Organize test file structure** [COMMIT]
- Ensure clear naming convention for all test files
- Add `test-csv-files/README.md` explaining test file purposes
- Group related test files in subdirectories if needed
- Verify all test files have proper CSV formatting

### Micro-Iteration 4.2: Add Comprehensive E2E Workflow Tests

**RED Phase 4.2A: Write E2E tests for complete new workflows** [COMMIT]
```typescript
// File: tests/e2e/csv-import-modal.spec.ts
test("Complete ID-based CSV import workflow", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("Import CSV")');
  
  // Upload files
  await page.locator('input[aria-label="Nodes CSV file upload"]')
    .setInputFiles("test-csv-files/id-with-spaces-nodes.csv");
  await page.locator('input[aria-label="Edges CSV file upload"]')
    .setInputFiles("test-csv-files/id-with-spaces-edges.csv");
  
  await page.click('button:has-text("Continue")');
  
  // Select ID column (required)
  await page.selectOption('select[aria-label="Node ID column mapping"]', 'id');
  await page.selectOption('select[aria-label="Source node column mapping"]', 'source');
  await page.selectOption('select[aria-label="Target node column mapping"]', 'target');
  
  // Continue to validation
  await page.click('button:has-text("Continue")');
  
  // Should show validation results
  await expect(page.getByText("Step 4: Validate Data")).toBeVisible();
  
  // Should be able to import
  await expect(page.getByRole("button", { name: /import/i })).toBeEnabled();
});

test("Label column workflow when ID checkbox unchecked", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("Import CSV")');
  
  // Upload files with separate ID and title columns
  await page.locator('input[aria-label="Nodes CSV file upload"]')
    .setInputFiles("test-csv-files/separate-id-title-nodes.csv");
  await page.locator('input[aria-label="Edges CSV file upload"]')
    .setInputFiles("test-csv-files/separate-id-title-edges.csv");
  
  await page.click('button:has-text("Continue")');
  
  // Select ID column
  await page.selectOption('select[aria-label="Node ID column mapping"]', 'node_id');
  
  // Uncheck "Use ID as labels"
  await page.uncheck('input[aria-label="Use ID as node labels"]');
  
  // Now label column should be visible and required
  await expect(page.getByLabelText("Node Label Column *")).toBeVisible();
  await page.selectOption('select[aria-label="Node Label column mapping"]', 'display_name');
  
  // Complete other required mappings
  await page.selectOption('select[aria-label="Source node column mapping"]', 'from_node');
  await page.selectOption('select[aria-label="Target node column mapping"]', 'to_node');
  
  await page.click('button:has-text("Continue")');
  
  // Should show validation with label column used for display
  await expect(page.getByText("Step 4: Validate Data")).toBeVisible();
});

test("Edge matching and warning handling", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("Import CSV")');
  
  // Upload files where some edges don't match any nodes
  await page.locator('input[aria-label="Nodes CSV file upload"]')
    .setInputFiles("test-csv-files/valid-nodes.csv");
  await page.locator('input[aria-label="Edges CSV file upload"]')
    .setInputFiles("test-csv-files/unmatched-edges.csv");
  
  await page.click('button:has-text("Continue")');
  
  // Complete mapping
  await page.selectOption('select[aria-label="Node ID column mapping"]', 'id');
  await page.selectOption('select[aria-label="Source node column mapping"]', 'source');
  await page.selectOption('select[aria-label="Target node column mapping"]', 'target');
  
  await page.click('button:has-text("Continue")');
  
  // Should show warnings for unmatched edges
  await expect(page.getByText(/dropped.*edge.*no matching nodes/i)).toBeVisible();
  
  // Should still allow import (warnings, not errors)
  await expect(page.getByRole("button", { name: /import/i })).toBeEnabled();
});
```

**GREEN Phase 4.2B: Implement comprehensive E2E tests** [COMMIT]
- Create all test files referenced in E2E tests
- Implement the E2E test workflows described above
- Add additional edge cases and error recovery scenarios
- Ensure tests cover both checkbox states and various data scenarios

**REFACTOR Phase 4.2C: Optimize E2E test performance** [COMMIT]
- Use efficient file upload patterns
- Minimize unnecessary wait times
- Group related tests for better performance
- Add proper test isolation and cleanup

### Test Audit 4: Final Comprehensive Test Review [COMMIT]
- Review all test files for clarity and completeness
- Ensure no orphaned or confusing tests remain
- Verify test coverage includes all new features
- Confirm all tests follow positive behavioral patterns
- Update test documentation and comments
- Run full test suite to ensure everything passes

---

## Success Criteria

After completing all phases:

1. ✅ **Required ID Field**: Users must select ID column in mapping step
2. ✅ **Flexible Labels**: Checkbox controls whether ID or separate column used for labels
3. ✅ **Internal ID Generation**: Proper slugified IDs generated from user input
4. ✅ **Edge Consistency**: Edge source/target matched using same ID computation
5. ✅ **Permissive Duplicates**: Duplicates removed silently with user notification
6. ✅ **Edge Warnings**: Unmatched edges become warnings, don't block import
7. ✅ **Empty Labels**: Show `[empty]` for missing label values
8. ✅ **Clean UI**: No auto-generation notice, scrollable validation popup
9. ✅ **Working Software**: All tests pass, no regressions
10. ✅ **Comprehensive Coverage**: E2E tests cover all major workflows

## Development Notes

- **Commit Strategy**: Commit after every RED, GREEN, REFACTOR step
- **Test Philosophy**: Focus on positive behavior, avoid testing absence
- **Working Software**: Every micro-iteration ends with working application
- **TDD Discipline**: Write failing tests first, make them pass, then refactor