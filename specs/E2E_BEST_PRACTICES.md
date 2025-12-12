# E2E Testing & Architecture Guidelines

**Target Audience**: Senior Software Engineers / Agents.
**Context**: Playwright + React.

## 1. Page Object Model (POM) Discipline

### Strict Encapsulation
*   **DO**: Route all interactions/assertions through Page Objects.
*   **DON'T**: Use `page.locator()` or `expect(page.getBy...)` directly in spec files.

### The "Modal Boundary" Principle
*   **Context**: Modal interactions vs. Application state.
*   **Rule**: Responsibility ends when the modal/overlay closes.
*   **Pattern**:
    ```typescript
    await wizard.finishImport(); // Modal Closes
    // ❌ WRONG: await wizard.verifyGraphNode("A");
    // ✅ RIGHT: await lineagePage.verifyGraphNode("A");
    ```

### Single Source of Truth
*   **DO**: Centralize unique DOM assertions (e.g., "Import successful" message) in the owning component's PO.
*   **DON'T**: Duplicate text/selector definitions across multiple POs. `LineagePage` should delegate to `WizardPage` for wizard-specific checks, not reimplement them.

## 2. Robust Selectors

### Structural vs. Content
*   **DO**: Use `data-testid` for all interactive elements (buttons, inputs) and dynamic containers (step wrappers).
*   **DON'T**: Use `getByText` or `getByRole` for navigation controls. Labels change (e.g., "Next" -> "Generate Graph"), breaking tests.
*   **EXCEPTION**: `getByText` is acceptable for verifying *static content presence* (e.g., error semantics).

### Abstraction Levels
*   **DO**: Abstract implementation details in PO methods.
    *   `wizard.selectProperty("prop1")`
*   **DON'T**: Leak DOM specificities into specs.
    *   `wizard.clickPropertyPill("prop1")` (Too specific)
    *   `wizard.selectDropdownOption("prop1")` (Too specific)

## 3. Flakiness & Stability

### The "Ghost Overlay" (Race Conditions)
*   **Issue**: `click()` intercepted by an overlay rendering immediately after actionability check (Cold Start specific).
*   **Fix**: Use `dispatchEvent("click")` for triggers that cause immediate, viewport-blocking layout shifts.
    ```typescript
    // Bypasses Playwright's post-click verification loop
    await button.dispatchEvent("click");
    ```

### explicit Waits
*   **DO**: Use `expect(locator).toBeVisible()` or `page.waitForResponse()`.
*   **DON'T**: Use `page.waitForTimeout()`.

## 4. UI Architecture for Testability

### Brain vs. Body (Separation of Concerns)
*   **Pattern**: Decouple Logic (Hook) from Presentation (Component).
*   **Brain**: `useWizardLogic` (State, Validation, Data Processing).
*   **Body**: `WizardDialog` (Layout, Dumb Rendering, prop-less configuration).
*   **Benefit**: Enables potential headless testing of complex flows/validation logic without DOM overhead.

### Data-Driven UI
*   **Pattern**: Generate repetitive UI (tables, forms) from configuration arrays ("Blueprints") rather than hardcoded JSX.
*   **Benefit**: Ensures consistent application of validation rules (e.g., "Required" badges) and simplifes "add field" changes.
