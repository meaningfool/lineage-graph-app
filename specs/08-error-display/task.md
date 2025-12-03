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
### Slice 4: Enhanced Error Messages (Vertical)
- [ ] Update fixtures (`nodes_errors_display.csv`, `edges_errors_display.csv`) to cover ALL error types <!-- id: 14 -->
- [ ] Create `GraphValidationError` interface and `ERROR_TEMPLATES` constant <!-- id: 15 -->
- [ ] Refactor validators to return `GraphValidationError` objects (include cycle path) <!-- id: 16 -->
- [ ] Create `ErrorFormatter` utility <!-- id: 17 -->
- [ ] Update `LineageGraph` to use `ErrorFormatter` <!-- id: 18 -->
- [ ] Update `e2e/error-display.spec.ts` to assert ALL error messages <!-- id: 19 -->

### Slice 5: Compact Error Panel UI (Vertical)
- [ ] Update `ErrorListPanel` to remove cards and use list layout <!-- id: 20 -->
- [ ] Add red exclamation icon to error items <!-- id: 21 -->
- [ ] Verify UI with E2E tests (Regression) <!-- id: 22 -->

## Spec 2: Error Interaction

### Slice 1: Node Error Navigation
- [ ] Implement node selection and focus logic in `LineageGraph` <!-- id: 16 -->
- [ ] Verify Slice 1 with E2E tests <!-- id: 17 -->
- [ ] Regression check: `node-properties.spec.ts` <!-- id: 18 -->

### Slice 2: Edge Error Navigation
- [ ] Add "Focus Edge from Error" scenario to E2E test <!-- id: 19 -->
- [ ] Implement edge focus logic in `LineageGraph` <!-- id: 20 -->
- [ ] Verify Slice 2 with E2E tests <!-- id: 21 -->

### Slice 3: Panel Coexistence
- [ ] Add "Dual Panel Visibility" scenario to E2E test <!-- id: 22 -->
- [ ] Adjust layout/CSS for coexistence <!-- id: 23 -->
- [ ] Verify Slice 3 with E2E tests <!-- id: 24 -->
