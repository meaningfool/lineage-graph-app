# Slice 1: Orphan Nodes

## Goal
Ensure every node in the graph has at least one connection (incoming or outgoing). Isolated nodes should be flagged to the user.

## Testing Strategy (Phased E2E)
We will split the E2E test into two phases to support incremental implementation.

### Phase 1: Visual Feedback (Red Border)
- **Test Case**: `should highlight orphan nodes with error state`
- **Steps**:
    1.  **Setup**: Import CSV with nodes `A` (Input), `B` (Step) and edge `A->B`. Node `C` (Output) is missing. Wait, let's make `C` an orphan. Import `A, B, C` and edge `A->B`.
    2.  **Action**: Complete import.
    3.  **Assertion**: Verify Node `C` has the `.border-red-500` class (or equivalent error style).
    4.  **Assertion**: Verify Nodes `A` and `B` do *not* have the error style.

### Phase 2: Detailed Feedback (Tooltip)
- **Test Case**: `should display error details on hover`
- **Steps**:
    1.  **Action**: Hover over the orphan Node `C`.
    2.  **Assertion**: Verify a tooltip (or title) appears with text "Orphan node".

## Implementation Plan

### Architecture & Contracts
We will adhere to the **Hexagonal Architecture** defined in `specs/2025-11-21-edge-import/research.md`.

#### 1. Domain Layer (Pure Logic)
- **File**: `src/lib/graph-validation.ts` (New Module)
- **Contract**:
    ```typescript
    export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]>
    ```
- **Responsibility**: Pure function, no React dependencies. Returns a map of `NodeID -> Error[]`.

#### 2. Adapter Layer (State Management)
- **File**: `src/hooks/use-csv-import-wizard.ts`
- **Change**:
    - Import `validateGraph`.
    - In `handleFinalImport`, call `validateGraph` after building the graph.
    - **Contract Change**: The `Node` object passed to `onImport` will now include `validationErrors` in its `data` property.

#### 3. UI Layer (Visualization)
- **File**: `src/components/lineage-graph.tsx`
- **Contract Change**: Update `NodeData` interface.
    ```typescript
    interface NodeData {
        label: string;
        properties?: Record<string, any>;
        validationErrors?: string[]; // [NEW]
    }
    ```
- **Change**: Update `CustomNode` to read `validationErrors` and apply styles.

## Validation Rules
- **Rule**: A node is an "Orphan" if `degree === 0`.
- **Message**: "Orphan node: No connections found."
