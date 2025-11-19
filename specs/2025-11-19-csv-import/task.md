# Task: CSV Import Feature (Vertical Slicing)

We are rebuilding the CSV Import feature using a "Vertical Slice" approach to avoid premature engineering.

- [ ] **Phase 1: Basic CSV Upload (Nodes Only)** <!-- id: 0 -->
    - [ ] **Plan**: Design the "Upload CSV" modal and data flow <!-- id: 1 -->
    - [ ] **UI**: Create `CSVImportModal` with file input <!-- id: 2 -->
    - [ ] **Logic**: Parse CSV using `papaparse` (client-side) <!-- id: 3 -->
    - [ ] **State**: Store nodes in React state (replace `target-lineage.json`) <!-- id: 4 -->
    - [ ] **Verify**: Upload a CSV and see nodes appear on the graph <!-- id: 5 -->

- [ ] **Phase 2: Edge Support** <!-- id: 6 -->
    - [ ] **Plan**: Design edge CSV structure and linking logic <!-- id: 7 -->
    - [ ] **UI**: Add second file input for Edges (or single file with structure?) <!-- id: 8 -->
    - [ ] **Logic**: Link nodes based on Source/Target IDs <!-- id: 9 -->
    - [ ] **Verify**: Upload Nodes + Edges and see the full graph <!-- id: 10 -->

- [ ] **Phase 3: Validation & Error Handling** <!-- id: 11 -->
    - [ ] **Logic**: Add basic validation (missing columns, duplicate IDs) <!-- id: 12 -->
    - [ ] **UI**: Display validation errors in the modal <!-- id: 13 -->
