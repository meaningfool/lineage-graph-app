# Task List: Graph Layout

## Research & Spec
- [x] Research existing layout logic (Dagre) and legacy algorithms <!-- id: 0 -->
- [x] Define "Longest Path Layering" algorithm <!-- id: 1 -->
- [x] Create E2E-driven implementation plan (`01-layout-refinement.md`) <!-- id: 2 -->

## Implementation (Slice 1: Core Layout)
- [ ] Create `e2e/graph-layout.spec.ts` with Slice 1 test cases <!-- id: 3 -->
- [ ] **Verify Red State**: Run tests and confirm assertion failures <!-- id: 4 -->
- [ ] Implement `computeLayers` in `src/lib/graph-layout-utils.ts` <!-- id: 5 -->
- [ ] Implement `computeCoordinates` (Basic X/Y) <!-- id: 6 -->
- [ ] Integrate into `src/utils/layout.ts` <!-- id: 7 -->
- [ ] **Verify Green State**: Run tests and confirm pass <!-- id: 8 -->

## Implementation (Slice 2: Cycle Resilience)
- [ ] Add Slice 2 test cases (Cycles) to E2E <!-- id: 9 -->
- [ ] Implement cycle detection/breaking in `computeLayers` <!-- id: 10 -->
- [ ] Verify pass <!-- id: 11 -->

## Implementation (Slice 3: Disconnected Components)
- [ ] Add Slice 3 test cases to E2E <!-- id: 12 -->
- [ ] Ensure iteration covers all nodes <!-- id: 13 -->
- [ ] Verify pass <!-- id: 14 -->
