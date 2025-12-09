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

## Architecture: Coupling vs View Models

### The "Rich Error" Crash (2025-12-09)

#### Issue
Verified a bug where upgrading the validation logic to return rich objects (`{ message, relatedIds }`) instead of strings caused a frontend crash (`Objects are not valid as React child`).

#### Root Cause: Hidden Coupling
We had a dependency chain that looked decoupled but was actually tight:
*   **Domain**: Produces Data (Owner of structure).
*   **Adapter (`reactflow-mapper`)**: Forwards Data (Dumb pipe).
*   **UI (`CustomEdge`)**: Consumes Data (Implicitly expecting specific structure).

Because the Adapter didn't transform the data into a strict "View Shape", the UI was directly coupled to the Domain's internal error structure.

#### Insight: The Case for View Models
At valid scale, the **Adapter** should act as a **View Model Factory**:
*   **Input**: Domain Entities (GraphNode, ValidationError Object).
*   **Output**: UI Props (string `tooltipText`, boolean `isFlashing`).

```typescript
// Strict UI Contract
interface EdgeProps {
    tooltipText: string;
    isFlashing: boolean;
}
```

This ensures that changes in the Domain (e.g., adding `relatedIds`) break the **Adapter** (compile time error), not the **UI** (runtime crash).

#### Decision
For now, we patched the UI to handle the new structure to move fast. But for future refactoring, `reactflow-mapper` should verify/transform validation errors into strings/booleans rather than passing raw objects.
