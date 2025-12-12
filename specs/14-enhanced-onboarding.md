# Spec 14: Enhanced Onboarding Flow

## 1. Goal
Improve the first-time user experience by providing an instant "Try with Demo Data" option and eventually a visual explanation of the concept.

## 2. Visual Explanation (Deferred)
*Note: Implementation of the visual diagram is deferred. The description below is preserved for future image generation or SVG implementation.*

### Diagram Concept: "From Table Rows to Graph Nodes"
**Left Side: The Source (2 Tables)**
1.  **Nodes Table**: Shows columns `id`, `label`, and `type`.
    *   Row 1: `id: A`, `type: INPUT` (Color: Blue)
    *   Row 2: `id: B`, `type: STEP` (Color: Amber)
    *   Row 3: `id: C`, `type: OUTPUT` (Color: Green)
2.  **Edges Table**: Shows columns `source`, `target`.
    *   Row 1: `A -> B`
    *   Row 2: `B -> C`

**Middle: The Transformation**
*   An arrow labeled "Import & Link" pointing from the tables to the graph.

**Right Side: The Result (Lineage Graph)**
*   **Visualizes the exact rows from the left**:
    *   **Node A (Blue)** maps to the first position (Input).
    *   **Node B (Amber)** maps to the middle position (Step).
    *   **Node C (Green)** maps to the final position (Output).
*   **Arrows (Edges)** connect them clearly: `A` points to `B`, `B` points to `C`.

## 3. Scope
### A. Demo Data Availability
*   Host the "Chemical Plant" fixture CSVs (`nodes.csv`, `edges.csv`) in `apps/web/public/demo/` so they can be fetched by the client.

### B. "Try Demo" Logic
*   **Component**: `WelcomeDialog.tsx` & `page.tsx`.
*   **Flow**:
    *   User clicks "Try Demo Data" in Welcome Modal.
    *   App fetches `/demo/nodes.csv` and `/demo/edges.csv`.
    *   App parses them and behaves exactly as if the user uploaded them.
    *   Welcome Modal closes, Lineage Graph renders.

## 4. Implementation Plan

### Slice 1: Demo Data Setup
1.  Create `apps/web/public/demo/` directory.
2.  Copy generated fixtures (`apps/web/e2e/fixtures/demo-polish/*.csv`) to `apps/web/public/demo/`.

### Slice 2: Try Demo Feature
1.  **Update `WelcomeDialog`**: Add "Try with Demo Data" button (Secondary action).
2.  **Update `page.tsx`**: Implement `handleLoadDemo` function to fetch, parse, and load data.

## 5. Tests
*   **Manual**: Verify clicking the button loads the graph correctly without errors.
