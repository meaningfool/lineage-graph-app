# Research: Lineage Isolation

## Architecture & State Management

### Explicit State for Attention vs. Derived State
**Problem**: We initially tried to derive the "flashing error" state from `isSelected && hasError`. This led to a poor UX where simply selecting a node (to view details) triggered a panic-like flashing animation.
**Solution**: Decoupled "Selection" from "Attention" by introducing explicit state (`flashingNodeId`).
**Learning**: Visual "attention grabbing" mechanisms (flashing, bouncing) should be driven by **events** (e.g., clicking a side panel item), not just static properties keying off selection. Explicit state is safer prevents "implicit behavior" bugs.

### Regression Safety in State Interactions
**Observation**: Introducing `flashingNodeId` introduced a regression where clicking an *Edge Error* didn't clear the *Node Flash*.
**Takeaway**: When adding a new UI state that is mutually exclusive with others (e.g., "Pulse"), explicitly map out all "Exit Actions" (clicking background, clicking another entity, switching modes) to ensure cleanup.

## UI/UX & Visualization

### Transitions vs. Analysis
**Decision**: We removed `ease-in-out` transitions for opacity changes.
**Rationale**: highlighting Logic is complex (cycles, descendants). Smooth transitions "muddy the waters" during analysis, making it hard to tell if a node is dimmed or just fading.
**Guidance**: For data-heavy or state-heavy validations, prefer **"crisp" (instant) feedback**. Re-introduce motion only as a "delight" layer once correctness is absolute, or keep it instant for "pro" tools.

## Testing Strategy

### System Load & Timeouts
**Issue**: Severe timeouts (30s+) on `page.goto` during local testing.
**Root Cause**: Stale `node` and `playwright` processes from aborted runs consuming >1.5GB RAM.
**Fix**: `pkill -f "playwright|test:e2e|next"` immediately resolved the stability issues.
**Action**: If tests flake on navigation, check system resources first.
