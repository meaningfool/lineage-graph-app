# Refinement Plan: CSV Import Polish

**Objective**: Address technical debt, improve type safety, and refine UX based on the Cycle 4 Technical Review.
**Status**: Draft
**Related Specs**: `cycle4-technical-review.md`

---

## 1. Implementation Order & Logic

We will execute these changes in the following order to minimize regression risks and build upon a stable foundation.

### Phase 1: Structural Refactoring (Clean the House)
*Goal: Simplify the component state and cleanup logic before adding new validation rules.*

#### 1.1 Refactor State Structure
- **Change**: Group the 9 separate state variables into logical objects.
  - `files`: `{ nodes: File | null, edges: File | null }`
  - `columns`: `{ nodes: string[], edges: string[] }`
  - `feedback`: `{ error: string | null, warnings: string[] }`
- **Why**: Reduces "state explosion" and makes reset logic trivial.
- **Testing**: Existing E2E tests must pass without modification.

#### 1.2 Refactor Animation Cleanup
- **Change**: Remove the `useEffect` hook and the hardcoded `setTimeout(..., 300)`.
- **Implementation**: Use the `onAnimationEnd` (or equivalent) event on the Dialog content to trigger the `resetState` function.
- **Why**: Removes "magic numbers" and prevents race conditions where state is cleared before the modal closes.
- **Testing**: Manual verification that the modal content doesn't "flash" or disappear before the closing animation finishes.

---

### Phase 2: Core Logic Changes (Change the Rules)
*Goal: Enforce new requirements (mandatory edges) and improve data safety.*

#### 2.1 Make Edge File Mandatory
- **Change**: Update `handleUploadNext` to require *both* `nodesFile` and `edgesFile`.
- **UI**: Update the "Edges CSV" label to remove "(Optional)" and add "(Required)".
- **Logic**: Disable "Next" button in Step 1 until both files are present.
- **Testing**:
  - **Update**: Existing E2E tests that omit edge files will fail. They must be updated to always provide an edge file.
  - **New Test**: Verify "Next" button is disabled if only Nodes CSV is uploaded.

#### 2.2 Implement Strict Typing ("Parse, Don't Validate")
- **Change**: Create strict types `ValidatedMapping` and `ValidatedEdgeMapping` (all fields required).
- **Logic**: In `handleFinalImport`, parse the loose UI state (`mapping`) into these strict objects *before* passing them to processing functions.
- **Why**: Removes the need for `!` assertions and `as string` casts later in the pipeline.
- **Testing**: Internal refactor; existing tests must pass.

#### 2.3 Sanitize IDs
- **Change**: Create a helper `sanitizeId(raw: string): string`.
  - Logic: Trim whitespace, maybe replace special chars (TBD), ensure consistency.
- **Implementation**: Apply this function to `node.id`, `edge.source`, and `edge.target` immediately upon parsing.
- **Why**: Ensures that `Node "A"` and `Edge -> "Node A"` match perfectly, even if the raw CSV has subtle issues.
- **Testing**:
  - **New Test**: Upload a CSV with special characters in IDs (e.g., `My Node #1`) and verify the graph renders correctly.

---

### Phase 3: Validation & Polish (Enforce & refine)
*Goal: Prevent invalid states and improve user feedback.*

#### 3.1 Fix Validation Logic
- **Change**: Update `isMappingValid` to enforce:
  - Source and Target columns are selected.
  - Source column != Target column.
- **UI**:
  - Disable "Next" button in Step 2 if invalid.
  - **Smart Filtering**: Remove the selected "Source" column from the "Target" dropdown options (and vice versa).
- **Testing**:
  - **New Test**: Select "ID" for Source and "ID" for Target. Verify "Next" is disabled or the second selection is blocked.

#### 3.2 Limit Warning Messages
- **Change**: In `handleFinalImport`, if `validationWarnings` > 10, slice the array and add a summary message ("...and X more").
- **Why**: Prevents the "Results" screen from becoming unusable with large datasets.
- **Testing**:
  - **New Test**: Upload a file that generates 20 warnings. Verify only 10 are shown plus the summary text.

#### 3.3 Implement Type Predicates
- **Change**: Create `isNode` and `isEdge` type guards.
- **Implementation**: Replace `nodes.filter(n => n !== null) as Node[]` with `nodes.filter(isNode)`.
- **Why**: Final TypeScript safety polish.
- **Testing**: Internal refactor; existing tests must pass.

---

## 2. Testing Impact Summary

| Test Suite | Action | Details |
| :--- | :--- | :--- |
| `csv-import.spec.ts` | **MODIFY** | Update all tests to include an `edges.csv` upload (since it's now mandatory). |
| `csv-import.spec.ts` | **NEW** | Test: "Next" button disabled when only Nodes uploaded. |
| `csv-import.spec.ts` | **NEW** | Test: "Next" button disabled when Source == Target column. |
| `csv-import.spec.ts` | **NEW** | Test: Import with special characters in IDs (Sanitization check). |
| `csv-import.spec.ts` | **NEW** | Test: Import generating >10 warnings (UI limit check). |
