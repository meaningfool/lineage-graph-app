# Implementation Plan - Runtime Validation (Deep Safety)

## Goal
Upgrade the CSV Importer's validation logic from "Manual Type Assertions" (Shallow Safety) to "Runtime Schema Validation" (Deep Safety) using **Zod**.

## Strategy
We will replace the manual `if (!id) ...` and `if (type !== 'INPUT') ...` checks with `ZodSchema.safeParse()`.
*   **Success**: Use the data (guaranteed to be correct type).
*   **Failure**: Catch the Zod error, format it as a user-friendly warning, and drop the row (Soft Validation).
*   **Referential Integrity**: The check ensuring Edge Source/Target exist in the Node list will remain in the importer (as it depends on the full dataset, not just row schema).

## Proposed Changes

### Slice 0: Setup
- Install `zod` dependency: `pnpm add zod`.

### Slice 1: Define Schemas
#### [NEW] `apps/web/src/lib/csv-schemas.ts`
Define the "shape" of valid data independent of the UI.
```typescript
import { z } from "zod";

export const GraphNodeSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  type: z.enum(["INPUT", "STEP", "OUTPUT"], {
    errorMap: () => ({ message: "Type must be INPUT, STEP, or OUTPUT" }),
  }),
  // Properties are optional and dynamic, we validate them as key-value pairs if needed, or leave as Record
  properties: z.record(z.unknown()).optional(),
});

export const GraphEdgeSchema = z.object({
  source: z.string().trim().min(1, "Source ID is required"),
  target: z.string().trim().min(1, "Target ID is required"),
});
```

### Slice 2: Refactor Node Validation
#### [MODIFY] `apps/web/src/lib/csv-graph-importer.ts`
Refactor the node mapping loop:
1.  **Map columns**: Extract raw values using the user's mapping (as before).
2.  **Validate**: Pass the object `{ id, title, type }` to `GraphNodeSchema.safeParse()`.
3.  **Handle Result**:
    *   `success`: Proceed to deduplication and return node.
    *   `error`: Extract error message (e.g. `result.error.issues[0].message`), add to `validationWarnings`, return `null`.

### Slice 3: Refactor Edge Validation
#### [MODIFY] `apps/web/src/lib/csv-graph-importer.ts`
Refactor the edge mapping loop:
1.  **Map columns**: Extract raw source/target.
2.  **Validate**: Pass to `GraphEdgeSchema.safeParse()`.
3.  **Handle Result**:
    *   `success`: Proceed to Referential Integrity check (remains unchanged) and deduplication.
    *   `error`: Add warning, return `null`.

## Verificaton Plan

### Manual Verification
1.  **Happy Path**: Import `simple_dag` -> Should succeed.
2.  **Validation Error**: Import a CSV with:
    *   Missing ID -> Warn "ID is required".
    *   Invalid Type -> Warn "Type must be INPUT...".
    *   Duplicate ID -> Warn (Existing logic).
3.  **Referential Integrity**: Import Edge pointing to non-existent node -> Warn (Existing logic).

### Automated Tests
*   `pnpm test:e2e`: Should pass existing `csv-import.spec.ts`.
*   **New Unit Test**: Create `csv-schemas.test.ts` to unit test the Zod schemas deeply (optional, but good practice).
