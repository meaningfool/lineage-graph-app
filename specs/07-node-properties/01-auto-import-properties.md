# Feature: Node Properties - Auto-Import

## Overview
The first phase of Node Properties focuses on automatically importing any "extra" columns found in the Nodes CSV and displaying them in the application. This ensures immediate value for users without requiring complex configuration steps.

## Motivation
Users often have metadata in their CSVs (e.g., `owner`, `created_date`, `description`, `tier`) that provides critical context for the lineage graph. Currently, this data is lost during import.

## Requirements

### 1. Parsing & Storage
- **Dynamic Columns**: The CSV parser must identify any column that is *not* mapped to the core fields (`id`, `title`, `type`).
- **Data Structure**: These extra columns should be stored in a `properties` object within the Node entity (e.g., `properties: Record<string, string>`).
- **Resilience**: Should handle empty values gracefully.

### 2. Visualization (Side Panel)
- **Interaction**: Clicking a node in the graph should open a "Node Details" side panel (or drawer) on the right side of the screen.
- **Content**: The panel should display:
    - The Node Title (as header).
    - The Node Type.
    - A list of all imported properties (Key-Value pairs).
- **UX**:
    - Clicking the canvas (background) should close the panel.
    - The panel should not obscure the entire graph (overlay or resize layout).

## Implementation Slicing & Verification

We will implement this in two distinct sub-cycles, each with its own E2E verification.

### Slice 1: Parsing & Card Preview
**Goal**: Ensure data is correctly parsed and available in the UI by displaying a "preview" property directly on the node card.

**Tasks**:
- Update `CSVParser` to extract extra columns into a `properties` object.
- Update `Node` component to display the *first* available property (e.g., `description`) below the title.

**Verification Plan**:
- **New E2E Test**: `node-properties.spec.ts`
    - **Scenario**: `should display first property in node card`
    - **Setup**: Import `nodes_with_desc.csv` (cols: `id`, `title`, `type`, `description`).
    - **Assertion**:
        ```typescript
        const node = page.locator(".react-flow__node").filter({ hasText: "User Table" });
        await expect(node).toContainText("Core user table"); // The description property
        ```
- **Existing Tests Updates**:
    - `csv-import.spec.ts`: No changes expected, assuming Node component DOM structure changes are additive.
    - `graph-layout.spec.ts`: No changes expected.

### Slice 2: Side Panel & Interaction
**Goal**: Provide a complete view of all properties via an interactive side panel. **Note**: The "Card Preview" from Slice 1 is temporary and will be removed in this slice.

**Tasks**:
- Create `NodeDetailsPanel` component to list all key-value pairs.
- Implement "Selection" state: Clicking a node opens the panel.
- **Remove** the "Card Preview" from Slice 1 (revert changes to `Node` component).

**Verification Plan**:
- **New/Updated E2E Test**: `node-properties.spec.ts`
    - **Update Scenario**: `should display first property in node card` -> **REMOVE** or **MODIFY** to ensure it *doesn't* show up anymore if that's the requirement, OR simply replace it with the panel test.
    - **New Scenario**: `should open side panel on node click`
        - **Setup**: Import `nodes_with_desc.csv`.
        - **Action**: Click the node `User Table`.
        - **Assertion**:
            ```typescript
            const panel = page.getByTestId("node-details-panel");
            await expect(panel).toBeVisible();
            await expect(panel).toContainText("description");
            await expect(panel).toContainText("Core user table");
            // Verify preview is GONE (if strict requirement)
            const node = page.locator(".react-flow__node").filter({ hasText: "User Table" });
            await expect(node).not.toContainText("Core user table"); // content should only be in panel
            ```
    - **Scenario**: `should close side panel on canvas click`
        - **Action**: Click the graph canvas (background).
        - **Assertion**: `await expect(panel).not.toBeVisible();`
- **Existing Tests Updates**:
    - None expected.

### Slice 3: Refinements & Advanced Interaction
**Goal**: Polish the UI/UX with visual cues, better layout, and robust interaction handling.

**Tasks**:
- **Full Height Panel**: Ensure the side panel stretches to the full height of the container/viewport.
- **Scrollable Content**: Ensure long property values trigger a scrollbar within the panel, not the page.
- **Hover Cursor**: Hovering over a node should display a `pointer` cursor.
- **Selection Visual Cue**: The currently selected node must be visually distinct (e.g., thicker border, different color).
- **Selection Switching**: Clicking Node A then Node B should seamlessly switch the selection and visual cue.

**Verification Plan (Strict Red State)**:
- **New E2E Tests**: `node-properties.spec.ts`
    - **Strategy**: To guarantee failure (Red State) before implementation, tests will assert on specific *new* CSS classes or styles that do not exist yet.
    - **Scenario**: `should show visual cue for selected node`
        - **Action**: Click a node.
        - **Assertion**: `expect(node).toHaveClass(/ring-2|border-blue-500/)` (Will fail: class missing).
    - **Scenario**: `should switch selection visual cue and panel content`
        - **Action**: Click Node A, then Click Node B.
        - **Assertion**: Node A should *not* have the cue, Node B *should* have the cue.
        - **Assertion**: Panel should display "Node B" title and properties (verifying content update).
    - **Scenario**: `should have pointer cursor on hover`
        - **Assertion**: `expect(node).toHaveCSS("cursor", "pointer")` (Will fail: currently default).
    - **Scenario**: `should handle long content`
        - **Setup**: Import `nodes_long_content.csv`.
        - **Assertion**: Panel container has `h-full` or `max-h-screen` and content area has `overflow-y-auto`.

### Slice 4: UI Polish & Refinements
**Goal**: Refine visual aesthetics and test robustness based on user feedback.

**Tasks**:
- **Panel Layout**:
    - Use `absolute` positioning (instead of `fixed`) to ensure the panel is contained within the canvas and respects the header offset.
    - Maintain equal margins (`top-4`, `bottom-4`, `right-4`).
- **Test Cleanup**:
    - Remove brittle CSS class assertions (e.g., specific colors).
    - Focus on behavioral verification (panel visibility, content updates).
    - Use `nodes_long_content.csv` (Node D) to verify scrolling behavior via JS evaluation (`scrollHeight > clientHeight`).

**Verification Plan**:
- **Update E2E Tests**: `node-properties.spec.ts`
    - **Scenario**: `should handle long content with scrolling`
        - **Action**: Select Node D (many properties).
        - **Assertion**: Verify panel content container is scrollable using JS evaluation.
    - **Scenario**: `should show visual cue`
        - **Assertion**: Verify visual state change (e.g., class list changes) without asserting exact Tailwind classes.
    - **Scenario**: `should display full height panel`
        - **Assertion**: Verify panel is within viewport/canvas bounds.
