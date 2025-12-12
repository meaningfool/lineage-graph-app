# Spec 03: E2E Test Refactoring & Debt Paydown

## 1. Goal
Refactor the E2E test suite to align with Best Practices, eliminate technical debt from the Wizard migration, and harden fragile selectors.

## 2. Problem Statement
The recent audit (Post-02) identified that `NewWizardPage` unnecessarily duplicates graph verification logic that belongs to `LineagePage`. Additionally, tests like `csv-import.spec.ts` leak implementation details by bypassing the Page Object Model, and some selectors (e.g., Tailwind classes for warnings) are brittle.

## 3. Proposed Changes

### Slice 1: Hardening Selectors (Immediate Fix)
*   **Target**: `import-wizard-dialog.tsx`
*   **Change**: Add `data-testid="warning-item"` to the warning list items.
*   **Update**: Refactor `NewWizardPage.verifyWarningCount` and `LineagePage` (if applicable) to use this new stable selector instead of `.rounded-md.bg-yellow-500`.

### Slice 2: DRYing Page Objects (The Separation of Concerns)
*   **Refactor**: Remove all graph verification methods from `NewWizardPage.ts` (`verifyGraphNode`, `verifyEdgeHasPulse`, `getGraphNode`, etc.).
*   **Migration**: Update `csv-import.spec.ts` and `graph-validation.spec.ts` to instantiate `LineagePage` alongside `NewWizardPage`.
    *   *Pattern*: Use `NewWizardPage` for modal interactions -> `await wizardPage.finishImport()` -> Switch to `LineagePage` for graph assertions.

### Slice 3: Strict POM Enforcement
*   **Refactor**: `NewWizardPage.ts`
    *   Add missing assertion methods: `verifyStepMatches(stepName)`, `verifySuccessMessage(text)`.
*   **Update**: `csv-import.spec.ts`
    *   Replace `await expect(page.getByText(...))` calls with `await wizardPage.verify...` methods.

### Slice 4: Text-Based Selector Cleanup (Audit Follow-up)
*   **Target**: `csv-import.spec.ts` and `state-management.spec.ts`.
*   **Goal**: Eliminate remaining fragile text locators identified in the Post-Slice 3 Audit.
*   **Changes**:
    *   **Success/Error Messages**: In `ImportWizardDialog`, add `data-testid` to the success message container and error summary box. Update `NewWizardPage` to use these IDs for scoped assertions (e.g. `expect(container).toContainText(...)`).
    *   **Graph Selection**: In `state-management.spec.ts`, replace `getByText("Node B")` with `LineagePage.getGraphNode("Node B")` to ensure consistent node selection logic.
    *   **Warning Truncation**: Add `data-testid` for the "more warnings" indicator.

## 4. Verification Plan
### Automated Tests
Run the full suite to ensure no regressions during refactoring.
```bash
npx playwright test
```
**Success Criteria**: All 52 tests must pass.

### Manual Review
*   Inspect `NewWizardPage.ts` to ensure it contains **zero** `react-flow` selectors.
*   Inspect `csv-import.spec.ts` to ensure **zero** direct `page.locator` or `page.getBy` calls (except for initial setup).
