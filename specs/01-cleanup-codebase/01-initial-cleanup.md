# Implementation Plan - Phase 1: Remove Dead Code

## Goal
Remove unused files and brittle tests identified in the audit.

## Proposed Changes

### Deletions
#### [DELETE] [simple-dag-generator.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/utils/simple-dag-generator.ts)
- Unused utility.

#### [DELETE] [simple-dag-generator.test.ts](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/utils/__tests__/simple-dag-generator.test.ts)
- Tests for unused utility.

#### [DELETE] [page.test.tsx](file:///Users/josselinperrus/Projects/data-lineage-app/apps/web/src/app/__tests__/page.test.tsx)
- Brittle tests that mock too much.

## Verification Plan
1. Run `pnpm build` to ensure no import errors.
2. Run `pnpm test` (expect 0 tests, but no errors).
