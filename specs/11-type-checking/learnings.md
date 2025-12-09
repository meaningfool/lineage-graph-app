# Learnings - Type Checking & Accessibility

## Strategies that Worked

### "Un-suppress and Fix"
Instead of a "Big Bang" refactor, we systematically removed `// biome-ignore` comments for specific rules (e.g., `noExplicitAny`, `useSemanticElements`) one file or component at a time. This allowed us to:
1.  **Expose the hidden debt** clearly as errors.
2.  **Fix them in isolation** (Slice-based approach).
3.  **Verify** using the strict checker immediately after.

This prevented regression and kept the codebase buildable (mostly) between slices.

### Shallow Safety (Compiler) vs. Deep Safety (Runtime)
We distinguished two goals:
1.  **Compiler Safety (Achieved)**: Eliminating `any`. We used `unknown` + Type Assertions (e.g., `as string`) to force the developer to make explicit assumptions. This is "safe" for the compiler but assumes the data matches the schema.
2.  **Runtime Safety (Future)**: Validating the data matches the schema at runtime (e.g., Zod).
*Action*: We deferred Zod to a separate spec (`11-type-checking/02-runtime-validation.md`) to keep the scope manageable.

## Pitfalls & Solutions

### E2E Interactions - Tooltips Blocking Clicks
**Issue**: A Playwright test `clicking_error_node_does_not_trigger_flash` flaky failed.
**Cause**: When Playwright hovered the node to click it, the **Validation Error Tooltip** appeared. Since it was an HTML element with a higher z-index rendered *on top* of the node, it **intercepted the click**, preventing the node selection logic.
**Fix**: Added `pointer-events-none` to the tooltip container. This allows mouse events to pass through visually floating elements to the underlying interactive node.

### WAI-ARIA Strictness vs. Custom UI
**Issue**: Biome's `useSemanticElements` is strict. It demanded `<select>` for `role="combobox"`.
**Resolution**: For custom UI (Radix-like), we sometimes *must* use `div` or `button`. We:
1.  Used native elements where possible (`<button>`, `<output>`).
2.  Removed redundant roles (`role="listbox"`, `role="option"`) that libraries like `cmdk` handle internally.
3.  Suppressed false positives only when the semantic pattern was valid but the linter was too rigid (e.g., Custom Select Trigger).
