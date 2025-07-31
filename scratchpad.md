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

# NEXT: Refactor Testing Approach - NO MOCKING

## Problem Identified
Current ReactFlow mocking approach creates **logic duplication**:
- Real `CustomNode` component has specific rendering logic
- Test mock duplicates this logic manually  
- Changes require updating both component AND mock
- Violates principle: "Don't mock what you don't own when it's core to your app"

## Chosen Approach: No Mocking of ReactFlow
Use real ReactFlow components in tests, only mock browser APIs that are already handled in test-setup.ts:
- `ResizeObserver` - ✅ Already mocked
- CSS imports - ✅ Already mocked
- No other mocking needed!

## Test Refactoring Checklist

### 1. Remove ReactFlow Mock (page.test.tsx)
**File**: `apps/web/src/app/__tests__/page.test.tsx`
**Changes needed**:
- Remove entire `vi.mock('reactflow', ...)` block (lines 57-106)
- Remove mock viewport functions (lines 8-54) - use real ReactFlow viewport
- Update test selectors to work with real ReactFlow DOM structure
- May need to use `waitFor` for async rendering

### 2. Update Node Selection Tests
**Tests affected**: All tests using `screen.getByTestId('node-${id}')`
**Changes needed**:
- Real ReactFlow renders nodes differently - need to find correct selectors
- CustomNode component should already have test-ids, verify they work
- May need to wait for ReactFlow initialization

### 3. Update Edge Tests  
**Tests affected**: Tests using `screen.getAllByTestId('react-flow__edge')`
**Changes needed**:
- Real ReactFlow edge structure is different
- Find correct way to query edges in actual ReactFlow DOM
- Verify edge source/target attributes still accessible

### 4. Update Click Handler Tests
**Tests affected**: Side panel tests using `fireEvent.click(node)`
**Changes needed**:
- Ensure click events work on real ReactFlow nodes
- May need to target specific elements within nodes
- Verify `onNodeClick` prop is properly connected

### 5. Update Viewport/Camera Tests
**Tests affected**: "Automatic Camera Adjustment" test suite
**Changes needed**:
- Remove mock viewport helpers
- Use ReactFlow's real `useReactFlow` hook if needed
- May need to spy on real `fitView` calls instead of mocking

### 6. Handle Async Behavior
**All tests may need**:
- `waitFor` wrapper for ReactFlow initialization
- Handle loading states
- Deal with layout calculations timing

### 7. Test Environment Setup
**Verify in test-setup.ts**:
- ResizeObserver mock is sufficient
- No Canvas/WebGL issues arise
- CSS imports properly handled

### 8. Component Extraction (Optional Future)
**If real ReactFlow causes issues**:
- Extract and export `CustomNode` from lineage-graph.tsx
- Create separate unit tests for CustomNode
- Keep integration tests focused on workflows

## Implementation Order
1. Start with simplest test: "renders all nodes from the data"
2. Get one test working with real ReactFlow
3. Apply pattern to remaining tests
4. Address any async/timing issues
5. Clean up unused mock code

## Success Criteria
- ✅ All tests pass with real ReactFlow
- ✅ No mock/component logic duplication  
- ✅ Tests are more reliable and catch real issues
- ✅ Test maintenance reduced
- ✅ Tests represent actual user experience