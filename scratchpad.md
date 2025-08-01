# Complex Lineage Analysis Feature Plan

## Feature Overview
Click a node → View its lineage → Creates a partial view of the full graph. The experience should feel seamless, with the node remaining selected and the side panel staying open.

## Implementation Plan

### Iteration 1: Add "View Lineage" Button to Side Panel
**RED Phase:**
- Write E2E test that clicks a node and checks for "View Lineage" button in side panel
- Test button exists with proper test ID

**GREEN Phase:**
- Add button to side panel below properties
- Basic styling
- Empty click handler (does nothing)

### Iteration 2: Lineage Extraction with Selection Persistence
**RED Phase:**
- Write E2E test that:
  - Clicks on a node (note its label)
  - Clicks "View Lineage" button
  - Tests that a new graph loads
  - Tests that a node with the same label remains selected
  - Tests that side panel remains open (doesn't close/reopen)
  - Tests that "View Lineage" button is NOT visible (to ensure iteration 4 RED phase)

**GREEN Phase:**
- Store full graph reference
- Implement getLineage() on button click
- Replace current view with lineage result
- Find and select the node with same label in new graph
- Keep side panel open throughout transition
- Hide "View Lineage" button after first use

### Iteration 3: Visual Distinction for Focus Node
**RED Phase:**
- Write E2E test that after viewing lineage:
  - The selected node has a special visual indicator
  - This visual indicator is different from regular selection
  - Test for specific CSS class or style that indicates "focus node"

**GREEN Phase:**
- Add `focusNodeId` state to track which node's lineage is shown
- Add visual styling in CustomNode component for focus nodes
- Could be: thicker border, different color, or badge icon
- Ensure focus styling works alongside selection styling

### Iteration 4: Continuous Lineage Exploration
**RED Phase:**
- Write E2E test that:
  1. Views lineage of node A
  2. In partial view, selects a different node B
  3. "View Lineage" button IS visible for node B
  4. Clicks button and gets lineage from full graph
  5. Node B becomes new focus node (has focus visual)
  6. Node A no longer has focus visual

**GREEN Phase:**
- Show "View Lineage" button for all selected nodes
- Ensure getLineage() always uses stored full graph
- Update focusNodeId when viewing new lineage
- Previous focus node loses special styling

## Key Design Decisions
- **Seamless UX**: Side panel stays open, selection persists
- **Node matching**: Use label (not ID) to find same node after graph change
- **Visual hierarchy**: Focus node (whose lineage is shown) has distinct styling
- **Progressive disclosure**: Button hidden initially to ensure proper TDD

## Technical Notes
- State needed: `fullGraph`, `focusNodeId`
- Match nodes by label when transitioning graphs
- Side panel state management needs careful handling

## Success Criteria
- Smooth user experience (no jarring closes/reopens)
- Clear visual feedback about which node's lineage is displayed
- Can explore multiple lineages without returning to full view
- Each iteration has a true RED phase before GREEN