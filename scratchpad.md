# UI Issues and Improvements

## Recently Completed ✅
1. **Side Panel Width** - Increased from w-80 to w-96
2. **Cursor Interaction** - Added pointer cursor and hover effects
3. **Node Selection Visual Feedback** - Added selected-node styling with blue ring
4. **Node Type Visual Distinction** - Added color coding for source/computed/metric nodes
5. **Node Type Colors Too Bright** - Made colors more subtle: emerald for INPUT, slate (gray) for STEP, violet for OUTPUT
6. **Background Click Should Deselect** - Implemented onPaneClick handler + comprehensive E2E test suite (7 tests, refined and optimized)
7. **New Graph Generation Should Clear Selection** - Added useEffect to clear selection when nodes change, ensuring graph regeneration resets selection state

## Current Issues Found During Testing

### 3. Viewport Re-centering on Interactions
- **Issue**: Viewport re-centers every time a node is selected/interacted with
- **Goal**: Viewport should only re-center when:
  - New graph is generated
  - NOT on node selection or other interactions
- **Files**: `apps/web/src/components/lineage-graph.tsx` (fitView logic in useEffect)
