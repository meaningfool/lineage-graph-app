# Spec: Functional Error Panel

## Goal
Implement the visual components for displaying graph validation errors: a toggle button with a count badge and a side panel listing the errors. This spec focuses on the "read-only" aspect of the feature—displaying the information correctly without yet implementing the navigation/interaction logic.

## Slices

### Slice 1: Error Toggle & Badge
**Goal**: Display a floating button on the graph that shows the total number of errors.
**Changes**:
- Create `ErrorToggle` component.
- Update `LineageGraph` to calculate total error count from nodes and edges.
- Render `ErrorToggle` in `LineageGraph` (positioned top-left to avoid conflict with Node Properties on the right).

**Test Scenarios**:
- **Scenario 1: No Errors [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Import a clean CSV (e.g., `fixtures/nodes_valid_basic.csv`).
    - **Action**: Render graph.
    - **Assertion**: Error Toggle is NOT visible (or visible with 0 count). *Decision: Hidden when 0 errors.*
- **Scenario 2: With Errors [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Import `fixtures/nodes_errors_display.csv` (contains 3 node errors) and `fixtures/edges_errors_display.csv` (contains 2 edge errors).
    - **Action**: Render graph.
    - **Assertion**: Error Toggle is visible. Badge displays "5".

**Existing Tests Impact**:
- `e2e/node-properties.spec.ts`: **No Change**. This test uses valid fixtures (`nodes_with_desc.csv`), so the error toggle will remain hidden. Even if it were visible, it is positioned in the top-left, while node properties tests interact with nodes (center) and the property panel (right), so no interference is expected.

### Slice 2: Error Panel Shell
**Goal**: Create the side panel container and manage its open/close state.
**Changes**:
- Create `ErrorListPanel` component (initially just a shell with title and close button).
- Add `isErrorPanelOpen` state to `LineageGraph`.
- Wire up `ErrorToggle` click to set `isErrorPanelOpen(true)`.
- Wire up `ErrorListPanel` close button to set `isErrorPanelOpen(false)`.

**Test Scenarios**:
- **Scenario 1: Opening the Panel [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Graph loaded with errors.
    - **Action**: Click Error Toggle.
    - **Assertion**: `ErrorListPanel` is visible on the LEFT side.
- **Scenario 2: Closing the Panel [NEW]**
    - **File**: `e2e/error-display.spec.ts`
    - **Setup**: Panel is open.
    - **Action**: Click Close button (X) inside the panel.
    - **Assertion**: `ErrorListPanel` is NOT visible.

**Existing Tests Impact**:
- `e2e/node-properties.spec.ts`: **No Change**. The error panel is closed by default. Existing tests do not interact with the error toggle, so the panel will remain closed and will not obscure any elements.

### Slice 3: Error List Content
**Goal**: Populate the panel with the actual list of errors.
**Changes**: Update `ErrorListPanel` to accept and render errors, aggregate errors in `LineageGraph`.
**Test Scenarios (NEW)**:
*   "List Accuracy": Panel shows correct error message and entity ID.
*   "Multiple Errors": Panel lists all errors for a given entity.
**Existing Tests Impact**: No change.

### Error Message Templates
The following table defines the exact messages to be displayed for each error type.

| Error Type | Current Message | Target Message (Slice 4) |
| :--- | :--- | :--- |
| **Self Cycle** | "Cycle detected: Node connects to itself" | `Self-cycle: {nodeLabel} connects to itself` |
| **Input Node** | "Input node must have..." | `{nodeLabel}: Input node must have at least one outgoing connection and no incoming connections` |
| **Output Node** | "Output node must have..." | `{nodeLabel}: Output node must have at least one incoming connection and no outgoing connections` |
| **Step Node** | "Step node must have..." | `{nodeLabel}: Step node must have at least one incoming connection and at least one outgoing connection` |
| **Multi-Node Cycle** | "Cycle detected" | `Cycle detected: {nodeLabel1} -> {nodeLabel2} -> {nodeLabel1}` |

### Slice 4: Enhanced Error Messages (Vertical)
**Goal**: Display the specific, user-friendly error messages defined above in the *existing* UI.
**Strategy**: Modify the existing validator functions to generate the full, formatted string directly (including the node label).
*   **No Refactoring**: We will NOT create `GraphValidationError` objects or an `ErrorFormatter` utility.
*   **No App Changes**: The `LineageGraph`, `Importer`, and `Mapper` will continue to receive and display simple strings, so no crash risk.

**Changes**:
*   **Validators**: Update `self-cycle-validator.ts`, `node-connectivity-validator.ts`, and `multi-cycle-validator.ts` to construct the target string (e.g., `"{NodeLabel}: Input node..."`) instead of the generic string.
    *   *Note*: Validators will need access to `Node Labels` (which they mostly have or can easily get).
*   **Deduplication**: Modify `LineageGraph.tsx` to deduplicate error messages.
    *   Cycle errors (e.g., "Cycle detected: A->B->C->A") are currently attached to *all* involved edges.
    *   The panel should only list this message *once*.
    *   Use a `Set` to filter out duplicate strings before rendering.

**Test Scenarios**:
*   **Verification**: Update `e2e/graph-validation.spec.ts`.
    *   **Input Node Rule**: Update assertion to expect `{nodeLabel}: Input node must have...`
    *   **Output Node Rule**: Update assertion to expect `{nodeLabel}: Output node must have...`
    *   **Step Node Rule**: Update assertion to expect `{nodeLabel}: Step node must have...`
    *   **Self Cycle**: Update assertion to expect `Self-cycle: {nodeLabel} connects to itself`.
    *   **Multi-node Cycle**: Update assertion to expect `Cycle detected: {path}`.

### Slice 5: Compact Error Panel UI (Vertical)
**Goal**: Refine the visual presentation of the error list to be more compact and list-like.
**Changes**:
*   **UI Layout**:
    *   **Remove Cards**: Display errors as a simple list of strings, not inside individual cards/boxes.
    *   **Icon**: Add a small, red "circle with exclamation point" icon (like a bullet point) before each error message.
    *   **Spacing**: Ensure reasonable margin between items, but keep it compact.
*   **Visual Verification**: Ensure the layout looks like a clean list.

**Test Scenarios**:
*   **Visual Check**: Verify the compact list layout and the presence of the red icon.
*   **Regression**: Ensure text content from Slice 4 is still present and accessible.
