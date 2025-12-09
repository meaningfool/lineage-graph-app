# Research: Type Checking & Linting

## Context
Blocked commit in previous session due to:
1. `noExplicitAny` in `csv-graph-importer.ts`.
2. `useSemanticElements` in `multi-select.tsx`.
3. `properties` regression in `node-details-panel.tsx` (Fixed).

## Strategy: "Un-suppress and Fix"
We are addressing technical debt hidden by `// biome-ignore` comments.
1.  **Target**: Identify a specific scope (e.g., "Node Parsing loop").
2.  **Expose (Red)**: Delete the `// biome-ignore` comment. This causes `biome check` to fail.
3.  **Refactor (Green)**: Update the code to use real types (e.g., `unknown` + safe casting) instead of `any`.
4.  **Verify**: Ensure both `biome check` (Policy) and `tsc` (Correctness) pass.

This surgical approach prevents "Big Bang" refactors that break the build globally.

## Concept: Shallow vs. Deep Safety
*   **Current Approach ("Shallow")**: Usage of `as RawCsvRow` (assertions) prevents Type Contagion (stopping `any` from leaking downstream) and forces explicit developer assumptions. It ensures **Compiler Safety**.
*   **Future Goal ("Deep")**: Usage of Runtime Validation (e.g., `Zod`) to prove data correctness at the IO boundary. This ensures **Runtime Safety** (crashing gracefully on bad data instead of `undefined is not a function`).

