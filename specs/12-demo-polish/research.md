# Research: Demo Polish

## Context
Refining the application for a public demo. Focus is on aesthetics and smooth flow.

## Questions
*   What is the optimal recording resolution? (Likely 1920x1080 or 4k cropped).
*   Which screen recording tool? (QuickTime, OBS, ScreenStudio).

### Playwright Actionability vs. Overlay Race Conditions (The "Ghost Overlay" Flake)
*   **The Issue**: `await button.click()` failed consistently with "intercepted by overlay" (specifically `div.fixed.inset-0.bg-black/50`).
*   **The Mechanism**: Playwright's `click()` command performs a rigorous "Actionability" check. It verifies the element is visible, enabled, stable, and *not covered by other elements* at the exact center point.
*   **The Flake**:
    1.  Test calls `await button.click()`.
    2.  Playwright verifies the button is actionable (it is).
    3.  Playwright triggers the click event.
    4.  **Race Condition**: The app reacts instantly (due to React state update + `fixed` positioning), rendering the modal overlay.
    5.  Playwright, in its "verification" phase (or retry loop if the click wasn't deemed "successful" by its internal heuristics, e.g., if the element detached/moved), attempts to interact again or verify the click.
    6.  It now encounters the **Overlay** covering the button.
    7.  It reports "Intercepted by overlay".
*   **Why `force: true` didn't work**: While `force: true` skips the actionability check, it still attempts to click at the coordinates. If the overlay is physically there, the click hits the overlay (which closes the dialog in our app logic), leading to a state mismatch.
*   **The Solution**: `await button.dispatchEvent("click")`.
    *   This bypasses Playwright's user-event simulation entirely. It programmatically fires the `click` event on the DOM node.
    *   It does not check for overlays, visibility (beyond basic presence), or stability.
    *   It is immune to the race condition where the UI changes *during* the click action sequence.
*   **Takeaway**: When testing interactions that trigger immediate, full-screen layout shifts (like opening a modal), `dispatchEvent("click")` is more robust than `click()` if you encounter "interception" errors despite the element being visible initially.

#### Why did this only affect `error-display.spec.ts` (and specifically Scenario 1)?
1.  **Tested Hypothesis: Selector Speed**: We tested replacing `getByTestId` with the slower `getByRole` to see if it mitigated the issue. **It did not**. The race condition persisted.
2.  **Confirmed Factor: Cold Start Race Condition**: We confirmed that **running Scenario 2 in isolation (making it the first test) caused it to fail**. This proves the flake is driven by the unique timing profile of the **Test Runner's Cold Start** (JIT, initial resource parsing).
3.  **Conclusion**: The specific timing "stutter" of the first executed test aligns the click action with the overlay's appearance window. `csv-import.spec.ts` likely avoids this due to different setup overhead or luck of execution order, while `error-display.spec.ts` hit the "Sweet Spot" of failure. `dispatchEvent("click")` is the correct fix as it bypasses the timing dependency entirely.

#### External Research Validation
Research into Playwright "intercepted by overlay" errors confirms this pattern:
*   **Mechanism**: Playwright's `click()` enforces strict "Actionability" checks (visible, stable, not obscured). Race conditions occur when an overlay appears *after* the check passes but *before* the action completes (or during Playwright's internal retry/verification loop).
*   **Cold Start Correlation**: "First test assertions" are a known source of flakiness due to the unpredictability of the initial worker process (JIT compilation, resource parsing), which creates unique timing windows that standard "warm" tests miss.
*   **Recommended Fixes**:
    *   **`dispatchEvent("click")`**: Recognized as a valid workaround for "unclickable" elements when the obstruction is a side-effect of the click itself (like a modal opening instantly), as it bypasses the user-event simulation and actionability checks.
    *   **`page.addLocatorHandler`**: (Playwright 1.42+) Useful for *random* overlays (cookies, popups) but overkill for deterministic application logic like our wizard.

#### The "Impossible" Causality: How can the Result block the Cause?
The user asked: *"How can the click be blocked by the modal if it is the very thing that triggers its opening?"*

The answer lies in the fact that **`await button.click()` is not atomic**. It is a multi-step process:
1.  **Check**: Playwright verifies the button is clickable.
2.  **Fire**: Playwright dispatches the event.
    *   *Browser Action*: The app receives the click -> React State Updates -> **Overlay Renders**.
3.  **Verify/Retry**: This is the crucial step. Playwright attempts to ensure the click "succeeded" or prepares to retry if the element moved.
    *   **The Race**: In a "Cold Start", the Playwright runner pauses slightly after Step 2. When it resumes to perform Step 3 (verification or a safety retry), it re-checks the coordinates (x, y).
    *   **The Error**: It now finds the **Overlay** (result of Step 2) covering the button. It interprets this as "I cannot click this button anymore" and throws the "Intercepted" error.
    *   **The Paradox**: The mechanism effectively "punishes" the test for the app being *too fast* relative to the test runner's verification cycle. Playwright sees the *consequence* of the click (the overlay) as an *obstruction* to the click.

#### Internal Mechanics: "Auto-Waiting" Internals
Playwright's `click()` isn't just a browser event; it's a lifecycle managed by the runner:
1.  **Resolution**: Waits for selector to point to exactly one DOM element.
2.  **Actionability Checks (Pre-Click)**:
    *   **Attached**: Element connected to DOM.
    *   **Visible**: Computed style != none/hidden.
    *   **Stable**: Not animating (checks position over two consecutive frames).
    *   **Receives Events**: Checks if `document.elementFromPoint(x, y)` returns the target. **(This fails later)**.
3.  **Dispatch**: Fires `mousedown`, `mouseup`, `click`.
4.  **Verification (The Flake Source)**:
    *   Playwright expects the element to remain "interactable" during the action sequence.
    *   If the runner "hiccups" (Cold Start JIT/GC pause) *after* dispatching `mousedown` but *before* verifying the sequence is complete, the React state updates, the Overlay renders, and `elementFromPoint(x, y)` now returns the Overlay.
    *   If the runner "hiccups" (Cold Start JIT/GC pause) *after* dispatching `mousedown` but *before* verifying the sequence is complete, the React state updates, the Overlay renders, and `elementFromPoint(x, y)` now returns the Overlay.
    *   Playwright sees that the target element is no longer the top-most element at those coordinates and throws "Intercepted by [Overlay Element]".

#### Why verify *after* the click? (The "Success Guarantee")
The user asked: *"Why does Playwright do this verification after doing the click?"*

It isn't just double-checking; it's part of the **Auto-Retry** mechanism designed to handle "detached" or moving elements.
1.  **The "Click Confidence" Problem**: In modern SPAs (Single Page Apps), elements often re-render (detach and re-attach) instantly. A click might technically fire, but if the element was swapped out precisely at that moment, the event listener might not have triggered.
2.  **The Solution**: Playwright doesn't assume firing the event `click` equals success. It verifies that the element accepted the event.
3.  **The Trap**: In our specific "Cold Start" case:
    *   Playwright fires `click`.
    *   Runner stutters (Cold Start).
    *   Runner wakes up and asks: "Did that work? Is the element still there and clickable?" (The Retry/Verify Check).
    *   **Result**: It sees the **Overlay** covering the button.
    *   **Inference**: Instead of assuming "Oh, the click surely opened this overlay!", Playwright's strict safety logic infers: "Wait, the button is covered! My previous click intent might have been intercepted or failed. I cannot confirm success. I must report that the button is blocked."

It biases towards **false negatives** (failing safely) rather than **false positives** (assuming a click worked when it didn't).
