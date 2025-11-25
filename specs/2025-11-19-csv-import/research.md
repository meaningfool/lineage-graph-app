# Research: CSV Import Feature

## Debugging Log: Visual Regression (Tailwind CSS)

### The Issue
We encountered a "silent failure" where CSS classes were present in the HTML (e.g., `bg-white`, `shadow-sm`) but no styles were applied in the browser.

### Root Causes
1.  **Silent Build Failure**: `apps/web/src/index.css` contained an `@import "tw-animate-css";` for a package that had been removed from `package.json`. This caused the CSS build process to abort silently or partially fail, preventing Tailwind from generating utility classes.
2.  **Tailwind Version Conflict**: The project uses Tailwind v4 (configured via `@import "tailwindcss";` in CSS), but a legacy `tailwind.config.js` (v3 config) was still present. This caused conflicts in the build toolchain.

### Resolution
1.  **Clean Dependencies**: Removed the broken `@import` from `index.css`.
2.  **Unified Config**: Deleted `tailwind.config.js` to rely solely on Tailwind v4's CSS-based configuration.
3.  **Restart Server**: Restarted the dev server (`pnpm dev`) to force a fresh build.

### Key Takeaway
If styles are missing but classes are present:
1.  Check `index.css` for broken imports.
2.  Verify if `tailwind.config.js` exists when using Tailwind v4.
3.  **Always restart the dev server** after changing build configurations.

## E2E Testing Strategy: Fixtures vs. Inline Data

### The "Two-File Problem"
Using external fixture files creates a disconnect: changing a test often requires changing a separate data file. However, for file-based features (like CSV Import), using real files is crucial for:
1.  **Manual Verification**: Users can upload the exact same file to reproduce test cases.
2.  **Complexity Management**: Large datasets clutter test files.

### Policy
*   **Use Fixtures When**:
    *   The feature involves file uploads (CSV, JSON, Images).
    *   The data is complex or large (>10 lines).
    *   The data is shared across multiple tests.
*   **Use Inline Data When**:
    *   The data is small and specific to a single test case.
    *   The test logic depends tightly on specific values (e.g., boundary checks).

### Documentation Requirement
When using a fixture, the test file **MUST** include a comment block explaining:
1.  **What** the fixture contains (summary).
2.  **Why** it is used (e.g., "Standard valid node set").
3.  **Where** it is located.

## Technical Reviews

### Cycle 4: Column Mapping & Edge Import
*   **Document**: [`cycle4-technical-review.md`](../2025-11-21-column-mapping/cycle4-technical-review.md)
*   **Key Insights**: Detailed analysis of state management, validation logic, and type safety for the import wizard. Includes decisions on "Parse, Don't Validate" and strict typing.
