# Learnings: Cleanup Codebase

*   **Test Separation**: Vitest runs unit tests in `src/` (JSDOM), while Playwright runs E2E tests in `e2e/` (Real Browser); they do not overlap.
*   **Smoke Testing Definition**: A "smoke test" is a quick, high-level check to ensure the application launches and critical paths work, rather than a deep regression test.
*   **Playwright Automation**: Configuring the `webServer` block in `playwright.config.ts` allows `pnpm test:e2e` to automatically start the dev server, preventing connection errors.
*   **E2E Tooling Comparison**:
    *   **Playwright**: Best for **persistent, automated regression testing** in CI/CD (fast, deterministic, headless).
    *   **Chrome DevTools MCP**: Best for **interactive debugging** by an AI agent (allows full inspection but is slow/expensive for CI).
    *   **Browser Subagent**: Best for **ad-hoc verification** by an agent during a task (cannot be scripted for CI).
*   **Linter Comparison**:
    *   **Biome**: An all-in-one tool (linter + formatter) that is extremely fast and aims to replace Prettier/ESLint. We use this for `pnpm check`.
    *   **Oxlint**: A specialized, high-performance linter focused solely on correctness (no formatting). It is often used as a faster complement to ESLint, but Biome covers both roles for us.
