# Spec 13: Subtree Camera Focus

## Goal
Ensure that the camera automatically pans and zooms to fit the highlighted subtree when a user activates the "Focus" mode on a node. This provides immediate visual context of the relevant lineage without requiring manual navigation.

## Slice 1: Camera Fit on Focus
**Goal**: Call `fitView` for the highlighted subset of nodes when focus is activated.

### Test Scenarios

#### Scenario: Focus Refocuses after Panning Away
- **Setup**: Focus is active on Node B (centered on ABC).
- **Action**: 
    1. Pan the camera significantly away from ABC.
    2. Click "Clear Focus".
    3. Click "Focus Subtree" again.
- **Assertion**:
    - The camera should return to ABC and fit them in the viewport.

#### Scenario: Clear Focus Resets View
- **Setup**: Focus is active on Node B (zoomed in).
- **Action**: Click "Clear Focus".
- **Assertion**:
    - The camera should reset to fit the entire graph (including Node D) again.

## Implementation Details
- **Component**: `LineageGraphContent` (`apps/web/src/components/lineage-graph.tsx`)
- **Action**: Update `handleToggleFocus` to:
    1. Identify the set of nodes to be highlighted (already calculated as `highlightedNodeIds`).
    2. Call `fitView({ nodes: targets, duration: 800, padding: 0.2 })` when a node is highlighted.
    3. Call `fitView({ duration: 800, padding: 0.2 })` when focus is cleared.

## Verification Plan
- **E2E Test**: New tests in `apps/web/e2e/subtree-highlighting.spec.ts` using `toBeInViewport()` and viewport transform checks.
