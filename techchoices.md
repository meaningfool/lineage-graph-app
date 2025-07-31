# Technical Implementation Choices

This file documents specific technical decisions and implementation patterns used in this project. These are more detailed than the process guidelines in CLAUDE.md and serve as reference for consistent implementation approaches.

## Side Panel Development Patterns

### State Management
- Use separate state for visibility and content: `sidePanelVisible` + `selectedNode`
- Track selected entities separately from UI state for flexible interactions
- Maintain panel stability during content updates (no re-mounting)

### Positioning and Styling
- Use fixed positioning for overlay panels: `fixed top-0 right-0 w-80 h-full`
- Implement smooth transitions: `transition-transform duration-300 ease-in-out`
- Apply proper z-index for layering: `z-50`
- Use TailwindCSS classes for consistent styling

### ReactFlow Integration
- Handle node clicks via `onNodeClick` prop on ReactFlow component, not individual node handlers
- Update ReactFlow mocks to support `onNodeClick` for proper test coverage
- Pass node data through click handler: `(_event, node) => { ... }`

### Example Implementation
```typescript
const [sidePanelVisible, setSidePanelVisible] = useState(false)
const [selectedNode, setSelectedNode] = useState<Node | null>(null)

const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
  setSidePanelVisible(true)
  setSelectedNode(node)
}
```

## Component State Management Patterns

### React State Best Practices
- Use `_event` parameter prefix for unused React event handlers
- Separate visibility state from content state for better UX
- Track selected entities separately from UI state
- Maintain component stability during state updates

### State Update Patterns
- Always update related states together in the same handler
- Use functional updates when state depends on previous state
- Keep state as minimal as possible while maintaining functionality

## Testing Implementation Details

### ReactFlow Mocking
- Mock ReactFlow components to support testing without canvas rendering
- Include `onNodeClick` prop in mocks for proper event testing
- Render node data attributes for test accessibility

### Test Data Patterns
- Use specific node IDs from actual data (`node-new-users`) for predictable tests
- Test with multiple nodes to verify switching behavior
- Include mock data that matches real application structure

### CSS Class Testing
- Test for presence of transition classes without testing specific values
- Focus on functional CSS classes that affect behavior
- Avoid testing purely aesthetic CSS properties

## Animation and Transition Choices

### Transition Specifications
- Use `transition-transform` for smooth slide animations
- Standard duration: `duration-300` for responsive feel
- Easing: `ease-in-out` for natural motion
- Transform properties: `translateX` for horizontal sliding

### UX Considerations
- Opening transition: smooth slide-in from right
- Content switching: instant updates without re-animation
- No closing animation implemented (panel stays stable)

## Component Architecture Patterns

### Panel Component Structure
```typescript
{sidePanelVisible && (
  <div className="fixed top-0 right-0 w-80 h-full bg-white border-l border-gray-300 shadow-lg z-50 transition-transform duration-300 ease-in-out">
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Panel Title</h3>
      {selectedItem && (
        <div>
          <p className="font-medium">{selectedItem.data.label}</p>
        </div>
      )}
    </div>
  </div>
)}
```

### Event Handler Patterns
- Use descriptive handler names: `handleNodeClick`, `handlePanelClose`
- Include proper TypeScript types for event parameters
- Handle unused parameters appropriately with underscore prefix

## Performance Considerations

### React Rendering Optimization
- Use `useMemo` for expensive computations
- Avoid recreating objects in render cycles
- Keep event handlers stable with useCallback when needed

### State Update Efficiency
- Batch related state updates in single handlers
- Avoid unnecessary re-renders through proper state structure
- Use conditional rendering for expensive components