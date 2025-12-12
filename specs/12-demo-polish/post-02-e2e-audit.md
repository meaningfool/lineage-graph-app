# Post-Spec Audit: E2E Tests & Legacy Debt

## 1. Context
Following the implementation of the "New Import Wizard" (Spec 02), we conducted an audit of the E2E test suite to ensure adherence to Best Practices (`AGENT.md`) and identify any technical debt accumulated during the migration.

## 2. Findings

### A. Page Object Model (POM) Adherence
*   **Status**: ⚠️ Mixed
*   **Good**: Core interactions (clicks, navigation, complex flows like `importGraph`) are well encapsulated in `LineagePage` and `NewWizardPage`.
*   **Issues**:
    *   **Assertion Leakage**: Tests frequently bypass the POM to assert UI state, especially in `csv-import.spec.ts`.
        *   *Example*: `await expect(page.getByText("1 node dropped")).toBeVisible()` instead of `await wizardPage.verifyWarning("1 node dropped")`.
        *   *Example*: `await expect(page.getByTestId("wizard-step-success")).toBeVisible()` is used directly in specs despite `NewWizardPage` having `verifyImportSuccess()`.
    *   **Direct Locator Usage**: Occasional direct usage of `page.locator()` for CSS assertions (e.g., in `node-properties.spec.ts` to check Tailwind classes).

### B. Selectors & Resilience
*   **Status**: ✅ Mostly Good
*   **Good**: Widespread usage of `data-testid` for critical interactive elements (`import-next-button`, `dropzone-nodes`).
*   **Issues**:
    *   **Fragile Tailwind Selectors**:
        *   `LineagePage.ts` & `NewWizardPage.ts`: `.rounded-md.bg-yellow-500\/15 > div` (Used for verifying warnings). This is highly brittle and tied to styling.
        *   *Recommendation*: Add `data-testid="warning-item"` to the warning container in the component.
    *   **Library Internal Classes**:
        *   Usage of `.react-flow__node`, `.react-flow__edge`, `.react-flow__pane`.
        *   *Risk*: These are internal classes of the React Flow library and could change.
        *   *Recommendation*: Wrap these locators in the POM (as is done) but consider adding custom data attributes to the custom node/edge components if possible for stricter control.

### C. Component Duplication (Legacy Debt)
*   **Status**: ⚠️ Significant
*   **Observation**: The `LineageView` (aka `LineageGraph`) is the single source of truth for rendering the graph. There is **no** `WizardPreview` component in the codebase.
*   **The Debt**: `NewWizardPage.ts` (the test helper) duplicates a massive amount of logic from `LineagePage.ts` related to graph verification (`verifyGraphNode`, `verifyEdgeHasPulse`, `getGraphNodeLayer`).
    *   *Cause*: During the wizard migration, tests were likely written to be self-contained, verifying the graph state *after* the wizard closed using the Wizard PO itself.
    *   *Correct Approach*: Once the Wizard modal closes, the test context has returned to the "Lineage Page". The tests should switch to using the `LineagePage` PO to verify the graph, keeping `NewWizardPage` focused solely on the wizard modal interaction.

### D. Fixtures
*   **Status**: ✅ Excellent
*   **Good**: Consistent use of `path.join(__dirname, ...)` for absolute paths. Fixtures are granular and scenario-specific.

## 3. Comparison Matrix
| Feature | POM Encapsulation | Selector Quality | Notes |
| :--- | :--- | :--- | :--- |
| `csv-import.spec.ts` | **Low** | High | Heavily relies on `page.getByText` and `page.getByTestId` inside the spec for assertions. |
| `node-properties.spec.ts` | **High** | High | Uses `lineagePage` methods for almost all interactions and visualizations. |
| `error-display.spec.ts` | **Medium** | High | Uses `importGraph` helper well, but verifies specific error messages via generic text locators. |

## 4. Conclusion
The suite is functional and robust but carries maintenance weight due to the duplication in Page Objects and loose assertions in `csv-import.spec.ts`. A targeted refactoring session is required to align with Best Practices.
