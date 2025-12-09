---
description: Restore codebase context using Kit CLI
---
1. Retrieve the file tree structure to understand the project layout.
   - Command: `/Users/josselinperrus/Library/Python/3.13/bin/kit file-tree .`
   - SafeToAutoRun: true

2. Retrieve symbols to understand key definitions.
   - Command: `/Users/josselinperrus/Library/Python/3.13/bin/kit symbols .`
   - SafeToAutoRun: true

## Project Context
The application models data relationships as a DAG with three distinct node types:
1.  **Source Data** (Leaves): Raw data foundation.
2.  **Computed Values** (Intermediate): Calculated from sources/computations.
3.  **Metrics** (Roots): Final business outcomes.

## Golden Rules
1.  **Do Not Guess the UI Flow**: Read `apps/web/e2e/csv-import.spec.ts` to understand the canonical "Happy Path" (actions, stable `data-testid`s, wait conditions).
2.  **Strict TDD**: Write the *minimum* code required to pass the current slice's test.
3.  **E2E First**: Visual reliability > Implementation details.
