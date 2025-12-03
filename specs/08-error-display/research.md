# Research: Error Display Feature

## Context
We are adding a feature to display validation errors in the graph. Currently, errors are only shown as tooltips on nodes/edges. We want a more persistent and accessible way to view all errors.

## UX Decisions
- **Panel Position**: Left side. This allows it to coexist with the Node Properties panel (Right side).
- **Toggle**: Floating button with a badge showing the error count. Hidden if count is 0.
- **Interaction**: Clicking an error selects the node (if applicable) and focuses the camera.

## Technical Implementation
- **State**: `isErrorPanelOpen` in `LineageGraph`.
- **Data**: Error list derived from `nodes` and `edges` props (checking `data.validationErrors`).
- **Navigation**: Use `reactFlowInstance.fitView()` for focus.
