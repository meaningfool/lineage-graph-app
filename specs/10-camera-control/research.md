# Research: Camera Control & Layout Timing

## React Flow `fitView` Race Conditions

### Context
We aimed to implement "Auto-Fit on Load" (Slice 1) using a purely declarative approach:
1.  **Component Keying**: Remounting `<LineageGraph key={id} />` to force a fresh instance.
2.  **Native Prop**: Using `<ReactFlow fitView />` prop.
3.  **Native Hook**: Using `onNodesInitialized` or `useNodesInitialized`.

### Findings
All "Clean" approaches failed E2E tests with `viewport ratio 0` or timeouts.
*   **Root Cause**: The React Render Cycle (Virtual DOM) runs faster than the Browser Paint Cycle (DOM Dimensions).
*   **Timeline**:
    1.  React Mounts `<ReactFlow>`.
    2.  `fitView` prop triggers immediately.
    3.  Custom Nodes are mounted but have `width: 0` until browser paint.
    4.  `fitView` fails (nothing to fit).
    5.  Browser paints nodes (Dimensions ready).
*   **Failure of `useNodesInitialized`**: Even the native hook fires `true` when nodes are registered in the store, which may happen slightly before the DOM elements have reported back their final calculated dimensions (especially with custom CSS-heavy nodes).

### Conclusion
The **Hybrid Approach** is required for robustness:
1.  **Key-Based Reset**: Guarantees zero stale state (selection, focus).
2.  **Imperative `useEffect`**: Bridges the gap between Render and Paint.
3.  **`setTimeout` (50ms)**: Essential buffer to allow one full browser paint frame before calculating bounds.

This pattern is not "bad practice" but a necessary bridge when coordinating React State with an imperative Layout Engine (ELK/ReactFlow) and the DOM.
