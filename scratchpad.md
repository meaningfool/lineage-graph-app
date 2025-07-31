# Side Panel Implementation Plan (TDD Approach)

## Overview
Implement a side panel to display node properties instead of showing them within nodes, making nodes cleaner and providing better property interaction.

## Iteration 1: Basic Side Panel with Node Click

### DESIGN Phase
- Add side panel state to `LineageGraph` component
- Design node click handler signature
- Create side panel component structure
- **Test outline**: Click node → side panel becomes visible

### RED Phase  
- Test: Click any node → side panel appears with test-id `side-panel`
- Test: Side panel contains placeholder content
- Verify tests fail initially

### GREEN Phase
- Add `useState` for side panel visibility
- Add click handler to custom nodes  
- Create basic side panel JSX with absolute positioning
- Minimal implementation to pass tests

## Iteration 2: Close Side Panel

### DESIGN Phase
- Add close button to side panel
- Design close handler signature
- **Test outline**: Click close → side panel disappears

### RED Phase
- Test: Side panel has close button with test-id `close-side-panel`
- Test: Click close → side panel no longer visible
- Verify tests fail

### GREEN Phase
- Add close button to side panel JSX
- Add close handler to set visibility false
- Update click handler logic

## Iteration 3: Display Node Properties

### DESIGN Phase
- Pass clicked node data to side panel
- Design property display structure
- **Test outline**: Click node → properties appear in side panel

### RED Phase
- Test: Click node → side panel shows node label
- Test: Click node → side panel shows all node properties
- Test: Properties use same test-ids as current implementation
- Verify tests fail

### GREEN Phase
- Add selected node state
- Pass node data to click handler
- Render node properties in side panel
- Reuse existing property display logic

## Iteration 4: Remove Properties from Nodes

### DESIGN Phase
- Update `CustomNode` to hide properties
- Ensure nodes display only labels
- **Test outline**: Nodes show labels only, properties only in side panel

### RED Phase
- Test: Nodes display labels but no properties
- Test: Properties still accessible in side panel
- Update existing tests that expect properties in nodes
- Verify tests fail appropriately

### GREEN Phase
- Modify `CustomNode` to conditionally hide properties
- Update node styling for cleaner appearance
- Ensure side panel remains primary property source

## Iteration 5: Styling Refinements

### DESIGN Phase
- Side panel styling (width, shadows, transitions)
- Better positioning and responsiveness  
- Enhanced visual hierarchy
- **Test outline**: Visual quality tests (optional - focus on functional tests)

### RED/GREEN Phase
- Focus on functional tests for critical interactions
- Styling validation through visual testing if needed
- Polish transitions and responsive behavior

## Testing Strategy
- **Use Testing Library queries**: `screen.getByTestId()`, `within().getByTestId()`
- **End-user focus**: Test what users see, not implementation details
- **Node interaction**: `fireEvent.click()` on nodes to trigger side panel
- **Property validation**: Verify properties move from nodes to side panel
- **Accessibility**: Ensure side panel is keyboard accessible

## Technical Approach
- State management in `LineageGraph` component
- ReactFlow node click events via `onNodeClick` prop
- Side panel as absolutely positioned overlay
- Maintain existing property display logic
- Progressive enhancement of existing tests

---

# COMPLETED: Side Panel Implementation ✅

All iterations (1-4) completed successfully:
- ✅ Basic side panel with node click functionality
- ✅ Close side panel button 
- ✅ Display node properties in side panel
- ✅ Remove properties from nodes (show labels only)

**Status**: Side panel feature is fully functional and tested.

---

# NEXT: Hybrid Testing Strategy - Unit + E2E

## Research Findings & New Approach

After researching ReactFlow testing approaches, we discovered:
- **ReactFlow team recommends E2E testing** (Cypress/Playwright) over unit testing
- **Community struggles with unit testing ReactFlow** due to async rendering and DOM measurement requirements
- **Our original mock approach is actually the accepted pattern** for ReactFlow unit tests
- **Logic duplication is a known trade-off** that the community accepts

## New Strategy: Hybrid Unit + E2E Approach

### Keep Unit Tests For:
- ✅ **Pure utility functions** (`lineagegraph.ts`, `graph-layout.ts`)
- ✅ **Simple component logic** (buttons, forms, dropdowns)
- ✅ **State management** (hooks, context)
- ✅ **Data transformations** (JSON parsing, node/edge creation)

### Move to E2E Tests:
- 🎯 **ReactFlow interactions** (node clicks, pan/zoom)
- 🎯 **Side panel workflows** (open/close, property display)
- 🎯 **Graph generation** (button clicks, new data loading)
- 🎯 **Visual behaviors** (fitView, edge type switching)
- 🎯 **Complete user journeys** (end-to-end workflows)

## Implementation Plan

### Phase 1: Revert & Measure Baseline
1. **Revert to working mock approach** (our original that passed all tests)
2. **Measure current test performance**:
   ```bash
   pnpm test:run --reporter=verbose
   # Record: total time, individual test times
   ```
3. **Document baseline metrics** for comparison

### Phase 2: Set Up E2E Testing ✅ COMPLETED
1. **Install Playwright**: ✅
   ```bash
   pnpm add -D @playwright/test -w
   ```
2. **Create E2E config** (`playwright.config.ts`) ✅
3. **Set up test environment** integration with our dev servers ✅
4. **Create initial E2E test structure** (`tests/e2e/`) ✅
5. **Created comprehensive E2E tests**: ✅
   - `tests/e2e/basic-functionality.spec.ts` - Basic app functionality (4 tests)
   - `tests/e2e/side-panel.spec.ts` - Side panel ReactFlow interactions (6 tests)
6. **Added package.json scripts** for E2E testing ✅
   - `pnpm test:e2e` - Run all E2E tests
   - `pnpm test:e2e:chromium` - Run E2E tests in Chromium only
   - `pnpm test:e2e:ui` - Open Playwright UI
   - `pnpm test:e2e:report` - Show test report

**Results**: 10 E2E tests passing, demonstrating React Flow interactions work perfectly in real browser environment

### Phase 3: Migrate ReactFlow Tests to E2E ✅ COMPLETED
1. **Identified ReactFlow-heavy tests** ✅ 
   - Data-Driven Edge Testing (5 tests)
   - Generate Graph Button behavior (4 tests) 
   - Automatic Camera Adjustment (3 tests)
   - Edge Type Selection (4 tests)
   - Side Panel functionality (10 tests)
2. **Verified E2E test coverage** ✅ All behaviors covered by comprehensive E2E tests
3. **Removed redundant unit tests** ✅ Reduced from 62 to 41 tests (-34%)
4. **Maintained essential unit tests** ✅ Kept data transformation and basic component tests

### Phase 4: Optimize Performance (If Needed)
- **Parallel E2E execution** if tests are slow
- **Test categorization** (smoke tests vs full suite)
- **Selective test running** for development vs CI

### Phase 5: Document Testing Guidelines
Add to CLAUDE.md testing rules:

```markdown
## Testing Strategy Guidelines

### Unit Tests (Fast, Isolated)
- Pure functions and utilities
- Simple component logic (no ReactFlow)
- State management and hooks
- Data transformation logic

### E2E Tests (Comprehensive, User-focused)
- ReactFlow interactions and workflows
- Complete user journeys
- Visual behavior and integration
- Cross-component interactions

### Decision Framework
- **Does it involve ReactFlow?** → E2E test
- **Is it a pure function?** → Unit test
- **Does it test user workflow?** → E2E test
- **Is it simple component logic?** → Unit test
```

## Success Criteria
- ✅ **Fast unit tests** for appropriate scenarios
- ✅ **Comprehensive E2E tests** for ReactFlow interactions
- ✅ **Clear guidelines** for choosing test type
- ✅ **Better test confidence** - tests match user experience
- ✅ **Maintainable approach** - no logic duplication issues
- ✅ **Performance acceptable** - reasonable test suite execution time

## TDD Alignment Benefits
- **E2E tests match TDD philosophy** - test from user perspective
- **Better behavior verification** - test what users actually do
- **Clearer test-driven design** - think in terms of user workflows
- **More meaningful red/green cycle** - tests represent real value

---

# E2E Test Reorganization Plan

## Current Issues
- **Costly operation duplication**: Multiple files loading pages, generating graphs, waiting for ReactFlow
- **Missing camera repositioning tests**: Lost during hybrid testing implementation
- **Unclear test boundaries**: Overlap between data validation and graph interactions

## New File Structure (Option A)

### **graph-generation-workflow.spec.ts** (Consolidate expensive operations)
**Purpose**: Complete graph generation user journey from loading to validation

**Tests to migrate/combine**:
- From `basic-functionality.spec.ts`: 
  - App loading and main elements visibility
  - Default graph node rendering (data-driven)
- From `data-validation.spec.ts`:
  - Node labels from target-lineage.json data  
  - Edge count validation
  - Graph generation differences (click twice, verify different)
- **NEW**: Camera repositioning tests
  - Default graph loads with optimal camera positioning
  - Camera adjusts when Generate Graph is clicked
  - Viewport bounds validation (all nodes visible)

### **graph-controls-workflow.spec.ts** (Lightweight control testing)
**Purpose**: UI control functionality without expensive graph operations

**Tests to migrate**:
- From `graph-interactions.spec.ts`:
  - Edge type dropdown options (data-driven, not hard-coded)
  - Default edge type selection
  - Edge type switching functionality
  - Graph stability after edge type changes

**Tests to REMOVE** (per user feedback):
- ❌ UI control positioning tests (not needed)
- ❌ Rapid interaction handling (not critical)

### **side-panel-workflow.spec.ts** (Keep as-is)
**Purpose**: Side panel interactions - already well organized

## Implementation Changes Needed

### 1. **Create graph-generation-workflow.spec.ts**
```typescript
// Single expensive beforeEach setup
// All tests share loaded page + rendered graph

test('should load app with main elements and default graph')
test('should render nodes from target-lineage.json data') 
test('should display correct edge count from data')
test('should generate different graphs on each button click')
test('should position camera optimally for default graph') // NEW
test('should reposition camera when generating new graphs') // NEW
```

### 2. **Create graph-controls-workflow.spec.ts** 
```typescript
// Lightweight setup, focus on controls not heavy graph operations

test('should show edge type options from data source') // Data-driven
test('should have correct default edge type selected')
test('should change edge type when dropdown changes')
test('should maintain graph after edge type changes')
```

### 3. **Remove old files**
- Delete `basic-functionality.spec.ts`
- Delete `data-validation.spec.ts` 
- Delete `graph-interactions.spec.ts`

### 4. **Add missing camera tests**
Based on Git history, implement E2E versions of:
- **Viewport positioning validation**: Check if nodes are within viewport bounds
- **Camera adjustment on generation**: Verify fitView is called/effective after Generate Graph
- **Optimal viewport utilization**: Ensure graphs use reasonable portion of screen space

## Benefits of This Reorganization
- **Reduce expensive operations**: Consolidate graph loading/generation in one file
- **Better test organization**: Clear separation of concerns (generation vs controls)
- **Add missing coverage**: Camera repositioning tests
- **Maintain granularity**: Separate test cases for good debugging
- **Remove unnecessary tests**: UI positioning and rapid interaction tests

## Success Criteria
- All existing functionality still tested
- Camera repositioning tests added and passing
- Reduced total test execution time due to less duplication
- Clearer test file purposes and organization