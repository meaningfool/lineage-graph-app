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

# NEXT: Refactor Testing Approach - Minimal Mocking

## Problem Identified
Current ReactFlow mocking approach creates **logic duplication**:
- Real `CustomNode` component has specific rendering logic
- Test mock duplicates this logic manually  
- Changes require updating both component AND mock
- Maintenance burden and potential for mock/reality drift

## Current Problematic Mock Location
File: `apps/web/src/app/__tests__/page.test.tsx` (lines ~50-90)
```typescript
vi.mock('reactflow', () => ({
  ReactFlow: ({ nodes, onNodeClick }) => (
    <div>
      {nodes.map(node => (
        <div key={node.id} data-testid={`node-${node.id}`}>
          {node.data.label}
          {/* This logic was duplicated from CustomNode */}
        </div>
      ))}
    </div>
  )
}))
```

## Refactoring Strategy

### Option A: Integration Testing with Real ReactFlow
- Remove heavy ReactFlow mocking
- Use real ReactFlow with minimal environment mocks only
- Test actual component interactions
- **Benefits**: No logic duplication, tests closer to reality
- **Challenges**: Potential test environment setup (canvas/WebGL issues)

### Option B: Component Unit Testing + Integration
- Extract `CustomNode` component testing separately  
- Keep minimal ReactFlow mock for full-page integration tests
- Test `CustomNode` in isolation without ReactFlow dependency
- **Benefits**: Fast unit tests + targeted integration tests
- **Implementation**: 
  1. Create `CustomNode.test.tsx` 
  2. Simplify ReactFlow mock to just container structure
  3. Focus page tests on workflows, not rendering details

### Option C: Hybrid Approach (Recommended)
- Use real ReactFlow for critical user workflows
- Mock only problematic parts (Background, MiniMap, canvas operations)
- Extract testable components where possible
- **Benefits**: Balance of realism and test stability

## Implementation Steps

1. **Audit current test coverage** - identify which tests actually need ReactFlow
2. **Extract CustomNode tests** - test node rendering logic separately
3. **Minimize ReactFlow mock** - only mock environment issues, not logic
4. **Update integration tests** - focus on user workflows over implementation details
5. **Validate test confidence** - ensure tests still catch regressions

## Files to Modify
- `apps/web/src/app/__tests__/page.test.tsx` - main test file with ReactFlow mock
- Create: `apps/web/src/components/__tests__/CustomNode.test.tsx` - dedicated component tests
- `apps/web/src/components/lineage-graph.tsx` - potentially extract CustomNode export

## Success Criteria
- ✅ No logic duplication between mocks and real components
- ✅ Tests remain fast and reliable
- ✅ Component changes don't require mock updates
- ✅ Test coverage maintained or improved
- ✅ Tests better represent actual user interactions

## Testing Philosophy Reference
- **Kent C. Dodds**: "The more your tests resemble the way your software is used, the more confidence they can give you"
- **Mock external dependencies, not your own components**
- **Integration tests > Unit tests > E2E tests** (in terms of quantity/focus)

## Future Decision Points
- How much ReactFlow behavior do we actually need to mock?
- Should we invest in visual regression testing for graph layouts?
- Can we test complex graph interactions without full ReactFlow mocking?