# Implementation Plan: Demo Polish (Fixture Generation)

## Goal
Create a Python script to generate a realistic, "jagged" Chemical Processing lineage graph for the marketing demo.

## User Review Required
*   **Algorithm Logic**: Confirm the "Layer Skipping" probability model.
*   **Vocabulary**: Are the implemented chemical terms sufficient?

## Proposed Changes
### 1. Script Location
`scripts/generate_demo_fixture.py` (New file).

### 2. Algorithm Design
We can't just use fixed layers. We need a directed graph generator with controllable "chaos".

**Parameters**:
*   `N_NODES`: Total target nodes (~30).
*   `P_SKIP`: Probability of an edge skipping a layer (e.g., 0.3).
*   `P_BRANCH`: Probability of a node having >1 output (e.g., 0.2).
*   `P_MERGE`: Probability of a node having >1 input (e.g., 0.4).

**Process**:
1.  **Skeleton**: Generate a "Main Spine" (Longest Path) of ~5-6 nodes to ensure depth.
2.  **Population**: Add remaining nodes, assigning them rough "Depth" buckets ($D_0$ to $D_Max$).
3.  **Wiring (The Creative Part)**:
    *   Iterate through nodes.
    *   Connect Node $A$ (Depth $i$) to Node $B$ (Depth $j$) where $j > i$.
    *   **Jaggedness**: Allow $j$ to be much larger than $i+1$.
    *   **Vocabulary Assignment**: Assign names based on topology:
        *   Sources -> "Raw: {Ingredient}"
        *   Sinks -> "QC: {Test}" or "Product: {Name}"
        *   Intermediates -> "Step: {Verb}"
4.  **Error Injection**:
    *   Force 1 Cycle (finding a "Backwards" edge $j < i$ and adding it).
    *   Force 1 Orphan (Create a node, delete its incoming edges).

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
