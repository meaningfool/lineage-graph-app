# Learnings - Graph Validation

## Technical Insights

### ReactFlow & Tooltips
*   **Problem**: Standard absolute positioning (`position: absolute`) inside a custom node is clipped by the ReactFlow canvas or z-index stacking contexts.
*   **Solution**: Use `<NodeToolbar>` component from `reactflow`. It uses React Portals to render content outside the node's DOM hierarchy, ensuring it floats above the canvas and is not clipped.
*   **Best Practice**: Always use `NodeToolbar` for node-attached overlays (tooltips, context menus).

### Visual Verification Strategy
*   **Problem**: Manual verification via browser agents can be flaky (state issues, selectors) and ephemeral.
*   **Solution**: Embed visual verification directly into the **E2E Test Suite** (Playwright).
    *   Use `await page.screenshot({ path: '...' })` within the test to generate guaranteed proof of the state at the exact moment of assertion.
    *   This provides a reproducible, version-controlled artifact of visual correctness.
*   **Rule**: "If it's visual, the test should take a picture."

### Hydration Errors
*   **Observation**: Browser automation tools (or extensions) may inject classes (e.g., `antigravity-scroll-lock`) that cause React hydration mismatches (`Warning: Prop className did not match`).
*   **Impact**: Usually benign for logic testing but annoying in console logs. Be aware of this when debugging "hydration failed" errors in E2E environments.
