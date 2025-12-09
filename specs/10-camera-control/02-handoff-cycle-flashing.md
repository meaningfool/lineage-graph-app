# Handoff Report: Cycle Flashing Implementation (Spec 10, Slice 2)

## Context
We successfully identified the pattern for "Cycle Flashing" before a reset was required. The logic relies on correctly propagating the error structure from the Validator to the UI without causing rendering crashes.

## The Critical Finding: "Rich Error" Interface
The core challenge was a breaking change in the Validation Interface which caused UI crashes.

### 1. Interface Change
The Validation Logic was upgraded to return "Rich Objects" instead of simple strings, to support the "Cycle Flashing" feature (which needs `relatedIds`).

**File**: `apps/web/src/lib/graph-validation.ts`
```typescript
export interface ValidationError {
    message: string;
    relatedIds?: string[]; // The nodes involved in the cycle
}
```

### 2. The "Masked" Crash
The `reactflow-mapper` passes these error objects directly to `data.validationErrors`.
The `CustomEdge` component previously assumed `validationErrors` was an array of strings.
**Bug**: Rendering `<div>{error}</div>` when `error` is an object causes a React Crash (`Objects are not valid as a React child`).

### 3. The Verified Fix
The solution is **defensive rendering** in the UI components, accepting that the upstream data format has changed.

**File**: `apps/web/src/components/graph/custom-edge.tsx`
*   **Action**: Update the Tooltip renderer to handle both strings (legacy) and objects (new).
```tsx
{errors.map((err: any, i) => (
    <div key={i}>
        {/* Safely handle Rich Error Object OR String */ }
        {err.message || err}
    </div>
))}
```

## Cycle Flashing Logic (LineageGraphContent)
To implement the flashing behavior:

1.  **State**: Add `flashingEdgeIds` (Set<string>) to `LineageGraphContent`.
2.  **Handler**: In `handleErrorClick`:
    *   Check if `error.relatedIds` exists.
    *   Identify edges connecting these nodes.
    *   Update `flashingEdgeIds`.
3.  **Prop Propagation**:
    *   Pass `isFlashing={flashingEdgeIds.has(edge.id)}` to the `CustomEdge` via `customEdges` memo.
    *   This requires `CustomEdge` to accept and visualize `isFlashing`.

## Architecture Change: Context Separation
To enable camera control features (like `fitView` for cycle flashing), we had to refactor the main component.

*   **Problem**: `useReactFlow()` hook throws an error if used in the same component that renders `<ReactFlowProvider>`.
*   **Solution**: Split `LineageGraph` into two:
    1.  `LineageGraph` (Parent): Renders the `<ReactFlowProvider>` and the Child.
    2.  `LineageGraphContent` (Child): Contains the `ReactFlow` component and all logic (state, hooks). This allows it to call `useReactFlow()` safely to access the viewport instance.

## Summary for Implementation
Do NOT rewrite the ID generation or Validator keys.
**DO** ensure correct handling of the `ValidationError` object structure in `CustomEdge` and `NodeDetailsPanel` to prevent crashes and allow access to `relatedIds`.
**DO** maintain the split between `LineageGraph` and `LineageGraphContent` to support camera operations.
