# Implementation Plan - Runtime Validation (Deep Safety)

## Goal
Upgrade the CSV Importer from "Trust the Developer" (Type Assertions) to "Verify the Data" (Runtime Validation) using Zod.

## Context
See `research.md` ("Shallow vs. Deep Safety"). This spec is to be tackled **after** standard type checking is enforced in the CI pipeline.

## Proposed Changes

### Slice 1: Node Schema
#### [NEW] [csv-schemas.ts] (New File)
- Define `GraphNodeSchema` using Zod.
  ```typescript
  export const GraphNodeSchema = z.object({
    id: z.string().min(1),
    title: z.string(),
    type: z.enum(["INPUT", "STEP", "OUTPUT"]),
    // ...
  });
  ```
#### [MODIFY] [csv-graph-importer.ts]
- Replace manual validation logic with `GraphNodeSchema.safeParse(row)`.

### Slice 2: Edge Schema
#### [MODIFY] [csv-schemas.ts]
- Define `GraphEdgeSchema`.
#### [MODIFY] [csv-graph-importer.ts]
- Replace manual loop validation with Zod parsing.

## Verification Plan
- `test:e2e` for regression check.
- New Unit Tests for `csv-schemas.ts` checking invalid inputs.
