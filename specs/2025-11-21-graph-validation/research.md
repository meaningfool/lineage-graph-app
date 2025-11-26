# Research: Graph Validation

## Context
To be populated during planning.

## References
- Cycle detection algorithms (DFS, topological sort)
- Graph traversal for orphan detection

## Technical Observations

### Hydration Errors
*   **Observation**: Browser automation tools (or extensions) may inject classes (e.g., `antigravity-scroll-lock`) that cause React hydration mismatches (`Warning: Prop className did not match`).
*   **Impact**: Usually benign for logic testing but annoying in console logs. Be aware of this when debugging "hydration failed" errors in E2E environments.

## Architectural Reviews
- [Code Quality Review](./post-03-code-quality-review.md)
- [Architecture Review](./post-04-architecture-review.md)
