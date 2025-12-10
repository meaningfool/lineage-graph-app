# Implementation Plan: Demo Polish (Fixture Generation)

## Goal
Create a Python script to generate a realistic, "jagged" Chemical Processing lineage graph for the marketing demo.

## User Review Required
*   **Algorithm Logic**: Confirm the "Layer Skipping" probability model.
*   **Vocabulary**: Are the implemented chemical terms sufficient?

## Proposed Changes
### 1. Script Location
`scripts/generate_demo_fixture.py` (New file).

### 2. Algorithm Design: Evolution & Choice

**v4 (Capacity Constraints) - SELECTED**
To solve the "Bottleneck" issue (small layers becoming super-hubs), we introduce **Connection Capacities**.

**Logic**:
1.  **Constraints First (The Box)**:
    *   `N_INPUTS`: ~3-5.
    *   `N_OUTPUTS`: ~4-6.
    *   `MAX_DEPTH`: ~6-8.
2.  **Volume Filling**:
    *   Layer 0: `N_INPUTS` nodes.
    *   Layer Max: `N_OUTPUTS` nodes.
    *   Mid Layers: Random(1, 4) nodes.
3.  **Capacity Assignment**:
    *   Each node gets randomized limits:
        *   `max_in`: 1 to 3.
        *   `max_out`: 1 to 3.
4.  **Wiring with Overflow (The Skipping Engine)**:
    *   Iterate Layer `d` from 0 to `MAX-1`.
    *   For each node in `d`:
        *   Try to connect to `d+1`.
        *   **CRITICAL**: If all nodes in `d+1` are AT CAPACITY (max_in reached), **Skip** to `d+2` (and so on).
        *   This naturally forces long edges over sparse layers.
    *   **Fallback**: If a node *cannot* find a target (e.g., end of graph full), overload the capacity constraint (soft limit) to ensure graph integrity.
5.  **Refinement**:
    *   Inject Cycle & Orphan.

### 3. Output Format
*   `apps/web/e2e/fixtures/demo-polish/nodes.csv` (id, label, type, properties...)
*   `apps/web/e2e/fixtures/demo-polish/edges.csv` (source, target, label)

## Verification Plan

### Automated
*   **Script Execution**: Run `python3 scripts/generate_demo_fixture.py` and check exit code.
*   **Validation**: Inspect the generated CSVs for:
    *   ~30 rows.
    *   Presence of "Cycle" and "Orphan" scenarios.

### Manual
*   **Visual Check**:
    1.  Start the app (`npm run dev`).
    2.  Import the generated CSVs.
    3.  Verify the graph looks "organic" (not a perfect grid).
    4.  Verify the Cycle is detected (Red Badge).
