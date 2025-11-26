# Slice 2: Node Connectivity

## Goal
Ensure valid data flow by validating connections based on node type.
- **INPUT**: Must have at least one **outgoing** edge.
- **OUTPUT**: Must have at least one **incoming** edge.
- **STEP**: Must have at least one **incoming** AND at least one **outgoing** edge.

## Validation Rules
| Node Type | Rule | Error Message |
| :--- | :--- | :--- |
| `INPUT` | `outDegree > 0` | "Input node must have an outgoing connection" |
| `OUTPUT` | `inDegree > 0` | "Output node must have an incoming connection" |
| `STEP` | `inDegree > 0` AND `outDegree > 0` | "Step node must have both incoming and outgoing connections" |

## Testing Strategy (Phased E2E)

### Phase 1: Logic & Visuals
- **Test Case**: `should validate connectivity rules for all node types`
- **Setup**:
    - **Nodes**:
        - `A` (Input) - Valid
        - `B` (Step) - Invalid (Missing Outgoing)
        - `C` (Output) - Invalid (Missing Incoming)
        - `D` (Input) - Invalid (Missing Outgoing)
    - **Edges**:
        - `A -> B`
    - **Expected Errors**:
        - `B`: "Step node must have both..." (Has incoming, missing outgoing)
        - `C`: "Output node must have..." (Orphan, but specific error takes precedence?) -> *Decision: Orphan check is generic. Connectivity check is specific. If degree is 0, it's an orphan. If degree > 0 but flow is wrong, it's a connectivity error.*
        - `D`: "Input node must have..." (Orphan) -> *Refinement: Should we show "Orphan" or "Input missing outgoing"? "Orphan" is simpler for degree 0. Connectivity errors are for "Dead ends" or "Sources from nowhere".*

**Refined Logic**:
1. If `degree === 0` -> **Orphan Error** (Already implemented).
2. Else -> Check Connectivity Rules.

**Revised Test Setup**:
- **Nodes**:
    - `A` (Input)
    - `B` (Step)
    - `C` (Output)
- **Edges**:
    - `A -> B` (A is valid, B has incoming but no outgoing -> Invalid)
    - `B` connects to nothing.
    - `C` connects to nothing (Orphan - covered by Slice 1).
    - Let's make `C` have an outgoing edge to nowhere? No, edges to nowhere are dropped.
    - Let's make `C` have an outgoing edge to `B`. `C -> B`.
    - `C` is Output. It has outgoing, but needs incoming. -> Invalid.

**Final Test Case**:
- **Nodes**: `In1` (Input), `Step1` (Step), `Out1` (Output).
- **Edges**: `In1 -> Step1`.
- **Analysis**:
    - `In1`: Input, Out=1. **Valid**.
    - `Step1`: Step, In=1, Out=0. **Invalid** (Missing outgoing).
    - `Out1`: Output, In=0, Out=0. **Orphan** (Slice 1).
    - *Wait, we need to test Output missing incoming specifically, not just orphan.*
    - Connect `Out1 -> Step1`.
    - `Out1`: Output, Out=1, In=0. **Invalid** (Output should not have outgoing? No, spec says "Must have incoming". It doesn't forbid outgoing, but usually Output is a sink. Let's stick to "Must have incoming").

### Phase 2: Tooltip Verification
- Verify correct error messages in tooltips.

## Implementation Plan

### 1. Domain Logic (`src/lib/graph-validation.ts`)
- Update `validateGraph` to calculate `inDegree` and `outDegree`.
- Apply rules based on `node.type`.
- **Priority**: Orphan check first. If not orphan, check connectivity.

### 2. UI (`lineage-graph.tsx`)
- No changes needed! `CustomNode` already displays `validationErrors`.
