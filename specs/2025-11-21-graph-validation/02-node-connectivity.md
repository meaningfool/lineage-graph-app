# Slice 2: Node Connectivity (Flow)

## Goal
Ensure that nodes adhere to the flow rules of a lineage graph based on their type (`INPUT`, `STEP`, `OUTPUT`).

## Validation Logic
- **INPUT Nodes**: Must have at least one **outgoing** edge.
- **OUTPUT Nodes**: Must have at least one **incoming** edge.
- **STEP Nodes**: Must have at least one **incoming** AND at least one **outgoing** edge.

## User Experience
- **Visual**:
    - Highlight invalid nodes with a **red border**.
- **Interaction**:
    - Hovering shows specific error: e.g., "STEP node missing outgoing connection."

## Testing Strategy (E2E)
- **Test Case**: `should validate node connectivity rules`
- **Steps**:
    1. Import a CSV with:
        - `INPUT` node with no target.
        - `STEP` node with only incoming edges.
        - `OUTPUT` node with no source.
    2. Verify all 3 nodes are highlighted.
    3. Verify tooltips show the correct specific error message for each type.
