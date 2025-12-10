# Import Wizard Redesign: Design Reference

**Goal**: Create a premium, visually engaging Import Wizard by combining elements from "Motif" and "Superdesign".

## UI Specification ("The Hybrid Design")

### 1. Global Structure
*   **Header (Superdesign Style)**: 
    *   Title: "Import Graph Data"
    *   Subtitle: "Upload CSV files to generate your lineage graph"
    *   Close Button (X) at top-right.
*   **Stepper (Motif Style)**:
    *   Steps: `[1] Upload -> [2] Map Nodes -> [3] Map Edges -> [4] Success`
    *   Visual separation of Mapping into two steps.
    *   Completed steps show a Green Tick.
*   **Footer**:
    *   `Back` (Secondary)
    *   `Continue` (Primary, Superdesign style)

### 2. Step 1: Upload Files
*   **Layout**: Wide modal.
*   **Drop Zones**: Side-by-side (Nodes Left, Edges Right).
*   **Error Handling**: Validation errors displayed immediately below drop zones.

### 3. Step 2 & 3: Mapping
*   **Table Layout (Motif Style)**:
    *   Headers: `System Field | CSV Column | Required | Sample Data`
*   **Rows**:
    *   `Node ID` (Req) -> Select
    *   `Display Label` (Req) -> Select
    *   `Node Type` (Req) -> Select
    *   `Additional Properties` -> **Multi-Select** (Select multiple CSV columns)
*   **Cleanups**:
    *   Remove redundant text.
    *   Use plain English labels.

### 4. Step 4: Success
*   Celebration icon + Stats.
