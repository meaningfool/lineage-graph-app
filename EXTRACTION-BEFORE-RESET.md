# Code Extraction Before Reset to 1b6fece

**Date**: 2025-11-19
**Reset Target**: Commit `1b6fece` (Smoothstep Edges - Clean ReactFlow baseline)
**Current State**: Commit `feb5748` (WIP - 5 failing tests)

This document preserves valuable code patterns and test files developed after the reset point, particularly from the CSV Import feature development (Phases 1-2.9).

---

## 1. CSV Validation Patterns

### 1.1 Validation Architecture

**4-Stage Validation Pipeline:**
1. **Raw Data Validation**: Check for missing required fields
2. **Type Validation**: Validate node types (INPUT, STEP, OUTPUT)
3. **Duplicate Detection**: Find duplicate node IDs
4. **Graph Structure Validation**: Check node connectivity

**Key Pattern: Severity + Blocking Model**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  severity: "critical" | "non-critical";
  blocking: boolean;  // Controls whether import can proceed
}
```

### 1.2 Core Validation Functions

**File**: `apps/web/src/utils/csv-validation.ts`

#### Required Fields Validation
```typescript
const REQUIRED_FIELDS = {
  nodes: ["id", "title", "type"],
  edges: ["source", "target"],
} as const;

export function validateRequiredFields(
  data: Record<string, any>[],
  dataType: "nodes" | "edges",
): ValidationResult {
  // Critical+Blocking: Completely missing data (empty array)
  if (data.length === 0) {
    return {
      isValid: false,
      errors: [{
        type: "MISSING_DATA",
        severity: "critical",
        message: `No ${dataType} data found - check that required columns exist`,
        dataType,
      }],
      severity: "critical",
      blocking: true,
    };
  }

  // Non-critical+Non-blocking: Individual missing fields
  // (drop problematic rows and continue)
  const errors: ValidationError[] = [];
  data.forEach((item, index) => {
    requiredFields.forEach((field) => {
      if (!item[field] || (typeof item[field] === "string" && item[field].trim() === "")) {
        errors.push({
          type: "MISSING_REQUIRED_FIELD",
          severity: "critical",
          message: `${dataType === "nodes" ? "Node" : "Edge"} at row ${index + 1} is missing required field: ${field}`,
          rowIndex: index,
          field,
          dataType,
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    severity: "non-critical",
    blocking: false, // Individual field errors are non-blocking
  };
}
```

#### Node Type Validation
```typescript
const VALID_NODE_TYPES = ["INPUT", "STEP", "OUTPUT"] as const;

export function validateNodeTypes(nodes: Record<string, any>[]): ValidationResult {
  const errors: ValidationError[] = [];

  nodes.forEach((node, index) => {
    if (node.type) {
      const normalizedType = String(node.type).toUpperCase();

      if (!VALID_NODE_TYPES.includes(normalizedType as any)) {
        errors.push({
          type: "INVALID_NODE_TYPE",
          severity: "critical",
          message: `Node at row ${index + 1} has invalid type: ${node.type}. Must be INPUT, STEP, or OUTPUT`,
          rowIndex: index,
          invalidValue: node.type,
          validValues: [...VALID_NODE_TYPES],
          dataType: "nodes",
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    severity: "non-critical",
    blocking: false,
  };
}
```

#### Duplicate Detection
```typescript
export function validateDuplicateNodeIds(nodes: Record<string, any>[]): ValidationResult {
  const errors: ValidationError[] = [];
  const idOccurrences = new Map<string, number[]>();

  // Track all occurrences of each ID
  nodes.forEach((node, index) => {
    if (node.id && typeof node.id === "string" && node.id.trim() !== "") {
      const id = node.id.trim();
      if (!idOccurrences.has(id)) {
        idOccurrences.set(id, []);
      }
      idOccurrences.get(id)!.push(index);
    }
  });

  // Find duplicates and create error messages with ALL affected rows
  idOccurrences.forEach((rowIndexes, id) => {
    if (rowIndexes.length > 1) {
      const rowNumbers = rowIndexes.map((index) => index + 1).join(", ");
      errors.push({
        type: "DUPLICATE_NODE_ID",
        severity: "critical",
        message: `Duplicate node ID "${id}" found at rows: ${rowNumbers}`,
        duplicateId: id,
        rowIndexes,
        dataType: "nodes",
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    severity: "non-critical",
    blocking: false, // Handled by deduplication
  };
}
```

### 1.3 Graph Structure Validation

**File**: `apps/web/src/utils/graph-structure-validation.ts`

**Pattern**: Lineage-specific connectivity rules with severity levels

```typescript
export function validateNodeConnectivity(
  nodes: NodeData[],
  edges: EdgeData[],
): GraphValidationResult {
  const errors: GraphValidationError[] = [];

  // Build connectivity maps
  const outgoingConnections = new Map<string, string[]>();
  const incomingConnections = new Map<string, string[]>();

  // Initialize and populate from edges...

  // Validate based on node type
  nodes.forEach((node, index) => {
    const hasIncoming = (incomingConnections.get(node.id) || []).length > 0;
    const hasOutgoing = (outgoingConnections.get(node.id) || []).length > 0;

    switch (node.type) {
      case "INPUT":
        if (!hasOutgoing) {
          errors.push({
            type: "INPUT_NO_OUTGOING",
            severity: "warning", // ⚠️ Warning, not critical
            message: `INPUT node "${node.id}" at row ${index + 1} has no outgoing connections`,
            nodeId: node.id,
            nodeType: node.type,
            rowIndex: index,
          });
        }
        break;

      case "OUTPUT":
        if (!hasIncoming) {
          errors.push({
            type: "OUTPUT_NO_INCOMING",
            severity: "warning", // ⚠️ Warning, not critical
            message: `OUTPUT node "${node.id}" at row ${index + 1} has no incoming connections`,
            nodeId: node.id,
            nodeType: node.type,
            rowIndex: index,
          });
        }
        break;

      case "STEP":
        // STEP nodes require BOTH incoming AND outgoing
        if (!hasIncoming && !hasOutgoing) {
          errors.push({
            type: "STEP_NO_CONNECTIONS",
            severity: "critical", // 🔴 Critical error
            message: `STEP node "${node.id}" at row ${index + 1} has no incoming or outgoing connections`,
            nodeId: node.id,
            nodeType: node.type,
            rowIndex: index,
          });
        } else if (!hasIncoming) {
          errors.push({
            type: "STEP_NO_INCOMING",
            severity: "critical",
            message: `STEP node "${node.id}" at row ${index + 1} has no incoming connections`,
            nodeId: node.id,
            nodeType: node.type,
            rowIndex: index,
          });
        } else if (!hasOutgoing) {
          errors.push({
            type: "STEP_NO_OUTGOING",
            severity: "critical",
            message: `STEP node "${node.id}" at row ${index + 1} has no outgoing connections`,
            nodeId: node.id,
            nodeType: node.type,
            rowIndex: index,
          });
        }
        break;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    severity: "non-critical",
    blocking: errors.length > 0, // Graph structure errors block import
  };
}
```

### 1.4 ID Generation Pattern

**File**: `apps/web/src/utils/id-generation.ts`

**Pattern**: Slugify + Deduplication Strategy

```typescript
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")     // Remove special characters
    .replace(/[\s_]+/g, "-")      // Spaces → hyphens
    .replace(/^-+|-+$/g, "")      // Remove leading/trailing hyphens
    .replace(/-+/g, "-");         // Multiple hyphens → single
}

export function generateNodeIds(nodes: NodeWithId[]): GenerateNodeIdsResult {
  const seenIds = new Set<string>();
  const processedNodes: ProcessedNode[] = [];
  let duplicatesRemoved = 0;

  for (const node of nodes) {
    const userProvidedId = node.id?.trim();

    if (!userProvidedId) continue; // Skip empty IDs (caught by validation)

    const computedId = slugify(userProvidedId);

    // Handle duplicates: keep first occurrence, drop rest
    if (seenIds.has(computedId)) {
      duplicatesRemoved++;
      continue;
    }

    seenIds.add(computedId);
    processedNodes.push({
      ...node,
      id: computedId,
      originalId: userProvidedId,
    });
  }

  return { nodes: processedNodes, duplicatesRemoved, message: "..." };
}

// Edge IDs: Apply same slugify to source/target for consistent matching
export function generateEdgeIds(edges: EdgeWithIds[]): ProcessedEdge[] {
  return edges.map((edge) => ({
    ...edge,
    source: edge.source || "",
    target: edge.target || "",
    computedSource: edge.source ? slugify(edge.source) : "",
    computedTarget: edge.target ? slugify(edge.target) : "",
  }));
}
```

**Key Insight**: Edges reference nodes using computed IDs, ensuring consistent matching even with case differences or special characters.

---

## 2. Testing Strategy Insights

### 2.1 Hybrid Testing Strategy

**From**: `CLAUDE.md` and practical experience

**Pattern**: Unit tests for pure logic, E2E for ReactFlow + integration

```
┌─────────────────────────────────────────────┐
│ Unit Tests (Fast, Isolated)                │
├─────────────────────────────────────────────┤
│ • Pure functions (validation, ID generation)│
│ • Simple component logic                    │
│ • Data transformation logic                 │
│ • State management                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ E2E Tests (Comprehensive, User-focused)     │
├─────────────────────────────────────────────┤
│ • ReactFlow interactions                    │
│ • Complete user journeys                    │
│ • Visual behavior                           │
│ • Cross-component integration               │
└─────────────────────────────────────────────┘
```

**Decision Framework:**
- Does it involve ReactFlow? → E2E test
- Is it a pure function? → Unit test
- Does it test user workflow? → E2E test
- Is it simple component logic? → Unit test

### 2.2 Data-Driven Testing Pattern

**From**: E2E test refactoring experience

```typescript
// ✅ GOOD: Data-driven approach
import targetLineageData from '@/data/target-lineage.json';

it('should display all nodes from data file', () => {
  const nodeElements = screen.getAllByTestId(/^node-/);
  expect(nodeElements).toHaveLength(targetLineageData.nodes.length);
});

// ❌ BAD: Hardcoded magic numbers
it('should display all nodes', () => {
  const nodeElements = screen.getAllByTestId(/^node-/);
  expect(nodeElements).toHaveLength(5); // Where did 5 come from?
});
```

**Benefits:**
- Tests adapt automatically when data changes
- No magic numbers
- Clear relationship between test and data source
- Single source of truth

### 2.3 Testing Library Query Patterns

**From**: JSDOM compatibility lessons

```typescript
// ✅ ALWAYS use Testing Library queries
const nodeElement = screen.getByTestId('node-users');
const propertyElements = within(nodeElement).getAllByTestId(/^property-/);

// ❌ NEVER use querySelector (JSDOM incompatible)
const nodeElement = document.querySelector('[data-testid="node-users"]');
```

**Key Learnings:**
- Testing Library queries work consistently in both unit and E2E tests
- querySelector fails in JSDOM (Vitest) but works in real browsers (Playwright)
- Use specific test IDs for predictable scenarios
- Use regex patterns for dynamic test IDs: `/^property-/`

### 2.4 Test Naming Convention

**Pattern**: `Test N: Descriptive Name`

```typescript
describe('CSV Import Modal', () => {
  it('Test 1: Basic file upload flow', () => { ... });
  it('Test 2: Column mapping with auto-detection', () => { ... });
  it('Test 3: Validation error display', () => { ... });
});
```

**Benefits:**
- Easy reference in discussions ("Test 3 is failing")
- Clear debugging workflow ("Run Test 5 only")
- Sequential understanding of feature

---

## 3. CSV Test Files

### 3.1 Test File Suite

**Location in Git**: Commit `0aaf5c5` - test-csv-files/

**18 CSV test files** covering all validation scenarios:

#### Valid Test Cases (6 files)
- `valid-basic-nodes.csv` + `valid-basic-edges.csv` - Standard happy path
- `valid-custom-columns-nodes.csv` + `valid-custom-columns-edges.csv` - Manual mapping
- `valid-case-insensitive-nodes.csv` + `valid-case-insensitive-edges.csv` - Case normalization

#### Validation Error Cases (10 files)
- `error-missing-id-nodes.csv` - Missing node ID field
- `error-missing-title-nodes.csv` - Missing node title field
- `error-missing-source-edges.csv` - Missing edge source field
- `error-missing-target-edges.csv` - Missing edge target field
- `error-invalid-types-nodes.csv` - Invalid node types
- `error-duplicate-ids-nodes.csv` - Duplicate node IDs
- `error-orphaned-edges.csv` - Edges referencing missing nodes
- `error-multiple-issues-nodes.csv` + `error-multiple-issues-edges.csv` - Complex multi-error scenarios

#### File Format Error Cases (2 files)
- `error-empty.csv` - Empty file detection
- `error-malformed.csv` - CSV parsing errors

### 3.2 Sample Test Files

**valid-basic-nodes.csv:**
```csv
id,title,type
users,Users,INPUT
sessions,Sessions,INPUT
user-count,User Count,STEP
conversion-rate,Conversion Rate,STEP
revenue,Revenue,OUTPUT
```

**error-duplicate-ids-nodes.csv:**
```csv
id,title,type
user-count,User Count,STEP
orders,Orders,INPUT
user-count,User Count Duplicate,OUTPUT
revenue,Revenue,OUTPUT
```

### 3.3 Extracting Test Files

To recover these files from git history:
```bash
# List all test CSV files
git show 0aaf5c5 --name-only | grep "\.csv$"

# Extract specific file
git show 0aaf5c5:test-csv-files/valid-basic-nodes.csv > valid-basic-nodes.csv

# Extract all test files
git show 0aaf5c5:test-csv-files/README.md > TEST-FILES-README.md
```

---

## 4. Target Lineage Data Structure

**File**: `apps/web/src/data/target-lineage.json`

**Purpose**: Reference data structure for MRR (Monthly Recurring Revenue) lineage

```json
{
  "nodes": [
    {
      "id": "new-users",
      "label": "New Users",
      "type": "source",
      "properties": {
        "description": "Total number of new user registrations",
        "dataType": "Integer",
        "lastUpdated": "2024-01-15",
        "source": "User registration database"
      }
    },
    {
      "id": "paid-user-ratio",
      "label": "Paid User %",
      "type": "source",
      "properties": { ... }
    },
    {
      "id": "avg-revenue-per-user",
      "label": "Average Revenue Per User",
      "type": "source",
      "properties": { ... }
    },
    {
      "id": "new-paid-users",
      "label": "New Paid Users",
      "type": "computed",
      "properties": {
        "formula": "New Users × Paid User %"
      }
    },
    {
      "id": "new-mrr",
      "label": "New MRR",
      "type": "metric",
      "properties": {
        "formula": "New Paid Users × Average Revenue Per User"
      }
    }
  ],
  "edges": [
    { "id": "edge-1", "source": "new-users", "target": "new-paid-users" },
    { "id": "edge-2", "source": "paid-user-ratio", "target": "new-paid-users" },
    { "id": "edge-3", "source": "new-paid-users", "target": "new-mrr" },
    { "id": "edge-4", "source": "avg-revenue-per-user", "target": "new-mrr" }
  ]
}
```

**Note**: This uses older terminology (`source`/`computed`/`metric` instead of `INPUT`/`STEP`/`OUTPUT`).

---

## 5. Key Architecture Insights

### 5.1 Why LineageGraph Was Premature

**Problem**: Created heavy abstraction layer before understanding requirements
- Built extensive validation methods (isAcyclic, hasValidFlow, etc.)
- Created complex layer calculation logic
- Added validation that CSV import also needed

**Result**:
- Duplication between LineageGraph validation and CSV validation
- Unclear boundaries between graph operations and validation
- Increased complexity without clear benefit

**Lesson**: Start with simple data transformation, add abstraction when patterns emerge

### 5.2 Vertical vs Horizontal Slicing

**What Went Wrong:**
- Phase 1: All UI changes (CSV modal, upload, mapping)
- Phase 2: All validation changes (pipeline integration)
- Result: App non-functional between phases, mass test failures

**What Should Have Been Done:**
- Phase 1: Basic upload + basic validation → WORKING
- Phase 2: Add mapping + extend validation → WORKING
- Phase 3: Add preview + complete validation → WORKING

**Pattern**: Each phase must maintain fully functional application

### 5.3 Error Categorization Model

**Key Pattern**: Separate severity from blocking behavior

```
┌──────────────────────────────────────────────────┐
│ Severity: Critical | Non-Critical                │
│ Blocking: True | False                           │
├──────────────────────────────────────────────────┤
│ Critical + Blocking:   Must fix to proceed      │
│   Example: Empty data, missing columns          │
│                                                   │
│ Critical + Non-Blocking: Can drop and continue  │
│   Example: Individual missing fields            │
│                                                   │
│ Warning + Non-Blocking: Proceed with caution    │
│   Example: Isolated INPUT/OUTPUT nodes          │
└──────────────────────────────────────────────────┘
```

This pattern allows flexible error handling:
- Show all errors to user
- Allow import with non-blocking errors
- Provide clear feedback on what will happen

---

## 6. Commands to Extract Files

```bash
# Navigate to project root
cd /Users/josselinperrus/Projects/data-lineage-app

# Create extraction directory
mkdir -p extracted-code-before-reset/{validation,test-files,data}

# Extract validation files from current state
cp apps/web/src/utils/csv-validation.ts extracted-code-before-reset/validation/
cp apps/web/src/utils/graph-structure-validation.ts extracted-code-before-reset/validation/
cp apps/web/src/utils/id-generation.ts extracted-code-before-reset/validation/

# Extract test files from git history (commit 0aaf5c5)
git show 0aaf5c5:test-csv-files/README.md > extracted-code-before-reset/test-files/README.md
git show 0aaf5c5:test-csv-files/QUICK-TEST-GUIDE.md > extracted-code-before-reset/test-files/QUICK-TEST-GUIDE.md

# Extract all CSV test files
for file in $(git ls-tree -r 0aaf5c5 --name-only | grep "test-csv-files/.*\.csv$"); do
  filename=$(basename "$file")
  git show "0aaf5c5:$file" > "extracted-code-before-reset/test-files/$filename"
done

# Extract target lineage data
cp apps/web/src/data/target-lineage.json extracted-code-before-reset/data/

# Create archive
tar -czf extracted-code-$(date +%Y%m%d).tar.gz extracted-code-before-reset/
```

---

## 7. Next Steps After Reset

### 7.1 Don't Immediately Rebuild
- Review what actually worked at the reset point
- Understand the clean baseline
- Plan features with lessons learned

### 7.2 Consider Alternative Approaches
- Do you actually need LineageGraph abstraction?
- Could validation be simpler?
- Is CSV import the right next feature?

### 7.3 Apply Lessons
- ✅ Use vertical slicing (UI + backend together)
- ✅ Keep abstractions minimal until patterns emerge
- ✅ Maintain working software at every commit
- ✅ Test incrementally, not all at once

---

## 8. Summary

**What We're Keeping:**
- ✅ CSV validation patterns (4-stage pipeline)
- ✅ ID generation with slugify + deduplication
- ✅ Graph structure validation logic
- ✅ 18 comprehensive CSV test files
- ✅ Testing strategy insights (hybrid unit/E2E)
- ✅ Target lineage data structure

**What We're Leaving Behind:**
- ❌ Heavy LineageGraph abstraction
- ❌ Complex validation integration
- ❌ Half-finished CSV import modal
- ❌ Inconsistent test suite

**Clean Reset Point:**
- Commit `1b6fece` - "refactor: implement smoothstep edges"
- Working ReactFlow visualization
- Stable Vitest testing
- No broken tests
- No heavy abstractions
