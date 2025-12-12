# Research: Demo Polish & Refactoring

## Context
Refining the application for a public demo and hardening the codebase for maintainability. This document tracks key architectural insights, debugging deep-dives, and best practices established during development.

## 1. Architectural Patterns: Wizard Replacement
**Transition from Legacy (`csv-import/`) to New Wizard (`wizard/`)**

### The Shift
We replaced a legacy, monolithic wizard implementation with a modern, modular architecture.
*   **Old Pattern**: "Page-based" components (`StepMapping.tsx`) causing high code duplication (repeating select logic 5x) and tight coupling between UI and State.
*   **New Pattern**: "Hook-based" architecture (`useNewImportWizard`) separating concerns:
    *   **Logic**: Centralized in a custom hook (validation, navigation, state).
    *   **UI**: Generic, data-driven components (`MappingTable.tsx`) rendering from configuration arrays.

### Findings
*   **Data-Driven UI Wins**: Defining fields in a configuration object (`rows` array) eliminated 80% of the JSX boilerplate. Validation and "Required" badges became automatic side-effects of the config, preventing UI/Logic drift.
*   **"Engine & Blueprint" vs. "Manual Scripting"**:
    *   *Legacy*: Manually scripted JSX for every field (e.g., repeating the `<Select>` block 5 times). Hard to maintain; adding a field required finding and copying code.
    *   *New*: A "Blueprint" (config array) feeds an "Engine" (`MappingTable`). Logic is written once. Adding a field means adding 1 line of config.
*   **Separation of Concerns ("Brain vs. Body")**:
    *   *Legacy (Prop Soup)*: The Parent component held all state and validation logic, micromanaging the child via dozens of props (`isValid`, `onChange`). Changing a rule required editing both Parent (logic) and Child (UI).
    *   *New (Headless Hook)*: `useNewImportWizard` (The Brain) contains 100% of the logic/state. `ImportWizardDialog` (The Body) is a dumb render layer. This separation allows the logic to be tested in isolation and keeps the UI strictly presentation-focused.

## 2. E2E Testing Strategy

### The "Single Source of Truth" Rule
**Problem**: We found the string "Import successful" checking logic duplicated across `csv-import.spec.ts`, `NewWizardPage.ts`, and `LineagePage.ts`.
**Risk**: If the UI text changed to "Import Complete", we would have to update 3 files. If one was missed, tests would desynchronize.
**Solution**: **Strict Page Object Model (POM)**.
*   Tests (`*.spec.ts`) must NEVER access the DOM directly for complex assertions.
*   Legacy Page Objects (`LineagePage`) must NOT duplicate logic from Feature Page Objects (`NewWizardPage`). They should delegate: `const wizard = new NewWizardPage(page); await wizard.verifySuccess();`.

### The "Modal Boundary" Principle
**Definition**: The responsibility of `NewWizardPage` ends *exactly* when the modal closes.
*   **Wizard Domain**: Interactions inside the modal (Upload, Mapping, Success Step).
*   **Graph Domain**: Assertions on the *result* (Nodes, Edges, Pulses) belong strictly to `LineagePage`.
*   **The Rule**: Tests should switch Page Objects immediately after closing the wizard:
    ```typescript
    await wizard.finishImport(); // Modal closes
    // STOP using wizard.verifyGraphNode(...)
    await lineagePage.verifyGraphNode(...); // Switch to LineagePage
    ```

### Selector Hardening: Text vs. TestID
**Observation**: Tests relying on human-readable text (e.g., `getByText("Next")`) were flaky.
*   *Case Study*: The "Next" button changed its text to "Generate Graph" on the final step. Tests failed immediately.
*   *Case Study*: "Node B" exists in the Graph AND in the properties panel. `getByText("Node B")` is ambiguous.
*   **Policy**: Use `data-testid` for structural, interactive, or dynamic elements.
    *   **Good**: `getByTestId("import-next-button")` (Stable, regardless of label).
    *   **Good**: `getByTestId("step-map-nodes")` (Stable, independent of step title).
    *   **Exceptions**: Static content verification (e.g., verifying an error message text exists) is fine, but checking *presence* of a component should be via TestID.

### Interactions "In the Wild" (Dropdowns vs Pills)
**Lesson**: UI Refactors break tests if interactions are coupled to specific implementations.
*   We changed property selection from a `<Select>` dropdown to clickable "Pills".
*   Tests looking for `.trigger` failed.
*   **Fix**: Abstract the interaction in the Page Object. `wizard.selectProperty("prop1")` should hide *how* it's selected (pill click vs option select).

## 3. Debugging Case Study: The "Ghost Overlay" Flake
*(Retained from previous research for reference)*

### Context
`await button.click()` failing with "intercepted by overlay" in tests with rapid modal transitions.

### Mechanism
1.  **Check**: Playwright confirms button is actively visible.
2.  **Fire**: Click event dispatched.
3.  **Race**: App reacts instantly -> Modal Overlay renders.
4.  **Verify**: Playwright wakes up from "Cold Start" lag, checks cursor position, hits the *new* Overlay, and fails the test safely.

### Solution
Use `dispatchEvent("click")` for interactions known to trigger immediate viewport-blocking layout shifts, bypassing Playwright's post-click actionability verification loop.
