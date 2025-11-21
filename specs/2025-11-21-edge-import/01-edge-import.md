# Phase 1: Edge Import

## Goal
Enable importing edges between nodes via CSV, allowing users to define relationships in the lineage graph.

## Requirements
1.  **Multi-Zone UI**:
    *   **Nodes Dropzone**: Required. Accepts `nodes.csv`.
    *   **Edges Dropzone**: Optional (but required if user wants edges). Accepts `edges.csv`.
    *   **Import Action**: Single "Import" button that processes both files together.

2.  **Validation**:
    *   **File Presence**: "Import" button disabled if Nodes file is missing.
    *   **Edge Validation**:
        *   Required columns: `source`, `target`.
        *   **Referential Integrity**: Since we have both files, we **MUST** validate that every edge's `source` and `target` exists in the `nodes` list.
        *   Invalid edges should be dropped with a warning.

3.  **User Feedback**:
    *   Show status for both files (e.g., "Nodes: 5 valid", "Edges: 4 valid, 1 dropped").

## TDD Cycles

## TDD Cycles

### Cycle 1: Dual Dropzone UI (Red/Green)
*   **Goal**: Update UI to support two dropzones and ensure existing tests pass with the new UI structure.
*   **Red**: Update existing tests to target the specific "Nodes" dropzone.
    *   **Modify**: `should upload a valid CSV and display nodes` -> Target `data-testid="dropzone-nodes"`.
    *   **Modify**: `should reject file with missing required columns` -> Target `data-testid="dropzone-nodes"`.
    *   **Modify**: `should clear error message when modal is closed and reopened` -> Target `data-testid="dropzone-nodes"`.
    *   **Modify**: `should drop rows with invalid node types and show summary` -> Target `data-testid="dropzone-nodes"`.
    *   **Modify**: `should deduplicate rows with duplicate IDs and show warning` -> Target `data-testid="dropzone-nodes"`.
    *   **New Test**: `should have disabled import button initially` -> Verify button is disabled until nodes are uploaded.
*   **Green**: Implement two dropzones in `CSVImportModal`. Add `data-testid`s. Implement "Import" button logic.

### Cycle 2: Edge Passthrough (Red/Green)
*   **Goal**: Ensure uploading an edges file (without validation yet) does not break the node import.
*   **Red**: New test for uploading both files.
    *   **New Test**: `should allow uploading an edges file along with nodes`
        *   Upload nodes to `dropzone-nodes`.
        *   Upload edges to `dropzone-edges`.
        *   Click Import.
        *   Verify nodes are displayed (edges ignored for now).
*   **Green**: Update state to accept `edgesFile`. Ensure `onImport` still works for nodes even if edges are present.

### Cycle 3: Parsing & Integrity (Red/Green)
*   **Goal**: Parse edges and validate them against the nodes.
*   **Red**: Test validation logic.
    *   **New Test**: `should reject edges pointing to missing nodes`
        *   Upload valid nodes.
        *   Upload edges with `source: "missing-id"`.
        *   Verify warning: "Edge dropped: Source 'missing-id' not found".
*   **Green**: Implement edge parsing and cross-validation logic.

### Cycle 4: Graph Rendering (Red/Green)
*   **Goal**: Render the edges on the graph.
*   **Red**: Verify edges appear.
    *   **Modify**: `should allow uploading an edges file along with nodes` -> Add assertion: `expect(page.locator(".react-flow__edge")).toHaveCount(X)`.
*   **Green**: Update `onImport` to pass edges to parent. Update `LineageGraph` (if needed) or `page.tsx` to handle edges.

### Cycle 5: Cascading Validation & Edge Cases (Red/Green)
*   **Goal**: Ensure edges are dropped if they point to nodes that were dropped (e.g., due to invalid type), and verify both source/target validation.
*   **Red**:
    *   **New Test**: `should reject edges pointing to nodes dropped due to validation errors`
        *   Upload nodes with one valid node and one invalid-type node.
        *   Upload edges pointing to the invalid-type node.
        *   Verify edge is dropped with warning.
    *   **New Test**: `should reject edges pointing to missing target node`
        *   Upload valid nodes.
        *   Upload edge with valid source but missing target.
        *   Verify edge is dropped with warning.
*   **Green**:
    *   Update `CSVImportModal` to build the valid node ID set *only* from nodes that passed all validation checks.
    *   Ensure edge validation checks both `source` and `target` against this valid set.

### Cycle 6: Synthetic IDs & Silent Deduplication (Red/Green)
*   **Goal**: Always generate synthetic IDs for edges (ignore user `id` column) and silently deduplicate parallel edges.
*   **Red**:
    *   **New Test**: `should import edges with only source and target columns`
        *   Upload edges with `source,target` header.
        *   Verify import succeeds.
    *   **New Test**: `should silently deduplicate parallel edges`
        *   Upload edges with duplicate `source,target` pairs.
        *   Verify only 1 edge is created.
        *   Verify **no** warning is shown.
*   **Green**:
    *   Update `CSVImportModal`:
        *   Change required edge columns to `['source', 'target']`.
        *   **Always** generate ID: `edge-${source}-${target}`.
        *   Deduplicate based on `${source}-${target}`.
        *   Remove "Duplicate Edge ID" warning logic.
