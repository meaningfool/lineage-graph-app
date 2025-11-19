# Implementation Plan - Phase 1: Basic CSV Upload (Nodes Only)

## Goal
Allow the user to upload a simple CSV file containing node definitions. The app will parse this file and replace the hardcoded `target-lineage.json` data with the uploaded nodes.
**Key Constraint:** No edges yet. Just display the nodes to verify the pipeline.

## User Review Required
> [!IMPORTANT]
> We are replacing the hardcoded `target-lineage.json` with dynamic state. The initial view will be empty until a file is uploaded (or we keep the default as a placeholder).

## Proposed Changes

### UI Components
#### [NEW] [csv-import-modal.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/components/csv-import-modal.tsx)
- A simple Dialog component using `radix-ui`.
- Contains a file input (`<input type="file" accept=".csv" />`).
- "Import" button.

#### [MODIFY] [page.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/app/page.tsx)
- Add state: `const [nodes, setNodes] = useState(initialNodes)`
- Add "Import CSV" button to the header/toolbar.
- Render `CSVImportModal` when button is clicked.
- Pass `setNodes` to the modal to update the graph.

### Logic
#### [NEW] [csv-parser.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/utils/csv-parser.ts)
- Use `papaparse` to parse the file.
- **Expected Format:** `id, label, [properties...]`
- Transform parsed rows into ReactFlow `Node` objects.
- Basic validation: Ensure `id` column exists.

## Verification Plan

### Automated Tests
- Unit test for `csv-parser.ts`:
    - Test valid CSV parsing.
    - Test missing `id` column error.
- Component test for `CSVImportModal`:
    - Verify file selection triggers parsing.

### Manual Verification
1. Open app.
2. Click "Import CSV".
3. Select `legacy_assets/test-files/valid/valid-basic-nodes.csv`.
4. Verify that the graph updates to show the nodes from the CSV.
