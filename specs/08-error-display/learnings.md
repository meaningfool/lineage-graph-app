# Learnings: Error Display Feature

## Comprehensive E2E Retrospective

### 1. Accumulated Regressions
*   **Context**: We discovered that many tests in the legacy suite were failing because we did not update them as we evolved the shared code. We did not notice this immediately because we were not running the full test suite on a regular basis, focusing only on the new tests for this feature.
*   **Insight**: We must enforce full regression testing at the end of *every* feature cycle to catch side-effects immediately, preventing "hidden debt" from accumulating.

### 2. Impact on Shared Components
*   **Context**: We broke existing tests by modifying shared components (like the Select input interactions and validation logic) without realizing it, because our implementation plan only focused on the new feature's test file.
*   **Insight**: Future specifications must explicitly identify shared components being modified and flag dependent tests for review, ensuring we anticipate the ripple effects of our changes.

### 3. Evolving vs. New Tests
*   **Context**: We initially planned to create a massive new "catch-all" test fixture for all error modes. However, we found it much more effective to simply add new test cases to the existing validation and import test suites.
*   **Insight**: Instead of creating isolated, monolithic test fixtures for new features, we should evolve existing test suites to cover new failure modes within their relevant contexts.

### 4. Flaky Foundations
*   **Context**: We struggled to implement the new validation logic because the underlying file upload tests were flaky (relying on unstable selectors and file input hacks). We had to pause and fix this "plumbing" (implementing robust drag-and-drop and stable selectors) before we could reliably test the new feature.
*   **Insight**: We must pay down technical debt in test foundations *before* building complex new features on top of them, otherwise the instability just amplifies.

### 5. Debugging "Complexity bias"
*   **Context**: When tests failed, we wasted time investigating complex hypotheses such as race conditions when the actual cause was often simple.
*   **Insight**: We should check for simple selector or text mismatches *first* before assuming complex issues such as concurrency.

### 6. Visual Verification First
*   **Context**: We spent hours looping through headless test logs to guess why a test failed. A single glance at the browser would have immediately shown that the feature was working but the test was asserting against the wrong UI state.
*   **Insight**: When a test fails and the cause isn't obvious, prioritize visual inspection (manual or via browser tool) to immediately distinguish between a broken feature and a broken test.
