# Task: Error Display Feature

## Spec 1: Functional Error Panel

### Slice 1: Error Toggle & Badge
- [x] Create E2E test `e2e/error-display.spec.ts` with "No Errors" and "With Errors" scenarios <!-- id: 0 -->
- [x] Create fixtures `nodes_errors_display.csv` and `edges_errors_display.csv` <!-- id: 1 -->
- [x] Create `ErrorToggle` component <!-- id: 2 -->
- [x] Update `LineageGraph` to calculate error count and render `ErrorToggle` <!-- id: 3 -->
- [x] Verify Slice 1 with E2E tests <!-- id: 4 -->

### Slice 2: Error Panel Shell
- [x] Add "Opening the Panel" and "Closing the Panel" scenarios to E2E test <!-- id: 5 -->
- [x] Create `ErrorListPanel` component (shell) <!-- id: 6 -->
- [x] Add `isErrorPanelOpen` state to `LineageGraph` <!-- id: 7 -->
- [x] Wire up Toggle and Close buttons <!-- id: 8 -->
- [x] Verify Slice 2 with E2E tests <!-- id: 9 -->

### Slice 3: Error List Content
- [x] Add "List Accuracy" and "Multiple Errors" scenarios to E2E test <!-- id: 10 -->
- [x] Update `ErrorListPanel` to render list of errors <!-- id: 11 -->
- [x] Update `self-cycle-validator.ts` to return formatted strings <!-- id: 14 -->
- [x] Update `node-connectivity-validator.ts` to return formatted strings <!-- id: 15 -->
- [x] Update `multi-cycle-validator.ts` to return formatted strings <!-- id: 16 -->
- [x] Update `e2e/graph-validation.spec.ts` assertions to match new messages <!-- id: 17 -->
- [x] Deduplicate error messages in `LineageGraph.tsx` <!-- id: 19 -->
- [x] Verify `e2e/graph-validation.spec.ts` passes <!-- id: 18 -->

### Slice 5: Compact Error Panel UI
- [x] Update `ErrorListPanel` to use compact list layout with icons <!-- id: 20 -->
- [x] Verify UI with E2E tests (Regression) <!-- id: 22 -->

## Spec 2: Error Interaction & Visualization

### Slice 1: Node Error Selection
- [x] Implement `clickErrorItem` in `LineagePage` <!-- id: 16 -->
- [x] Implement `handleErrorClick` for Nodes in `LineageGraph` <!-- id: 17 -->
- [x] Verify Slice 1 with E2E tests <!-- id: 18 -->
- [x] Regression check: `node-properties.spec.ts` <!-- id: 19 -->

### Slice 2: Active vs. Passive Error Visualization
- [x] Define `flash` animation in Tailwind (2s duration) <!-- id: 20 -->
- [x] Implement Active/Passive logic in `CustomNode` (Static vs Flashing Ring) <!-- id: 21 -->
- [x] Implement Active/Passive logic in `CustomEdge` (Static vs Flashing Stroke) <!-- id: 22 -->
- [x] Implement Animation Restart on Re-click (using `flashTrigger`) <!-- id: 30 -->
- [x] Verify "Exclusive Pulse" scenario with E2E tests <!-- id: 29 -->

### Slice 3: Edge Error Selection
- [x] Implement `selectedEdgeId` state in `LineageGraph` <!-- id: 23 -->
- [x] Apply "Selected" styling to `CustomEdge` <!-- id: 24 -->
- [x] Verify Slice 3 with E2E tests <!-- id: 25 -->


