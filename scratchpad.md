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