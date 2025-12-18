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

### Slice 1: Wizard Upload Error Layout
1.  **Component**: `import-wizard-dialog.tsx`.
    *   Fix CSS for the error message container in the upload step.

### Slice 2: Dropzone Consistency
1.  **Component**: `import-wizard-dialog.tsx`.
    *   Standardize visual styles (color, font) for Nodes vs Edges dropzones.

### Slice 3: Header Error Button Margin
1.  **Component**: `header.tsx` / `page.tsx`.
    *   Fix margin of the "Error Panel" count button.
    *   Ensure Canvas top offset is correct relative to the header.

### Slice 4: Header Logo
1.  **Component**: `header.tsx`.
    *   Add App Title/Logo to the left.

### Slice 5: Remove Theme Toggle
1.  **Component**: `header.tsx`.
    *   Remove the theme toggle button.

### Slice 6: Welcome Modal
1.  **New Component**: `welcome-dialog.tsx`.
2.  **State**: Managed in `page.tsx`.
3.  **Flow**: First load -> Show Modal -> Click Start -> Open Wizard.

### Slice 7: Warning Display Polish
1.  **Component**: `import-wizard-dialog.tsx`.
    *   Polish the warnings list in the Success Step.

### Slice 8: Demo Fixtures
1.  **Script**: `generate_demo_fixture.py`.
    *   Add Self-loop and Multi-node Cycle cases.

## 4. Tests
*   **E2E**: Add a test in `welcome-flow.spec.ts` (new file) to verify the Welcome Modal appears and opens the Import Wizard.
*   **Visual**: Manual verification of Header and Wizard polish.
