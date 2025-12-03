# Learnings: Node Properties

## E2E Testing & Selectors
*   **Dynamic Aria-Labels**: Components (like ShadCN MultiSelect) often update `aria-label` to reflect state (e.g., "prop1, selected"). This breaks `getByRole` selectors that rely on exact name matches.
*   **Policy Reinforcement**: Always prefer state-independent attributes like `data-value` or `data-testid` over text content or accessibility labels for selection logic.
*   **Failure Protocol**: When a selector fails, do not guess. Inspect the DOM immediately to find stable attributes.

## Tooling
*   **Browser Subagent vs. MCP**: The Browser Subagent is a user-centric tool perfect for UI verification and "inspect element" tasks (via DOM dumps). It is distinct from the code-centric Chrome DevTools MCP, which is better for deep protocol debugging.
