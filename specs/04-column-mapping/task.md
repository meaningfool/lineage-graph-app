# Task: Column Mapping Wizard

## Status
Completed.

## Checklist
- [x] **Review**: Cycle 4 Technical Review <!-- id: 1 -->
- [x] **Refinement**: Fix issues identified in review <!-- id: 4 -->
    - [x] Remove redundant `useEffect` <!-- id: 5 -->
    - [x] Implement Strict Typing (Parse, Don't Validate) <!-- id: 8 -->
    - [x] Make Edge File Mandatory <!-- id: 9 -->
    - [x] Refactor State Structure <!-- id: 10 -->
    - [x] Fix Validation Logic (Edges & Next Button) <!-- id: 6 -->
    - [x] Limit Warning Messages <!-- id: 11 -->
    - [x] Sanitize IDs (Nodes & Edges) <!-- id: 12 -->
    - [x] Implement Type Predicates <!-- id: 13 -->
    - [x] Refactor Animation Cleanup <!-- id: 14 -->
    - [x] Prevent invalid column selection <!-- id: 7 -->
    - [x] **Phase 3: Validation & Polish (Enforce & refine)**
    - [x] Fix Validation Logic (Source != Target).
    - [x] Limit Warning Messages (Max 10).
    - [x] Implement Type Predicates (`isNode`, `isEdge`).
    - [x] Update E2E Tests.
    - [x] Phase 4: Verification
    - [x] Rename fixtures for clarity
    - [x] Reorganize test suite (remove redundancy, logical flow)
    - [x] Implement missing features (Reset, Malformed CSV, Canvas Wipe) to unskip tests
- [x] **Phase 4: Refactoring (The Great Split)**
    - [x] Extract Domain Logic (`csv-graph-importer.ts`).
    - [x] Extract State Management (`use-csv-import-wizard.ts`).
    - [x] Componentize UI (`StepUpload`, `StepMapping`, `StepResults`).
    - [x] Verify Refactor (E2E Tests).
- [x] **Verification**: Verify fixes <!-- id: 3 -->
