# Learnings: Demo Polish & Refactoring

## 1. Refactoring Strategy: Iteration vs. Duplication
**The Mistake**: "Big Bang" Replacement.
We attempted to replace the legacy wizard by creating a full duplicate ("New Wizard") to implement both **Structural Changes** (splitting mapping into 2 steps) and **Visual Changes** (new CSS/Look & Feel) simultaneously.

**The Consequences**:
*   **Confusion**: The AI Agent struggled to differentiate between the "Source of Truth" (legacy) and the "New Implementation".
*   **Drift**: Errors compounded as the new version drifted from the old logic in unintended ways.
*   **Maintenance**: Keeping two complex features alive made debugging significantly harder.

**The Solution**: **Iterative Refactoring**.
1.  **Phase 1 (Structure)**: Refactor the *existing* components to the new flow (1 step -> 2 steps) without changing the visuals.
2.  **Phase 2 (Polish)**: Apply the new Design System (CSS/Look & Feel) to the structurally sound components.
*Avoid "Parallel features" unless strictly necessary.*

## 2. E2E Testing Architecture
*   **Abstraction is Logic's Safety Net**: Tests broke when we moved from `<Select>` dropdowns to "Pill" buttons because the tests were coupled to the HTML structure.
    *   *Lesson*: Page Objects must expose **Intent** (`selectProperty('id')`), not **Implementation** (`click('.pill')`).
*   **Strict Page Object Model**: We found duplicated assertions (success strings) in multiple specs.
    *   *Lesson*: Centralize assertions. `LineagePage` should verify graph nodes, `WizardPage` should verify wizard success. Do not mix boundaries.

## 3. Component Architecture
*   **Data-Driven UI**: Scripting JSX for every field (Id, Title, Type...) is an anti-pattern.
    *   *Lesson*: Use configuration arrays ("Blueprints") and generic renderers ("Engines"). It guarantees consistency (e.g., all required fields get `*`) and reduces code volume by 80%.
