---
description: Restore codebase context
---

## App Overview
This application allows users to upload a CSV file containing graph data, which is then visualized as an interactive lineage graph.

1. Retrieve the file tree structure to understand the project layout.
   - Command: `/Users/josselinperrus/Library/Python/3.13/bin/kit file-tree .`
   - SafeToAutoRun: true

2. Retrieve symbols to understand key definitions.
   - Command: `/Users/josselinperrus/Library/Python/3.13/bin/kit symbols .`
   - SafeToAutoRun: true
3. List all E2E specifications to understand the available test coverage.
   - Command: `ls -F apps/web/e2e/*.spec.ts`
   - SafeToAutoRun: true

## Reference Material
*   **UI Flow / Happy Path**: defined in `apps/web/e2e/csv-import.spec.ts`.
*   **Graph Validation**: defined in `apps/web/e2e/graph-validation.spec.ts`.
