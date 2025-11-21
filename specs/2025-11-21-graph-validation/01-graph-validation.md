# Feature: Graph Validation with Visual Feedback

## Overview
Validate the imported graph against lineage-specific rules and visually flag violations on the graph. This ensures users can see and fix structural issues.

## Motivation
A lineage graph has specific semantic constraints:
- No orphaned nodes (isolated from the graph)
- Step nodes must have both incoming and outgoing edges
- No cycles (lineage is a DAG)

Instead of silently dropping invalid elements, we display them with visual indicators so users can identify and fix issues.

## Requirements
1. **Orphan Detection**: Identify nodes with no connections.
2. **Step Node Validation**: Ensure STEP nodes have both incoming and outgoing edges.
3. **Cycle Detection**: Detect cycles in the graph.
4. **Visual Feedback**: Highlight invalid nodes/edges in red with tooltips explaining the issue.
5. **Legend**: Provide a legend explaining the validation status.

## User Flow
1. User imports nodes and edges.
2. System detects validation issues.
3. Invalid nodes/edges are rendered in red.
4. User hovers over invalid elements to see the specific violation.
5. User exports/fixes the data and re-imports.

## Design Considerations
- **Non-Blocking**: Display the graph even if it's invalid (don't drop elements).
- **Tooltips**: Use tooltips to explain why each element is invalid.
- **Color Coding**: Red for invalid, green/default for valid.
- **Performance**: Validation algorithms (especially cycle detection) must be efficient.

## Validation Rules
1. **Orphaned Nodes**: Nodes with `degree === 0`.
2. **Invalid STEP Nodes**: STEP nodes with `inDegree === 0` or `outDegree === 0`.
3. **Cycles**: Use DFS to detect cycles in the directed graph.

## TDD Cycles
To be defined during implementation. Likely incremental:
- Cycle 1: Orphan detection
- Cycle 2: Step node validation
- Cycle 3: Cycle detection
