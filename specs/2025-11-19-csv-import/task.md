# Task: CSV Import Feature (TDD)

We are building the CSV Import feature using strict TDD (Red/Green) cycles.

- [x] **Phase 1: Basic CSV Upload (Nodes Only)** <!-- id: 0 -->
    - [x] Create `01-simple-import.md` spec <!-- id: 1 -->
    - [x] Implement `CSVImportModal` with `react-dropzone` <!-- id: 2 -->
    - [x] Implement basic parsing with `papaparse` (no validation yet) <!-- id: 3 -->
    - [x] Update `LineageGraph` to render imported nodes <!-- id: 4 -->
    - [x] Verify with `valid-basic-nodes.csv` <!-- id: 5 -->

- [ ] **Phase 2: Node Validation & Types** <!-- id: 5 -->
    - [ ] **Spec**: `02-node-validation.md` <!-- id: 6 -->
    - [ ] **Red**: Create tests for: <!-- id: 7 -->
        - [ ] Missing ID (Validation Error) <!-- id: 8 -->
        - [ ] Invalid Node Type (Validation Error) <!-- id: 9 -->
        - [ ] Rendering correct types (Input vs Processing vs Output) <!-- id: 10 -->
    - [ ] **Green**: Implement validation logic (port from `legacy_assets`) and update Node components <!-- id: 11 -->

- [ ] **Phase 3: Edge Support** <!-- id: 12 -->
    - [ ] **Spec**: `03-edge-import.md` <!-- id: 13 -->
    - [ ] **Red**: Create test for uploading Nodes + Edges CSVs <!-- id: 14 -->
    - [ ] **Green**: Implement edge parsing and linking logic <!-- id: 15 -->
