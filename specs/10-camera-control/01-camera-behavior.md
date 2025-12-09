# Spec: Camera Behavior & Control

## Goal
Implement intelligent camera management to ensure the user always has the optimal view of the relevant data during key interactions (Load, Error Navigation, Isolation).

## Dedicated Fixtures

### 1. `fixtures/camera-control/wide_cluster`
Designed for single-node error centering and subtree isolation.
*   **Nodes**: `A` (0,0) [INPUT, Connectivity Error], `B` (200,0), `C` (400,0). `D` (2000,2000) [Outlier].
*   **Error**: Node A has incoming edge from D.

### 2. `fixtures/camera-control/cycle_distanced`
Designed for multi-node error fitting.
*   **Component 1 (Cycle)**: `A`->`B`->`C`->`D`->`A`. (Located at 0,0 to 400,400).
*   **Component 2 (Outlier)**: `E` (2000, 2000).
*   **Error**: "Cycle Detected" involving A, B, C, D.

## Slice 1: Initial Load (Auto-Fit)
**Goal**: When a graph is loaded, the view must scale/pan to fit ALL nodes.

**Test Strategy**:
*   **Fixture**: `wide_cluster`.
*   **Scenario 1**: `load_fits_outliers`
    *   **Action**: Import Graph.
    *   **Assertion**: All Nodes (A..D) in viewport. `Scale < 0.6`.
*   **Scenario 2**: `reload_resets_view`
    *   **Action**: Pan away -> Reload.
    *   **Assertion**: View resets to fit all.

## Slice 2: Error Navigation (Context Awareness)
**Goal**: Clicking an error focuses on the *subject* of the error (Single Node or Set of Nodes).

**Test Strategy A (Single Pnt)**:
*   **Fixture**: `wide_cluster`.
*   **Scenario**: `click_connectivity_error_centers_node`
    *   **Action**: Click "Input node... (Node A)" error.
    *   **Assertion**: `Distance(ViewCenter, NodeA) < 50px`. `Scale >= 1.0`.

**Test Strategy B (Multi-Node Set)**:
*   **Fixture**: `cycle_distanced`.
*   **Scenario**: `click_cycle_error_fits_cycle_component`
    *   **Action**: Click "Cycle Detected" error.
    *   **Assertion**:
        *   **In View**: Nodes A, B, C, D (The Cycle).
        *   **Out of View** (or ignored): Node E (The Outlier).
        *   **Differential**: `Scale(CycleError) > 1.5 * Scale(Load)`.
        *   **Reasoning**: Proves the camera calculated the bounding box of the *cycle participants* specifically, rather than just centering on one node or staying zoomed out.

## Slice 3: Subtree Focus (Fit Subtree)
**Goal**: Focus optimizes view for the *lineage*.

**Test Strategy**:
*   **Fixture**: `wide_cluster`.
*   **Scenario**: `focus_fits_active_subset`
    *   **Action**: Focus Node B (Highlights A, B, C).
    *   **Assertion**: `Scale(Subtree) > 1.5 * Scale(Load)`. (Proves D is ignored).

## Technical Implementation
*   `useReactFlow().fitView({ nodes: targets })`.
*   `useReactFlow().setCenter(x, y, { zoom: 1.2 })`.
