# Slice 2: Node Connectivity

## Goal
Implement validation rules for node connectivity, sliced by Node Type.
**Global Change**: Remove the generic "Orphan Node" check. Specific connectivity rules will now cover all isolation cases.

---

## Slice 2.1: Input Nodes

### Rule
- **Definition**: `type === 'INPUT'`
- **Logic**: `inDegree === 0` AND `outDegree > 0`
- **Error Message**: "Input node must have at least one outgoing connection and no incoming connections."

### Test Case: `should validate Input node rules`
- **Setup**: Import CSV with:
    - `A` (Input): Valid (`in=0, out=1`).
    - `B` (Input): Invalid Sink (`in=1, out=0`).
    - `C` (Input): Invalid Pass-through (`in=1, out=1`).
    - `D` (Input): Invalid Orphan (`in=0, out=0`).
- **Assertions**:
    - `A`: Valid.
    - `B`, `C`, `D`: Invalid. All show the **same error message**: "Input node must have at least one outgoing connection and no incoming connections."
    - **Visual Proof**: Capture screenshot `input-validation-verified.png`.

### Implementation Plan (Slice 2.1)
1.  **Domain Logic** (`src/lib/graph-validation.ts`):
    - Remove generic `degree === 0` check.
    - Add `INPUT` specific check: `if (node.type === 'INPUT' && (inDegree > 0 || outDegree === 0))`.
    - Push specific error message.
2.  **UI Layer**: No changes.

---

## Slice 2.2: Output Nodes

### Rule
- **Definition**: `type === 'OUTPUT'`
- **Logic**: `inDegree > 0` AND `outDegree === 0`
- **Error Message**: "Output node must have at least one incoming connection and no outgoing connections."

### Test Case: `should validate Output node rules`
- **Setup**: Import CSV with:
    - `A` (Output): Valid (`in=1, out=0`).
    - `B` (Output): Invalid Source (`in=0, out=1`).
    - `C` (Output): Invalid Pass-through (`in=1, out=1`).
    - `D` (Output): Invalid Orphan (`in=0, out=0`).
- **Assertions**:
    - `A`: Valid.
    - `B`, `C`, `D`: Invalid. All show the **same error message**: "Output node must have at least one incoming connection and no outgoing connections."

### Implementation Plan (Slice 2.2)
1.  **Domain Logic**: Add `OUTPUT` specific check.

---

## Slice 2.3: Step Nodes

### Rule
- **Definition**: `type === 'STEP'`
- **Logic**: `inDegree > 0` AND `outDegree > 0`
- **Error Message**: "Step node must have at least one incoming connection and at least one outgoing connection."

### Test Case: `should validate Step node rules`
- **Setup**: Import CSV with:
    - `A` (Step): Valid (`in=1, out=1`).
    - `B` (Step): Invalid Source (`in=0, out=1`).
    - `C` (Step): Invalid Sink (`in=1, out=0`).
    - `D` (Step): Invalid Orphan (`in=0, out=0`).
- **Assertions**:
    - `A`: Valid.
    - `B`, `C`, `D`: Invalid. All show the **same error message**: "Step node must have at least one incoming connection and at least one outgoing connection."

### Implementation Plan (Slice 2.3)
1.  **Domain Logic**: Add `STEP` specific check.
