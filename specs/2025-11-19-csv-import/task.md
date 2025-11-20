# Task: CSV Import Feature (TDD)

We are building the CSV Import feature using strict TDD (Red/Green) cycles.

- [x] **Phase 1: Basic CSV Upload (Nodes Only)** <!-- id: 0 -->
    - [x] Create `01-simple-import.md` spec <!-- id: 1 -->
    - [x] Implement `CSVImportModal` with `react-dropzone` <!-- id: 2 -->
    - [x] Implement basic parsing with `papaparse` (no validation yet) <!-- id: 3 -->
    - [x] Update `LineageGraph` to render imported nodes <!-- id: 4 -->
    - [x] Verify with `valid-basic-nodes.csv` <!-- id: 5 -->

- [/] **Phase 2: Node Validation & Types** <!-- id: 5 -->
    - [x] **Spec**: `02-node-validation.md` <!-- id: 6 -->
    - [x] **Cycle 1: Missing Columns (RED)**: Create failing test for file-level validation <!-- id: 7 -->
    - [x] **Cycle 1: Missing Columns (GREEN)**: Implement column validation <!-- id: 8 -->
    - [ ] **Cycle 2: Invalid Types (RED)**: Create failing test for row-level validation <!-- id: 9 -->
    - [ ] **Cycle 2: Invalid Types (GREEN)**: Implement type validation and error UI <!-- id: 10 -->
    - [ ] **Cycle 3: Deduplication (RED)**: Create failing test for duplicate IDs <!-- id: 11 -->
    - [ ] **Cycle 3: Deduplication (GREEN)**: Implement deduplication logic <!-- id: 12 -->
    - [ ] **Green**: Implement validation logic (port from `legacy_assets`) and update Node components <!-- id: 11 -->

- [ ] **Phase 3: Edge Support** <!-- id: 12 -->
    - [ ] **Spec**: `03-edge-import.md` <!-- id: 13 -->
    - [ ] **Red**: Create test for uploading Nodes + Edges CSVs <!-- id: 14 -->
    - [ ] **Green**: Implement edge parsing and linking logic <!-- id: 15 -->
