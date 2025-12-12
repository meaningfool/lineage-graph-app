# Gap Analysis: New Import Wizard vs. Current Implementation

## 1. Overview
This document compares the newly designed **Static Import Wizard** (Phase 1) with the **Current Functional Implementation** (`CSVImportModal`). The goal is to identify gaps and define the roadmap for **Phase 2: Functional Wiring**, ensuring no features are lost while upgrading the UX.

## 2. Comparison Summary

| Feature | Current Implementation (`CSVImportModal`) | New Design (`ImportWizardDialog`) |
| :--- | :--- | :--- |
| **Flow** | 3 Steps: Upload -> Mapping -> Results | **4 Steps**: Upload -> Map Nodes -> Map Edges -> Success |
| **Mapping UI** | Single screen for both Nodes & Edges | **Split screens**: specialized for Nodes (Step 2) and Edges (Step 3) |
| **Properties** | `MultiSelect` component (max 3 items) | **"Pill Group"** UI (toggleable buttons, visually grouped) |
| **Validation** | Inline errors + "Results" step for report | Inline red dots + "Success" step for confirmation |
| **Edge Handling** | **Mandatory** | **Mandatory Step 3** |
| **State Reset** | Internal hook logic | Forced via `key` prop on parent mount |

---

## 3. Detailed Gaps & Resolutions

### 3.1. State Machine Mismatch
*   **Gap**: The existing `useCSVImportWizard` hook manages 3 states (`upload`, `mapping`, `results`). The new UI requires 4 states (`UPLOAD`, `MAP_NODES`, `MAP_EDGES`, `SUCCESS`).
*   **Resolution**: Refactor hook to support `upload` -> `map_nodes` -> `map_edges` -> `results`.

### 3.2. Mapping Configuration Split
*   **Current State**: Flat object `{ id, title, type, source, target }`.
*   **New Design**: Split into Nodes Screen (Step 2) and Edges Screen (Step 3).
*   **Resolution**:
    *   **Form Validation**: Validate presence of required Node fields before leaving Step 2. Validate presence of required Edge fields before leaving Step 3.
    *   **Domain Validation**: Run the full graph build/validation only at the very end (transition to Success), consistent with current logic.

### 3.3. "Pill" Selection vs MultiSelect
*   **Gap**: New UI uses pills; Old UI uses MultiSelect.
*   **Resolution**: Use the same underlying data structure (`mapping.properties: string[]`). Wire the new Pill buttons to toggle values in this array.

### 3.4. Edge File Requirement
*   **Correction**: The Edge file is **mandatory**, as confirmed by existing tests (`csv-import.spec.ts` always uploads both).
*   **Resolution**: Step 3 (Map Edges) is **mandatory**. The user cannot proceed to Success without mapping edges.

### 3.5. Warning Display Strategy
*   **Gap**: Where to show non-blocking warnings (e.g., "3 rows dropped")?
*   **Resolution (Option A)**: Display warnings on the **Success screen** (Step 4).
    *   Drop rows/edges silently during the process if needed (or with logs).
    *   Report the final count of dropped items on the final screen so the user is aware of data adjustments.

---

## 4. Technical Roadmap (Phase 2)

**Goal**: Wire `useCSVImportWizard` into `ImportWizardDialog`.

1.  **Refactor Hook (`use-csv-import-wizard.ts`)**:
    *   Update `currentStep` type: `upload` | `map_nodes` | `map_edges` | `success`.
    *   Split `handleFinalImport` -> `validateNodesForm()` and `buildAndValidateGraph()`.

2.  **Wire Step 1 (Upload)**:
    *   Connect `files` state to new `Dropzone` components.
    *   Ensure both files are present before enabling "Next".

3.  **Wire Step 2 (Map Nodes)**:
    *   Bind `MappingTable` (type="NODES") to `mapping` state.
    *   Wire "Pills" to `mapping.properties`.
    *   Validate: `id`, `title`, `type` set? -> Enable Next.

4.  **Wire Step 3 (Map Edges)**:
    *   Bind `MappingTable` (type="EDGES") to `mapping.source/target`.
    *   Validate: `source`, `target` set? -> Enable Next.

5.  **Wire Step 4 (Success/Results)**:
    *   Invoke `buildGraphFromCsv` logic.
    *   Display Success state + Warnings list if any.
