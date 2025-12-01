# Research: Codebase Audit (2025-11-19)

## Findings

### 1. Dead Code
*   `apps/web/src/utils/simple-dag-generator.ts` is unused in the application. It was likely a prototype or utility for generating test data, but it's not imported by `page.tsx` or `lineage-graph.tsx`.

### 2. Test Quality
*   `apps/web/src/app/__tests__/page.test.tsx` is brittle.
    *   It mocks `reactflow` entirely, meaning it tests the mock, not the library integration.
    *   It mocks `trpc`, which is no longer used in `page.tsx`.
    *   It tests implementation details (`data-testid`) that are tightly coupled to the specific mock implementation.
    *   **Recommendation**: Delete and replace with robust tests later.

### 3. Architecture
*   `page.tsx` currently handles data loading, layout calculation (Dagre), and rendering. This violates separation of concerns.
*   `lineage-graph.tsx` is a good "dumb" component.

# Research: E2E Testing Strategy (2025-11-19)

## Findings

### 1. Tool Comparison & CI Portability

| Feature | **Playwright** | **Chrome DevTools MCP** | **Browser Subagent** |
| :--- | :--- | :--- | :--- |
| **Primary Purpose** | **Persistent Testing** (CI/CD) | **Interactive Debugging** (Agent) | **Ad-hoc Verification** (Agent) |
| **Execution Model** | Runs via `pnpm test` script | Runs via MCP Server (User-hosted) | Runs via Agent Tool (`browser_subagent`) |
| **CI Portability** | **High**. Standard binary, headless mode, deterministic. | **Low**. Requires spinning up an AI Agent + MCP Server in CI. Slow & expensive. | **None**. Cannot be scripted for CI. |
| **Network Access** | **Yes** (Intercept, Mock, Log) | **Yes** (Full DevTools Access) | **Yes** (Basic Logs) |
| **Console Access** | **Yes** (Listen to events) | **Yes** (Full Console Access) | **Yes** (Capture output) |

### 2. Unit vs E2E Testing

| Feature | **Unit Test (Vitest)** | **E2E Test (Playwright)** |
| :--- | :--- | :--- |
| **File Path** | `src/__tests__/smoke.test.ts` | `e2e/smoke.spec.ts` |
| **Config Rule** | Look inside `src/` | Look inside `e2e/` |
| **Environment** | JSDOM (Fake Browser) | Chromium (Real Browser) |
| **Speed** | Milliseconds | Seconds |
| **Goal** | "Does the code compile and run?" | "Can a user see the website?" |

### 3. Why Playwright?
*   **The Requirement**: We need a test strategy that works locally *and* in CI (GitHub Actions).
*   **The Problem with MCP in CI**: While technically possible, running an MCP agent in CI is over-engineering for a regression test. It introduces non-determinism (AI behavior) and cost (tokens) into a process that should be fast and cheap.
*   **The Solution**: Playwright is the industry standard for this. It provides a "Runner" (`@playwright/test`) and a "Driver" (controlling Chrome via CDP). It is deterministic, fast, and free to run.

### 4. Historical Investigation (In Progress)
*   **User Query**: "I had some tests that in my opinion were end-to-end tests... I don't think it was using Playwright."
*   **Hypothesis**: These might have been:
    *   **Vitest/Jest with JSDOM**: Rendering the full `<Page />` component. This *looks* like E2E but runs in Node.js (no real browser).
    *   **Cypress**: A common alternative to Playwright.
    *   **Puppeteer**: Raw Puppeteer scripts.
*   **Action**: I am currently searching the git history for evidence of these tests.
