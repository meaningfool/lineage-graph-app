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

### E. Text-Based Selector Audit (Slice 3 Update)
*   **Status**: ✅ Improved (Navigation Hardened)
*   **Audit**: A broad scan for fragile `getByText` usage was conducted.
*   **Fixed (Slice 3)**:
    *   **Wizard Navigation**: `NewWizardPage` was refactored to use `data-testid` for all step verification (`step-map-nodes`, `step-map-edges`), replacing brittle text checks.
    *   **Properties Selection**: Refactored from a flaky dropdown search to robust "Pill" selection using `property-pill-{name}` test IDs.
*   **Remaining Risks**:
    *   **Success Verification**: `verifyImportSuccess` and related tests still rely on text like "Import successful" or "1 node dropped".
        *   *Recommendation*: Add `data-testid` to summary and error containers for scoped text assertions.
    *   **Graph Selection in Tests**: `state-management.spec.ts` uses `getByText("Node B")` to click nodes.
        *   *Recommendation*: Use `getGraphNode("Node B")` helper from `LineagePage` (which uses internal classes) or add `data-testid` to Node components.

## 3. Comparison Matrix
| Feature | POM Encapsulation | Selector Quality | Notes |
| :--- | :--- | :--- | :--- |
| `csv-import.spec.ts` | **Medium** (Improved) | **Medium** | Still uses some text assertions for errors/warnings. Navigation is now robust. |
| `node-properties.spec.ts` | **High** | **High** | Uses `NewWizardPage` for property selection (Pills) and `LineagePage` for graph checks. |
| `error-display.spec.ts` | **High** | **High** | Fully refactored to use `NewWizardPage` and `LineagePage` appropriately. |

## 4. Conclusion
The suite has been significantly hardened. The critical "Wizard Navigation" and "Graph Verification" layers are now robust and DRY. The remaining text-based selectors are primarily in assertion logic (verifying error messages), which is lower risk. Future work should focus on extracting `csv-import.spec.ts` assertions into the POM.
