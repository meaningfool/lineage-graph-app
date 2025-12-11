# Restoration Guide: Slice 2 (Node Mapping & Reset)

**Goal**: Restore the "Node Mapping & Reset" functionality on top of the previous commit.
**Constraint**: The "Additional Properties" component will exist in the base commit. **DO NOT DELETE IT**. Leave it non-functional and do not test it.

## 1. Code to Restore (Slice 2 Successes)

Apply these specific code changes to reproduce the successful state.

### A. State Management
**File**: `apps/web/src/hooks/use-new-import-wizard.ts`
**Change**: Add mapping state, validation, and update logic.

```typescript
// ... imports

export const useNewImportWizard = () => {
    // ... existing state

    // [NEW] Mapping State
    const [mapping, setMapping] = useState<{
        id?: string;
        title?: string;
        type?: string;
        source?: string;
        target?: string;
        // NOTE: properties is handled by the generic object but likely unused in this slice's validation
    }>({});

    // [NEW] Update Logic
    const updateMapping = useCallback((field: string, value: string) => {
        setMapping((prev) => ({ ...prev, [field]: value }));
    }, []);

    // [NEW] Validation Logic
    const isMappingValid = () => {
        if (currentStep === "MAP_NODES") {
            return !!mapping.id && !!mapping.title && !!mapping.type;
        }
        return false;
    };

    return {
        // ... existing returns
        mapping,
        updateMapping,
        isMappingValid: isMappingValid(), // Execute and return boolean
    };
};
```

### B. UI Reset Pattern (Key-based Reset)
**File**: `apps/web/src/components/header.tsx`
**Change**: Force unmount/remount of the wizard when closed to reset all internal state (including errors).

```tsx
// Inside Header component
{isWizardOpen && (
    <ImportWizardDialog
        key={isWizardOpen ? "open" : "closed"} // CRITICAL: This key forces a reset
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
    />
)}
```

### C. Mapping Table (Structure & Selectors)
**File**: `apps/web/src/components/wizard/mapping-table.tsx`
**Change**: Use `title` instead of `label` for row ID. Simplify DOM. Add `data-testid`.

**Rows Definition**:
```typescript
{
    id: "title", // CHANGED from "label" to match state
    label: "Display Label",
    required: true,
    description: "Shown on the graph",
},
```

**Render Logic (for Selectors)**:
```tsx
// Inside the mapping loop
<Select
    value={mapping[row.id] || ""}
    onValueChange={(value) => onChange(row.id, value)}
>
    <SelectTrigger
        className="w-full bg-white"
        data-testid={`mapping-select-${row.id}-trigger`} // CRITICAL: Strict selector
    >
        <SelectValue placeholder="Select column..." />
    </SelectTrigger>
    <SelectContent>
        {columns.map((col) => (
            <SelectItem key={col} value={col}>
                {col}
            </SelectItem>
        ))}
    </SelectContent>
</Select>
```

### D. Dialog Wiring
**File**: `apps/web/src/components/wizard/import-wizard-dialog.tsx`
**Change**: Pass mapping props and validation state.

```tsx
// Destructure new hook values
const {
    // ...
    columns,
    mapping,
    updateMapping,
    isMappingValid,
} = useNewImportWizard();

// Update isNextDisabled
const isNextDisabled = () => {
    // ... upload check
    if (currentStep === "MAP_NODES") {
        return !isMappingValid;
    }
    return false;
};

// Pass props to MappingTable
<MappingTable
    type={type}
    columns={type === "NODES" ? columns.nodes : columns.edges}
    mapping={mapping}
    onChange={updateMapping}
/>

// Add test ID to close button
<Button ... data-testid="import-close-button">
```

## 2. Component to PRESERVE (Part 2)

**File**: `apps/web/src/components/wizard/mapping-table.tsx`
**Instructions**:
- In the base commit, you will find a row for `"Additional Properties"` (id: `properties`).
- It likely uses a **custom button toggle implementation** (or `MultiSelect`).
- **DO NOT DELETE IT**.
- **DO NOT TEST IT**.
- Leave it exactly as is (it might be visually present but unwired, or have legacy wiring).
- Focus only on wiring up the `id`, `title`, and `type` fields shown in Section 1.

## 3. Error Display (Part 3)

**File**: `apps/web/src/components/wizard/import-wizard-dialog.tsx`
**Status**: The UI for errors should be a clear red block with spacing. Ensure this style is present/preserved:

```tsx
{error && (
    <div className="rounded-md bg-destructive/15 p-3 text-center font-medium text-destructive text-sm">
        {error}
    </div>
)}
```

## 4. Tests to Restore

**File**: `apps/web/e2e/new-wizard/import-wizard.spec.ts`
**Key Tests**:
1.  `should reset wizard state when modal is closed and reopened` (Verify `mapping-table` is not visible).
2.  `should populate dropdowns with exact CSV headers` (Verify `['id', 'title', 'type']`).
3.  `should populate dropdowns with headers from user screenshot` (Dynamic verification).

**Helper**: Add `getDropdownOptions` to `NewWizardPage.ts`.
