# Task: Demo Polish

## Status
- [ ] **Spec 1: Demo Content**
    - [x] **Domain Selection**: Chemical Processing (Jagged Algorithm selected). <!-- id: 5 -->
    - [x] **Implementation**:
        - [x] Create `scripts/generate_demo_fixture.py` <!-- id: 6 -->
        - [x] Generate `demo-polish` fixtures <!-- id: 7 -->
    - [ ] Dry-run the video script <!-- id: 1 -->
    - [ ] Draft Blog Post <!-- id: 2 -->
    - [ ] Draft Social Media Posts <!-- id: 3 -->

- [ ] **Spec 2: Import Wizard Redesign**
    - [x] **Phase 1: Design & Static UI**
        - [x] Review Inspiration Screenshots (Hybrid Motif/Superdesign plan created) <!-- id: 8 -->
        - [x] Implement `ImportWizardDialog` scaffold <!-- id: 14 -->
        - [x] Build `MappingTable` with MultiSelect <!-- id: 15 -->
        - [x] Build `UploadStep` (Side-by-side dropzones) <!-- id: 16 -->
    - [ ] **Phase 2: Functional Wiring (TDD Slices)**
        - [ ] **Slice 1:** Upload & File Validation (Test: Malformed, Dropzone) <!-- id: 17 -->
        - [ ] **Slice 2:** Node Mapping & Reset (Happy Path) (Required Fields, Basic Reset) <!-- id: 18 -->
        - [ ] **Slice 3:** Edge Mapping (Happy Path) (Exclusion Logic, Required Fields) <!-- id: 19 -->
        - [ ] **Slice 4:** Happy Path Integration & Lifecycle (E2E, Replace Graph, **Graph-Validation Regression**) <!-- id: 20 -->
        - [ ] **Slice 5:** Validation & Error Handling (Invalid Data, Orphans, **Error-Display Regression**) <!-- id: 21 -->
        - [ ] **Slice 6:** Advanced (Properties) (Pills UI, **Node-Properties Regression**) <!-- id: 22 -->

- [ ] **Spec 3: Final Polish**
    - [ ] Check Tooltips & Micro-interactions <!-- id: 12 -->
    - [ ] Clean up temporary assets <!-- id: 13 -->
