# Task: CSV Import Feature (TDD)

We are building the CSV Import feature using strict TDD (Red/Green) cycles.

- [x] **Phase 1: Basic CSV Upload (Nodes Only)** <!-- id: 0 -->
    - [x] Create `01-simple-import.md` spec <!-- id: 1 -->
    - [x] Implement `CSVImportModal` with `react-dropzone` <!-- id: 2 -->
    - [x] Implement basic parsing with `papaparse` (no validation yet) <!-- id: 3 -->
    - [x] Update `LineageGraph` to render imported nodes <!-- id: 4 -->
    - [x] Verify with `valid-basic-nodes.csv` <!-- id: 5 -->

- [x] **Phase 2: Node Validation & Types** <!-- id: 5 -->
    - [x] **Spec**: `02-node-validation.md` <!-- id: 6 -->
    - [x] **Cycle 1: Missing Columns (RED)**: Create failing test for file-level validation <!-- id: 7 -->
    - [x] **Cycle 1: Missing Columns (GREEN)**: Implement column validation <!-- id: 8 -->
    - [x] **Cycle 2: Invalid Types (RED)**: Create failing test for row-level validation <!-- id: 9 -->
    - [x] **Cycle 2: Invalid Types (GREEN)**: Implement type validation and error UI <!-- id: 10 -->
    - [x] **Cycle 3: Deduplication (RED)**: Create failing test for duplicate IDs <!-- id: 11 -->
    - [x] **Cycle 3: Deduplication (GREEN)**: Implement deduplication logic <!-- id: 12 -->
    - [x] **Cycle 4: Wizard UX (RED)**: Update all 5 tests to expect multi-step wizard <!-- id: 13 -->
    - [x] **Cycle 4: Wizard UX (GREEN)**: Implement wizard state and transitions <!-- id: 14 -->

- [ ] **Phase 3: Edge Support** <!-- id: 12 -->
    - [ ] **Spec**: `03-edge-import.md` <!-- id: 13 -->
    - [ ] **Red**: Create test for uploading Nodes + Edges CSVs <!-- id: 14 -->
    - [ ] **Green**: Implement edge parsing and linking logic <!-- id: 15 -->
