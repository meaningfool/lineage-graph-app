# Task: Cleanup Codebase

Based on the codebase audit (2025-11-19), we need to remove dead code and brittle tests to establish a clean baseline for the CSV Import feature.

- [ ] **Phase 1: Remove Dead Code & Bad Tests** <!-- id: 0 -->
    - [ ] **Delete**: `apps/web/src/utils/simple-dag-generator.ts` (Unused) <!-- id: 1 -->
    - [ ] **Delete**: `apps/web/src/utils/__tests__/simple-dag-generator.test.ts` (Unused) <!-- id: 2 -->
    - [ ] **Delete**: `apps/web/src/app/__tests__/page.test.tsx` (Brittle, mocks everything) <!-- id: 3 -->
    - [ ] **Verify**: Run `pnpm test` to ensure no regressions (should be 0 tests passing, but clean build). <!-- id: 4 -->

- [ ] **Phase 2: Extract Layout Logic (Optional)** <!-- id: 5 -->
    - [ ] **Refactor**: Move Dagre layout logic from `page.tsx` to `utils/layout.ts`. <!-- id: 6 -->
