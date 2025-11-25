# Learnings: Column Mapping Wizard

## TypeScript Best Practices

### Avoid Non-Null Assertions (`!`)
Using the non-null assertion operator (`!`) to bypass TypeScript's strict null checks is an anti-pattern, as it introduces a hidden dependency between validation logic and usage logic.

**Anti-Pattern:**
```typescript
// Implicit trust: assumes validation happened elsewhere
const value = row[mapping.id!]; 
```

**Preferred Approach:**
Use explicit runtime guards or destructuring with checks to narrow types safely. This ensures that if validation logic changes, the code remains safe or fails gracefully.

```typescript
// Explicit trust: validates locally before use
const { id } = mapping;
if (!id) throw new Error("ID not mapped");
const value = row[id]; // TypeScript knows 'id' is string
```

### Parse, Don't Validate
Instead of checking "is this valid?" at every step (and using `!` or `?`), define a strict type (e.g., `ValidatedMapping`) and transform the loose input into this strict type *once* at the boundary. This eliminates the need for defensive coding deep in the logic.

### Type Predicates vs. Type Assertions
**Anti-Pattern**: `nodes.filter(n => n !== null) as Node[]`
*   **Risk**: You are lying to TypeScript. If `n` is not actually a `Node`, runtime errors occur.

**Best Practice**: `nodes.filter(isNode)`
*   **Solution**: Create a user-defined type guard (`function isNode(n: any): n is Node`). This forces runtime verification and allows TypeScript to narrow the type safely.

## React Patterns

### Controlled vs. Uncontrolled Modals
*   **Controlled** (`isOpen` prop): Parent controls everything. Good for complex flows (e.g., "Block close until save").
*   **Uncontrolled** (Internal state): Component controls itself. Simpler for "fire and forget" modals.
*   **Verdict**: Start with Controlled for critical UI components to ensure testability and predictable state management.

### Animation Cleanup & Magic Numbers
**Anti-Pattern**: `setTimeout(resetState, 300)`
*   **Risk**: If CSS animation changes to 500ms, the state resets while visible. If it changes to 100ms, the user waits unnecessarily.

**Best Practice**: `onAnimationEnd`
*   **Solution**: Use the browser's native event to trigger cleanup exactly when the animation finishes. Avoid hardcoded timing constants ("magic numbers") in logic.

## Refactoring & Polish (Cycle 4)

## Refactoring & Polish (Cycle 4)

### State Reset in Uncontrolled Components
**Insight**: Attempting to manually reset internal state via external props (`isOpen`) or internal handlers creates tight coupling and fragile logic.
**Solution**: Use the **Key-based Reset Pattern**. By changing the component's `key` (or conditionally rendering it) when it closes, React automatically unmounts and destroys the instance. The next time it opens, a fresh instance is created with pristine state. This requires **zero** reset logic inside the component itself.

### Layered Architecture for Complex Modals
**Insight**: The `CSVImportModal` was becoming a "God Component", handling UI, state, and complex CSV parsing logic all in one file. This made it hard to test and maintain.
**Solution**: We split the feature into three distinct layers:
1.  **Domain Layer** (`lib/csv-graph-importer.ts`): Pure functions for parsing and validation. Testable without React.
2.  **State Layer** (`hooks/use-csv-import-wizard.ts`): A custom hook managing the wizard's state machine.
3.  **UI Layer** (`components/csv-import/*`): Dumb presentational components (`StepUpload`, `StepMapping`) orchestrated by a thin container (`CSVImportModal`).

### Explicit State Clearing
**Insight**: If a file upload fails validation, simply showing an error message is not enough. The invalid file object might persist in the component state, causing the UI to look "ready" when it's not.
**Solution**: Explicitly clear the invalid data from the state (e.g., `setFiles(..., nodes: null)`) immediately upon catching the validation error.

### Component Simplification (YAGNI)
**Insight**: We initially built `CSVImportModal` to support both Controlled and Uncontrolled modes "just in case". This added unnecessary complexity (conditional logic, dual state).
**Solution**: We verified that only Uncontrolled mode was used and removed the Controlled mode logic. **Lesson**: Don't build for hypothetical use cases; refactor when the need actually arises.
