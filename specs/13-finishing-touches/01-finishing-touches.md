# Spec 13: Finishing Touches & UX Polish

## 1. Goal
Address scattered UI/UX issues identified during the demo preparation and add a "Welcome" flow for first-time users.

## 2. Scope

### A. Wizard Polish (Upload Step)
*   **Error Layout**: Fix the layout of error messages in the upload step to be more consistent and readable.
*   **Dropzone Consistency**: Ensure both dropzones (Nodes/Edges) match in color, styling, and label typography.

### B. App Header (Top Bar)
*   **Logo/Title**: Add a project logo or specific title on the left side.
*   **Clean Up**: Remove the Dark/Light mode toggle (force default theme or just remove the control).
*   **Layout Fixes**:
    *   Fix margin issue with the "Error Panel" button.
    *   Ensure the Graph Canvas starts *below* the header, not under it (checking usage of `h-screen` vs `calc`).

### C. Welcome Modal (Onboarding)
*   **Trigger**: Show automatically on first load (e.g., when no local storage state exists, or just always for the demo version).
*   **Content**: Brief introduction to the app.
*   **Action**: Single CTA button ["Start Import"] that strictly opens the `ImportWizardDialog`.

### D. Success & Warning Polish
*   **Warning Display**: Improve the rendering of the warnings list in the Success Step (typography, spacing, container styling).
*   **Message Clarity**: Ensure "Import Successful" logic handles warnings gracefully.

### E. Demo Fixtures
*   Update the demo fixture generator to include:
    *   **Self-loop** (Node connecting to itself).
    *   **Multi-node cycle** (A -> B -> C -> A).
    *   **Orphan nodes**.

## 3. Implementation Plan

### Slice 1: Header & Wizard Visuals (CSS Only)
1.  **Component**: `TopBar` (or Header).
    *   Add Title/Icon.
    *   Remove ThemeToggle.
    *   Fix Margins/Z-index issues.
2.  **Component**: `UploadStep`.
    *   Standardize `Dropzone` styles.
    *   Fix Error container styles.

### Slice 2: Welcome Modal (New Feature)
1.  **New Component**: `WelcomeDialog.tsx`.
2.  **State**: Controlled by parent (`Page` or `Layout`).
3.  **Interaction**: Clicking CTA -> `setWelcomeOpen(false)` -> `setImportOpen(true)`.

### Slice 3: Warnings & Fixtures
1.  **Component**: `ImportWizardDialog.tsx` (Success Step section).
    *   Style user feedback.
2.  **Script**: Update `scripts/generate_demo_fixture.py` (or manual CSVs) to include required edge cases.

## 4. Tests
*   **E2E**: Add a test in `welcome-flow.spec.ts` (new file) to verify the Welcome Modal appears and opens the Import Wizard.
*   **Visual**: Manual verification of Header and Wizard polish.
