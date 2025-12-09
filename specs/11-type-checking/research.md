# Research: Type Checking & Linting

## Context
Blocked commit in previous session due to:
1. `noExplicitAny` in `csv-graph-importer.ts`.
2. `useSemanticElements` in `multi-select.tsx`.
3. `properties` regression in `node-details-panel.tsx` (Fixed).

## Strategy
- Use `zod` for boundary validation (CSV import) to replace `any` safely?
- Revisit `multi-select` generic implementation.
