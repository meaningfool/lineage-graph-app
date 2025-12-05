# Research: Error Visualization Effects

## Problem
The current `animate-pulse` implementation has two issues:
1.  **Visual Interference**: It pulses the entire node (including the selection ring and text), which looks messy.
2.  **State Confusion**: The persistent pulse on all error nodes makes it hard to distinguish the *currently selected* error, leading to a feeling that the "first node didn't stop pulsating."

## Solution: CSS Ripple Effect
We can create a "Ripple" or "Sonar" effect that expands *outward* from the node using a CSS pseudo-element (`::before` or `::after`).

### Advantages
*   **Independent**: It does not affect the node's opacity, border, or text.
*   **External**: It extends beyond the node boundaries, creating a clear "locating" signal.
*   **Layered**: Can be placed behind the node (`z-index: -1`) so it doesn't obscure content.

### Implementation Draft

**CSS / Tailwind:**
We can define a custom keyframe in `tailwind.config.js` or standard CSS.

```css
@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.75;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.3); /* Expands 30% beyond node */
    opacity: 0;
  }
}

.error-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background-color: #ef4444; /* Red-500 */
  border-radius: inherit; /* Matches node rounded corners */
  z-index: -1; /* Behind the node */
  transform: translate(-50%, -50%);
  animation: ripple 1.5s infinite ease-out;
}
```

### Proposed Interaction Model
To address the "stickiness" bug/confusion, I propose distinguishing between **Passive** and **Active** error states:

1.  **Passive Error (All invalid nodes)**:
    *   **Style**: Static Red Border (`border-red-500`).
    *   **Effect**: *No animation*. This reduces noise on the canvas.
2.  **Active Error (Clicked in Panel)**:
    *   **Style**: Static Red Border + **Ripple Animation**.
    *   **Effect**: The ripple acts as a "Here I am!" signal for the specific error you are investigating.
    *   **Behavior**: When you click a different error, the ripple moves to the new target, solving the "didn't stop" issue.

### Edge Implementation
For edges, we can achieve a similar effect by duplicating the SVG path with a wider stroke and animating its opacity/stroke-width, or using a CSS filter `drop-shadow` that pulses.

**Edge Ripple:**
```css
.edge-ripple {
  animation: edge-pulse 1.5s infinite;
}

@keyframes edge-pulse {
  0% { stroke-width: 2; opacity: 1; }
  50% { stroke-width: 6; opacity: 0.5; } /* "Breathing" width */
  100% { stroke-width: 2; opacity: 1; }
}
```

## Technical Learnings (Dec 2025)

### 1. Animation Restart Pattern
To restart a CSS animation (e.g., a flash effect) on user interaction (like re-clicking an already selected element), the most robust pattern in React is to force a component re-mount.

*   **Technique**: Use a unique `key` prop on the animated element that updates on every interaction.
*   **Implementation**:
    ```tsx
    // Parent
    const [flashTrigger, setFlashTrigger] = useState(0);
    const handleReclick = () => setFlashTrigger(prev => prev + 1);

    // Child
    <div 
      key={flashTrigger} // Changing key forces unmount/remount
      className="animate-flash" 
    />
    ```
*   **Benefit**: This guarantees the CSS animation resets to `0%` immediately, without complex class toggling or `ref` manipulation.

### 2. React Flow Tooltip Scaling
When using `EdgeLabelRenderer` (or custom overlays) in React Flow, the content scales with the canvas zoom by default. To keep tooltips readable (constant screen size) regardless of zoom level:

*   **Technique**: Apply an inverse scale transform using `useViewport`.
*   **Implementation**:
    ```tsx
    function ScaledTooltip() {
      const { zoom } = useViewport();
      return (
        <div style={{ 
          transform: `scale(${1 / zoom})`, 
          transformOrigin: 'bottom center' 
        }}>
          Content
        </div>
      );
    }
    ```

### 3. E2E Testing for Fading Animations
Testing elements with "flash" or "pulse" animations that involve `opacity: 0` can be flaky with Playwright's `toBeVisible()` assertion, as it considers `opacity: 0` as hidden.

*   **Problem**: If the test runs when the animation is at `0%` or `100%` (if it ends at 0), `toBeVisible()` fails.
*   **Solution**: Use `toBeAttached()` to verify the element exists in the DOM, and assert the presence of the animation class.
    ```ts
    // Flaky
    await expect(locator).toBeVisible(); 
    
    // Robust
    await expect(locator).toBeAttached();
    await expect(locator).toHaveClass(/animate-flash/);
    ```

## Comprehensive E2E Retrospective
During the verification of the Error Display feature, we encountered and fixed several recurring flakiness issues in the E2E test suite (`csv-import`, `graph-layout`, `node-properties`). This process revealed broader insights into our development workflow.

### 1. Process Gaps: Accumulated Regressions
*   **Observation**: We discovered failures in `csv-import` and `graph-layout` that likely predated the current feature (possibly introduced during `node-properties` or earlier).
*   **Root Cause**: The full E2E suite was not run consistently at the completion of previous specifications.
*   **Action Item**: Enforce full regression testing at the end of *every* feature cycle to catch issues immediately, preventing "hidden debt" from accumulating.

### 2. Spec Gap: Impact Analysis
*   **Observation**: The `implementation_plan.md` focused solely on the new `error-display.spec.ts`. It did not anticipate that changing shared components (like `Select` interactions or validation logic) would break existing tests.
*   **Action Item**: Specs should explicitly identify shared components/logic being modified and flag dependent tests for review.

### 3. Test Strategy: Evolution vs. New Tests
*   **Observation**: We initially planned a "catch-all" fixture for error modes. However, we found it more effective to evolve the existing `graph-validation.spec.ts` and `csv-import.spec.ts` to cover these cases.
*   **Insight**: Failure modes should be tested individually.

### 4. Technical Debt: Flaky Foundations
*   **Observation**: The `csv-import` tests were built on flaky foundations (`setInputFiles`, fragile selectors). Adding more complexity (validation logic) exposed these weaknesses.
*   **Resolution**: We paid down this technical debt by:
    *   **Drag-and-Drop Simulation**: Replaced `setInputFiles` with a custom `uploadFile` helper using `DataTransfer`.
    *   **Robust Selectors**: Updated to target `*-trigger` elements for Radix UI components.
    *   **Exact Assertions**: Corrected mismatches between test expectations and actual UI text.
    *   **Canvas Interaction**: Fixed flaky side panel closing by targeting `.react-flow__pane`.

### 5. Execution Strategy: Serial vs. Parallel
*   **Observation**: We switched to `serial` execution for some suites to mitigate flakiness.
*   **Retrospective**: This was likely a band-aid for the underlying issues (file upload race conditions). Now that we've fixed the root causes, we should re-evaluate parallel execution to maintain CI speed. This is a candidate for rollback if performance becomes a bottleneck.

### 6. Debugging Bias: Complexity vs. Simplicity
*   **Observation**: When tests failed, we initially assumed complex root causes (race conditions, timing issues) and applied heavy-handed fixes (serial execution, long timeouts).
*   **Reality**: The actual causes were often simple: incorrect selectors (targeting wrappers instead of triggers) or outdated text assertions ("Column Mapping" vs "Nodes").
*   **Action Item**: Apply Occam's Razor. Check for simple selector/text mismatches *first* before assuming concurrency issues.

### 7. Verification Strategy: Visual Inspection
*   **Observation**: We spent time looping through automated test runs to guess the failure cause.
*   **Missed Opportunity**: Manual or visual verification (using the browser tool) would have immediately shown that the feature was working and the test was asserting against the wrong UI state (e.g., dropdowns were present but had different internal structure).
*   **Action Item**: When a test fails but the cause is unclear, prioritize visual inspection (manual or via browser tool) to confirm if it's a *feature failure* or a *test failure*.
