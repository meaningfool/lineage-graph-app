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
