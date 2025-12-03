# Research: Node Properties

## ShadCN Multi-Select Component
We have installed a custom Multi-Select component to handle property selection.

### 1. Component Details
*   **Source**: [shadcn-multi-select-component](https://github.com/sersavan/shadcn-multi-select-component)
*   **File**: `apps/web/src/components/ui/multi-select.tsx`
*   **Dependencies**: `cmdk`, `badge`, `command`, `popover`, `separator` (All installed).

### 2. Usage Example
```tsx
import { MultiSelect } from "@/components/ui/multi-select";

<MultiSelect
  options={[
    { label: "Description", value: "description" },
    { label: "Created At", value: "created_at" },
  ]}
  onValueChange={(values) => console.log(values)}
  defaultValue={["description"]}
  placeholder="Select properties..."
  variant="default"
  maxCount={3}
/>
```

### 3. Testing Strategy (Playwright)
The component is built on top of `cmdk` and `Popover`.
*   **Trigger**: The main button has `role="combobox"`.
*   **Options**: Inside a `role="listbox"` (or `cmdk-list`).
*   **Interaction**:
    1.  Click the trigger (use a `data-testid` wrapper or finding by role).
    2.  Wait for the Popover.
    3.  **CRITICAL**: Select options using `page.locator('[data-value="..."]')`.
        *   Do NOT use `getByRole('option', { name: '...' })` because the `aria-label` changes dynamically (e.g., "prop1, selected"), causing exact text matches to fail.
        *   Do NOT use text content selectors for the same reason.

**Warning**: The component uses `cmdk` which can sometimes trap focus. Always use stable attributes like `data-value` or `data-testid` to interact with options.

## Radix UI Dialog & Popover Scroll Issue

### Problem
When using a `MultiSelect` component (built with Radix UI Popover) inside a Radix UI `Dialog` (e.g., the Import Modal), the mouse wheel scroll on the Popover content was blocked.
- **Symptoms**: The scrollbar appeared and could be dragged, and keyboard navigation worked, but the mouse wheel did not scroll the content.
- **Cause**: Radix UI `Dialog` uses `react-remove-scroll` to lock the body scroll when open. This can interfere with nested Portals, such as the one used by `Popover`. The `Dialog` believes the `Popover` content (rendered in a Portal) is outside the allowed scroll area.

### Solution
Setting `modal={true}` (or `modalPopover={true}` in our wrapper) on the `Popover` component fixes this.
- **Mechanism**: This tells the Popover to take over the modal context, ensuring that interactions within it are handled correctly and that it is recognized as the active modal layer, thus allowing scrolling.
- **Implementation**: Added `modalPopover={true}` to the `MultiSelect` component when used inside a Dialog.

### References
- [Radix UI Popover Documentation](https://www.radix-ui.com/primitives/docs/components/popover)
- Common issue with nested Radix primitives and scroll locking.

## E2E Testing & Tooling Insights

### Failure Mode Analysis
During the implementation of Slice 3, we encountered repeated E2E test failures due to unstable selectors.
*   **The Error**: We attempted to select a dropdown option using `getByRole('option', { name: 'prop1' })`. This failed because the component dynamically updates the `aria-label` to include "selected" (e.g., "prop1, selected"), causing exact text matches to fail.
*   **The Root Cause**: We violated the project policy (defined in `AGENT.md`) to **ALWAYS use `data-testid` or stable attributes**. We guessed the selector instead of inspecting the DOM.
*   **The Fix**: Switching to `page.locator('[data-value="prop1"]')` provided a stable, state-independent selector.

### Tool Comparison: Browser Subagent vs. Chrome DevTools MCP
We clarified the capabilities of the AI's internal browser tool versus the Chrome DevTools MCP.

| Feature | Browser Subagent | Chrome DevTools MCP |
| :--- | :--- | :--- |
| **Primary Perspective** | **User-Centric**: "Sees" the page (screenshots) and interacts like a human. | **Code-Centric**: Hooks into the browser engine (CDP). |
| **Inspection** | **Snapshot-based**: Can dump HTML, computed styles, and run JS. Good for static analysis of the current state. | **Live/Deep**: Can intercept network, debug JS, and inspect memory. |
| **Best For...** | Verifying UI layout, E2E testing, and fixing selector issues. | Debugging complex logic, API failures, or performance issues. |

**Key Insight**: For selector issues, the Browser Subagent is fully capable. It can retrieve `outerHTML` or computed styles to find stable attributes, just like "Inspect Element".

### Workflow Improvements
To prevent future failures, we added a strict **E2E Failure Protocol** to `AGENT.md`:
1.  **Stop & Inspect**: Never guess selectors on failure. Inspect immediately.
2.  **Policy Check**: Ensure selectors use `data-testid` or stable attributes.
3.  **Manual Fallback**: If a fix fails once, request manual verification to unblock.
