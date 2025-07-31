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

### Phase 2: Set Up E2E Testing
1. **Install Playwright**:
   ```bash
   pnpm add -D @playwright/test
   ```
2. **Create E2E config** (`playwright.config.ts`)
3. **Set up test environment** integration with our dev servers
4. **Create initial E2E test structure** (`tests/e2e/`)

### Phase 3: Migrate ReactFlow Tests to E2E
1. **Identify ReactFlow-heavy tests** (side panel, graph interactions)
2. **Create equivalent E2E tests** testing same behaviors from user perspective
3. **Run both unit and E2E tests** to ensure coverage
4. **Remove unit tests** once E2E coverage is confirmed
5. **Measure new test performance** and compare

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