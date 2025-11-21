# Feature: Node Properties

## Overview
Import and display additional columns from the Nodes CSV as properties. This feature has two cycles:
1. **Cycle 1: Auto-Import**: Automatically treat all unmapped columns as properties.
2. **Cycle 2: Custom Selection**: Allow users to choose which properties to import/display.

## Motivation
Users often have metadata in their CSVs (e.g., `owner`, `created_date`, `description`) that they want to view in the lineage graph.

## Requirements

### Cycle 1: Auto-Import Properties
1. **Import**: Automatically import all columns not mapped to `id`, `title`, or `type`.
2. **Storage**: Store properties in the node data structure.
3. **Display**: Show properties in a node detail panel or tooltip.

### Cycle 2: Custom Selection
1. **UI**: Add checkboxes in the column mapping wizard to enable/disable properties.
2. **Filtering**: Only import checked properties.
3. **Display**: Show only selected properties in the UI.

## User Flow

### Cycle 1
1. User uploads Nodes CSV with extra columns.
2. System imports all columns (except `id`, `title`, `type`) as properties.
3. User clicks a node to see properties.

### Cycle 2
1. User sees all available columns in mapping wizard.
2. User unchecks unwanted properties.
3. Only selected properties are imported and displayed.

## Design Considerations
- **Data Structure**: Extend node `data` object to include a `properties` field.
- **UI Location**: Display properties in a sidebar panel or tooltip.
- **Performance**: Large numbers of properties may impact rendering.

## TDD Cycles
To be defined during implementation.
