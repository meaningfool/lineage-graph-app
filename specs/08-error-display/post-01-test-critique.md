# E2E Test Suite Critique

## 1. Redundancy & Duplication
The most significant issue is the repetition of the "Import Flow" logic across all test files.
- **File Uploads**: The complex `DataTransfer` simulation logic is copy-pasted or re-implemented in `csv-import.spec.ts`, `graph-layout.spec.ts`, `graph-validation.spec.ts`, etc.
- **Column Mapping**: The sequence of clicking dropdowns and selecting options is repeated in every single test case that imports data.
- **Impact**: Changing the import flow (e.g., adding a new required step) would require updating 50+ places across 5 files.

## 2. Selector Fragility
- **Class-based Assertions**: `graph-validation.spec.ts` relies on `toHaveClass(/border-red-500/)`. This couples tests to specific Tailwind utility classes. If the design system changes (e.g., to a different border color or component library), tests will break even if the functionality is correct.
    - *Recommendation*: Use semantic attributes like `data-invalid="true"` or `aria-invalid`.
- **DOM Traversal**: Selectors like `.locator("div").first()` are brittle. They rely on the internal DOM structure of React Flow nodes, which is subject to change.

## 3. Visual Validation Gaps
- **Screenshots**: `graph-validation.spec.ts` captures screenshots (`page.screenshot(...)`) but does not perform visual regression testing (`expect(page).toHaveScreenshot()`). These screenshots are effectively "dead artifacts" that don't automate verification.
- **Canvas Testing**: Testing the graph layout and rendering via DOM element positions (`boundingBox`) is clever but can be flaky. Visual regression testing might be more robust for "layout" correctness.

## 4. Fixture Management
- **Sprawl**: There are 57 fixture files. Many seem redundant (e.g., multiple "valid basic" variations).
- **Organization**: Flat structure makes it hard to find relevant fixtures.
- **Naming**: Naming is generally consistent (`nodes_...`, `edges_...`) but could be grouped better.

## 5. Test Structure
- **Inconsistent Helpers**: `csv-import.spec.ts` has local helpers. Other files have no helpers or duplicate them.
- **Missing Page Object Model (POM)**: The suite is complex enough to warrant a Page Object Model. A `LineagePage` class could encapsulate the `upload`, `map`, and `validate` actions.

## 6. Performance
- **Full UI Driving**: Every test drives the full UI from the start. While this ensures "End-to-End" confidence, it's slow.
- **Sequential Execution**: As noted, `serial` mode is a band-aid that slows down the suite.

## Recommendations
1.  **Implement Page Object Model**: Create `e2e/pages/LineagePage.ts` to encapsulate:
    - `goto()`
    - `uploadFiles(nodes, edges)`
    - `mapColumns(config)`
    - `submitImport()`
    - `getGraphNode(label)`
2.  **Standardize Assertions**:
    - Update application code to emit `data-state="invalid"` or similar attributes for nodes/edges.
    - Update tests to assert on these attributes.
3.  **Refactor Fixtures**:
    - Review and prune duplicate fixtures.
    - Consider generating simple fixtures in-memory or using a factory if they are just CSV strings.
4.  **Remove Serial Mode**: Once helpers are robust (waiting for stable states), parallel execution should work.
