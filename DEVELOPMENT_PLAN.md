# Data Lineage App - Development Roadmap

## 🎯 Current Status
- ✅ Basic lineage graph visualization working
- ✅ Graph layout with layer-based positioning
- ✅ Unit tests for LineageGraph utilities
- ✅ Static data loading from `target-lineage.json`
- ✅ Basic node rendering with properties displayed on nodes

## 📋 Development Phases

### Phase 1: Data Source Flexibility 🔄
**Goal**: Make the app more dynamic by allowing users to choose data sources

#### 1.1 Data Source Selection UI
- [ ] Create data source selector component
- [ ] Add "Load Default Data" option (current target-lineage.json)
- [ ] Add "Generate Sample Data" option
- [ ] Write tests for data source selection logic

#### 1.2 Sample Data Generation
- [ ] Create utility to generate varied lineage graphs programmatically
- [ ] Implement different graph patterns (linear, diamond, complex branching)
- [ ] Add tests for data generation functions
- [ ] Ensure generated data follows the same schema as target-lineage.json

### Phase 2: Scalability Testing 📊
**Goal**: Ensure the layout works with larger, more complex graphs

#### 2.1 Large Graph Testing
- [ ] Create test datasets with 50+ nodes
- [ ] Create test datasets with 10+ layers deep
- [ ] Create test datasets with complex branching patterns
- [ ] Identify and fix performance bottlenecks

#### 2.2 Layout Algorithm Improvements
- [ ] Test current layer-based algorithm with large datasets
- [ ] Optimize rendering performance for large graphs
- [ ] Add zoom and pan capabilities for large graphs
- [ ] Implement viewport virtualization if needed

### Phase 3: Enhanced UX - Node Properties Panel 🖱️
**Goal**: Move node properties to a side panel for cleaner visualization

#### 3.1 Side Panel Component
- [ ] Design and implement collapsible side panel
- [ ] Create node property display component
- [ ] Add tests for panel interaction behavior
- [ ] Ensure responsive design across screen sizes

#### 3.2 Node Selection System
- [ ] Implement node click/selection state management
- [ ] Add visual feedback for selected nodes
- [ ] Handle selection clearing (click outside, ESC key)
- [ ] Write tests for selection behavior

#### 3.3 Properties Display
- [ ] Clean up node rendering (remove inline properties)
- [ ] Format properties nicely in side panel
- [ ] Add search/filter for properties if many exist
- [ ] Handle different property types (strings, numbers, arrays, objects)

### Phase 4: Advanced Layout Features 📐
**Goal**: Improve graph layout with better alignment and layer utilization

#### 4.1 Source/Target Alignment
- [ ] Implement left-alignment for all output nodes (sources)
- [ ] Implement right-alignment for all input nodes (targets)
- [ ] Maintain layer-based vertical positioning
- [ ] Add tests for alignment logic

#### 4.2 Layer-Based Layout Enhancement
- [ ] Optimize layer calculation algorithm
- [ ] Implement better spacing between layers
- [ ] Add support for nodes that span multiple layers
- [ ] Handle edge cases (circular dependencies, disconnected nodes)

### Phase 5: Visual Polish & Styling 🎨
**Goal**: Make the visualization more appealing and professional

#### 5.1 Node Styling System
- [ ] Design color scheme for different node types
- [ ] Implement hover states and animations
- [ ] Add icons or visual indicators for node types
- [ ] Create consistent visual hierarchy

#### 5.2 Edge Styling
- [ ] Improve edge rendering (curves, arrows, colors)
- [ ] Add edge labels for relationship types
- [ ] Implement edge hover/selection states
- [ ] Add visual flow indicators (animated arrows?)

#### 5.3 Theme Integration
- [ ] Ensure styling works with existing dark/light theme
- [ ] Create data lineage specific color palettes
- [ ] Add customization options for colors/themes

### Phase 6: Data Import Capabilities 📁
**Goal**: Allow users to import their own lineage data

#### 6.1 File Import Infrastructure
- [ ] Design file upload component
- [ ] Implement CSV parser for lineage data
- [ ] Add data validation and error handling
- [ ] Create mapping UI for CSV columns to lineage schema

#### 6.2 Multiple Format Support
- [ ] Support JSON import (different schemas)
- [ ] Support Excel/XLSX files
- [ ] Consider other common data lineage formats
- [ ] Add import preview functionality

## 🔄 Next Immediate Steps

### Current Sprint Focus
1. **Data Source Selection UI** (Phase 1.1)
   - Start with simple toggle between default and generated data
   - Add basic UI component with tests
   
2. **Sample Data Generation** (Phase 1.2)
   - Create 2-3 different sample datasets
   - Ensure they exercise different layout scenarios

### Testing Strategy
- Follow TDD approach: write tests first for each new feature
- Maintain test coverage above 90%
- Add visual regression testing for layout changes
- Performance testing for large datasets

## 📝 Notes & Considerations

### Technical Decisions to Make
- Should we use a state management library (Redux, Zustand) for complex state?
- How to handle very large graphs (virtualization strategy)?
- What's the maximum reasonable graph size to support?

### UI/UX Considerations
- Keyboard shortcuts for common actions
- Accessibility for screen readers
- Mobile responsiveness (though desktop-first)
- Undo/redo for graph manipulations

### Future Enhancements (Backlog)
- Export functionality (PNG, SVG, PDF)
- Graph comparison mode
- Real-time collaboration features
- Integration with common data tools
- API for external data sources

---

## 📈 Progress Tracking

**Completed**: 
- Basic graph visualization
- Layer-based layout algorithm
- Test infrastructure setup

**In Progress**: 
- [Current task will be updated here]

**Blocked**: 
- [Any blockers will be noted here]

---

*Last Updated: [Date]*
*Next Review: [Date]* 