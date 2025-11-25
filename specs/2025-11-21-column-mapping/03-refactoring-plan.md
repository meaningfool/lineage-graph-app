# Refactoring Plan: CSV Import Modal

**Objective**: Decompose the monolithic `CSVImportModal` into focused, testable units to improve maintainability and separate concerns.
**Status**: Draft
**Related Specs**: `cycle4-technical-review.md`, `02-refinement-plan.md`

---

## 1. Architecture Overview

We will move from a "God Component" architecture to a Layered Architecture:

```
src/
  components/
    csv-import/
      csv-import-modal.tsx      (Coordinator: Connects Hook to UI)
      step-upload.tsx           (Presentational: Dropzones)
      step-mapping.tsx          (Presentational: Form)
      step-results.tsx          (Presentational: Feedback)
  hooks/
    use-csv-import-wizard.ts    (State Machine: Wizard Flow)
  lib/
    csv-graph-importer.ts       (Domain Logic: Parsing & Validation)
```

---

## 2. Implementation Steps

### Phase 1: Extract Domain Logic (The "Brain")
*Goal: Move complex parsing and validation logic into a pure, testable module.*

**File**: `apps/web/src/lib/csv-graph-importer.ts`

**Key Functions to Extract**:
1.  `sanitizeId(id: string): string`
2.  `parseMapping(raw: MappingState): ValidatedMapping | null`
3.  `buildGraphFromCsv(...)`:
    *   **Input**: Raw parsed CSV data (Nodes & Edges), Validated Mapping.
    *   **Output**: `{ nodes: GraphNode[], edges: GraphEdge[], warnings: string[], error: string | null }`
    *   **Logic**: Contains all the node/edge creation, deduplication, referential integrity checks, and warning limits.
    *   **Note**: Returns pure domain types (`GraphNode`, `GraphEdge`), NOT React Flow types.

**Domain Types**:
```typescript
export interface GraphNode {
  id: string;
  title: string;
  type: "INPUT" | "STEP" | "OUTPUT";
}

export interface GraphEdge {
  source: string;
  target: string;
}
```

**Naming Convention**:
*   Use `currentStep` (not `step`) for the wizard state to match existing code.

**Testing Strategy**:
*   **Unit Tests** (Optional): We can add `apps/web/src/lib/csv-graph-importer.test.ts` for fast feedback on edge cases, but it is not strictly required if E2E coverage is good.
*   **Benefit**: Faster than E2E for testing specific validation rules.

### Phase 2: Extract State Management (The "State Machine")
*Goal: Encapsulate wizard state and transitions in a custom hook.*

**File**: `apps/web/src/hooks/use-csv-import-wizard.ts`

**Responsibilities**:
*   Manage state: `step`, `files`, `columns`, `mapping`, `feedback`.
*   Expose Actions: `setNodesFile`, `goToMapping`, `submitImport`, `reset`.
*   **Fix**: Ensure `reset` is called correctly (addressing the `onClose` prop issue identified in review).

**Testing Strategy**:
*   **Reliance on E2E**: We will rely on the existing E2E tests to verify the wizard flow. Dedicated hook tests are considered low-value for this refactor.

### Phase 3: Componentize UI (The "View")
*Goal: Break the render function into small, focused components.*

**Files**:
*   `apps/web/src/components/csv-import/step-upload.tsx`
*   `apps/web/src/components/csv-import/step-mapping.tsx`
*   `apps/web/src/components/csv-import/step-results.tsx`
*   `apps/web/src/components/csv-import/csv-import-modal.tsx` (Main)

**Responsibilities**:
*   **Sub-components**: Purely presentational. Receive data and callbacks via props. No internal state (except maybe simple local UI state like hover).
*   **Main Component**:
    *   Calls `useCsvImportWizard`.
    *   Renders the `Dialog`.
    *   Switches between sub-components based on `wizard.step`.
    *   Passes `wizard.actions` to sub-components.

**Testing Strategy**:
*   **E2E Tests (Primary)**: The existing `csv-import.spec.ts` MUST pass **without modification**. This is our main safety net.

---

## 3. Detailed Task List

- [ ] **Phase 1: Domain Logic**
    - [ ] Create `lib/csv-graph-importer.ts`.
    - [ ] Move `sanitizeId`, `parseMapping`, `isNode`, `isEdge`.
    - [ ] Implement `buildGraphFromCsv`.
- [ ] **Phase 2: State Management**
    - [ ] Create `hooks/use-csv-import-wizard.ts`.
    - [ ] Move state variables and `reset` logic.
    - [ ] Implement `handleUploadNext` and `handleFinalImport` (delegating to `csv-graph-importer`).
- [ ] **Phase 3: UI Components**
    - [ ] Create `components/csv-import/` directory.
    - [ ] Extract `StepUpload`.
    - [ ] Extract `StepMapping`.
    - [ ] Extract `StepResults`.
    - [ ] Refactor `CSVImportModal` to use Hook + Sub-components.
- [ ] **Phase 4: Verification**
    - [ ] Run full E2E suite (`npx playwright test csv-import.spec.ts`).
    - [ ] Verify manual flows.

---

## 4. Addressing Specific Feedback

*   **Props vs Internal State**: The `CSVImportModal` will be updated to respect the `isOpen` prop if controlled, or we will clarify the contract. The hook will expose a `reset` method that can be triggered by the Dialog's `onOpenChange` or `onAnimationEnd`.
*   **Type Safety**: We will use generics for `Papa.parse` results in the domain logic module to avoid `as any[]` casting where possible.
*   **Helper Functions**: The `buildGraphFromCsv` function will internally use helpers like `createNodes` and `createEdges` to keep the logic clean.
