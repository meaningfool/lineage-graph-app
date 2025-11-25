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
