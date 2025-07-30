Test-Driven Development workflow mandatory for all feature development

# TDD Feature Development Workflow

## 🚨 MANDATORY 5-PHASE WORKFLOW

### **Phase 1: DESIGN** 
1. Define method/class signatures that will be added/changed
2. Create outline of tests for these signatures
3. **SCOPE TRIMMING**: Help user minimize scope to smallest viable increment
4. **STOP** - Get user approval before proceeding

### **Phase 2: RED** 
1. Implement the outlined tests
2. Run tests → Verify they FAIL
3. **STOP** - Get user approval to commit tests

### **Phase 3: COMMIT TESTS**
1. Commit tests only after explicit user approval
2. Use commit type: `test: add tests for [feature]`

### **Phase 4: GREEN**
1. Discuss minimal implementation approach
2. Define absolute minimum code to pass tests
3. Implement minimal solution
4. Run tests → Verify they PASS
5. **STOP** - Get user approval to commit implementation

### **Phase 5: COMMIT IMPLEMENTATION**
1. Commit implementation only after explicit user approval
2. Use commit type: `feat: implement [feature]` or `refactor: [change]`

## ⚠️ CRITICAL RULES
- **NEVER proceed to next phase** without explicit user permission
- **ALWAYS help trim scope** to minimal viable increments
- **ONLY modify tests for the current feature** - never touch unrelated tests
- **Separate commits**: Tests and implementation must be separate commits

## 🧪 DOM TESTING BEST PRACTICES

### **ALWAYS Use Testing Library Queries**
- **✅ DO**: `screen.getByTestId()`, `screen.getAllByTestId()`, `within(element).getByText()`
- **❌ NEVER**: `querySelector()`, `querySelectorAll()`, DOM traversal methods

### **Pattern Examples**
```javascript
// ✅ GOOD: Testing Library with regex patterns
const propertyElements = within(node).getAllByTestId(/^property-/)
const nodeContainer = screen.getByTestId(/^node-/)

// ❌ BAD: querySelector with wildcards (JSDOM incompatible)
const properties = node.querySelector('[data-testid*="property-"]')
```

### **Scoped Queries for Complex Components**
```javascript
// ✅ GOOD: Use within() for component-scoped queries
const nodeScope = within(node)
const button = nodeScope.getByText('Generate Graph')
const properties = nodeScope.getAllByTestId(/^property-/)

// ❌ BAD: Global queries that may find wrong elements
const button = screen.getByText('Generate Graph') // Could find any button
```

### **Content Validation Patterns**
```javascript
// ✅ GOOD: Test meaningful content, not structure
expect(label).toBeTruthy()
expect(label).not.toBe('undefined')
expect(propertyElements.length).toBeGreaterThanOrEqual(2)

// ❌ BAD: Testing implementation details
expect(node.innerHTML).toContain('<div class="properties">')
```

### **Why These Rules Matter**
- **JSDOM Compatibility**: querySelector wildcards fail in test environments
- **Maintainability**: Testing Library queries survive DOM structure changes
- **User-Centric**: Tests how users actually interact with components
- **Debugging**: Better error messages when tests fail 