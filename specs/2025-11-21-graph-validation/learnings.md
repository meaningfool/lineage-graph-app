# Learnings - Graph Validation

## Technical Insights


### Visual Verification Strategy
*   **Problem**: Manual verification via browser agents can be flaky (state issues, selectors) and ephemeral.
*   **Solution**: Embed visual verification directly into the **E2E Test Suite** (Playwright).
    *   Use `await page.screenshot({ path: '...' })` within the test to generate guaranteed proof of the state at the exact moment of assertion.
    *   This provides a reproducible, version-controlled artifact of visual correctness.
*   **Rule**: "If it's visual, the test should take a picture."


## Architecture & Testing

### Robust Testing with `data-testid`
*   **Insight**: Relying on text content (e.g., `getByRole('button', { name: 'Close' })`) is fragile. A simple copy change ("Close" -> "Done") can break tests, even if functionality is intact.
*   **Ambiguity**: Common words like "Close" often appear multiple times (e.g., a modal close icon vs. a footer button), triggering "Strict Mode" violations in Playwright.
*   **Strategy**:
    *   Use `data-testid` for all test-critical elements (e.g., `data-testid="wizard-done-button"`).
    *   **Production Safety**: Configure the build system (e.g., Next.js `compiler.reactRemoveProperties`) to automatically strip `data-testid` attributes from production builds. This gives us the best of both worlds: robust dev/test experience and clean production DOM.

### Strategy Pattern for Validation
*   **Context**: The monolithic `validateGraph` function was becoming a "God Function", mixing disparate rules (cycles, connectivity, orphans).
*   **Refactoring**: We adopted the **Strategy Pattern**:
    *   **Orchestrator**: `graph-validation.ts` coordinates the process but knows nothing about specific rules.
    *   **Strategies**: Individual files (`self-cycle-validator.ts`, `multi-cycle-validator.ts`) encapsulate specific logic.
*   **Benefit**:
    *   **Testability**: Each validator is a pure function that can be unit-tested in isolation.
    *   **Extensibility**: Adding a new rule is as simple as adding a function to the list; no modification of the orchestrator is required.

### Smart Components, Dumb Containers
*   **Context**: The main `LineageGraph` component was over 300 lines long, handling both layout and complex SVG path calculations for edges.
*   **Refactoring**: We pushed the complexity **down** into the child component (`CustomEdge`).
*   **Pattern**:
    *   **Smart Child**: `CustomEdge` (and its helper `edge-path-utils`) "owns" the logic for how it looks (self-loops, backward arcs).
    *   **Dumb Parent**: `LineageGraph` focuses purely on **Composition**—assembling the parts without knowing their internal details.
*   **Benefit**: The parent component becomes declarative and readable, while the complex logic is encapsulated where it belongs.

### Hexagonal Architecture in Frontend
*   **Observation**: We inadvertently built a clean Hexagonal Architecture.
    *   **Domain (Hexagon)**: `graph-validation.ts` and its validators are pure TypeScript with zero UI dependencies.
    *   **Adapter (Driven)**: `reactflow-mapper.ts` acts as an Anti-Corruption Layer, translating pure Domain objects into the specific format required by the UI library (ReactFlow).
*   **Insight**: This separation allows the business logic to be tested without a browser and makes the UI library swappable.
