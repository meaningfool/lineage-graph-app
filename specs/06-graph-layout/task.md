# Task List: Graph Layout

## Research & Spec
- [x] Research existing layout logic (Dagre) and legacy algorithms <!-- id: 0 -->
- [x] Define "Longest Path Layering" algorithm <!-- id: 1 -->
- [x] Create E2E-driven implementation plan (`01-layout-refinement.md`) <!-- id: 2 -->
- [x] Refine spec to handle invalid graphs (undirected layer calculation) <!-- id: 3 -->

## Implementation (Slice 1: Basic Flows)
- [ ] Create `e2e/graph-layout.spec.ts` with Slice 1 test cases <!-- id: 4 -->
- [ ] Create test fixtures (chain_flow.csv, convergent_flow.csv, divergent_flow.csv) <!-- id: 5 -->
- [ ] **Verify Red State**: Run tests and confirm assertion failures <!-- id: 6 -->
- [ ] Implement `computeMaxLayers` in `src/lib/graph-layout-utils.ts` (undirected) <!-- id: 7 -->
- [ ] Implement `assignLayers` (Type-based positioning) <!-- id: 8 -->
- [ ] Integrate into `src/utils/layout.ts` <!-- id: 9 -->
- [ ] **Verify Green State**: Run tests and confirm pass <!-- id: 10 -->

## Implementation (Slice 2: Invalid Graphs)
- [ ] Add Slice 2 test cases (backward edges) to E2E <!-- id: 11 -->
- [ ] Create test fixtures (backward_simple.csv, backward_complex.csv) <!-- id: 12 -->
- [ ] Verify orphan handling works <!-- id: 13 -->
- [ ] Verify pass <!-- id: 14 -->

## Implementation (Slice 3: Cycles)
- [ ] Add Slice 3 test cases (self-loops, feedback) to E2E <!-- id: 15 -->
- [ ] Implement cycle detection in undirected traversal <!-- id: 16 -->
- [ ] Verify pass <!-- id: 17 -->

## Implementation (Slice 4: Disconnected Components)
- [ ] Add Slice 4 test cases to E2E <!-- id: 18 -->
- [ ] Ensure multi-component support <!-- id: 19 -->
- [ ] Verify pass <!-- id: 20 -->

