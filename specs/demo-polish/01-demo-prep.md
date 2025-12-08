# Spec: Demo Preparation & Polish

## Goal
Prepare the application for a high-quality video demo by polishing visual interactions and establishing a scripted scenario with dedicated fixtures.

## Slice 1: Visual Polish
**Goal**: Enhance the visual experience to look professional and "crisp".
**Details**:
- **Scope**: Identify and refine UI/UX rough edges.
- **Areas**:
    - Transitions/Animations (smoothness vs crispness).
    - Layout/Spacing consistency.
    - Feedback for interactions (hover, click).

## Slice 2: Demo Scenario & Fixture
**Goal**: Create a rich graph fixture and a script to showcase all features.
**Details**:
- **Fixture**: `demo_showcase`
    - Needs to be complex enough to look impressive but simple enough to follow.
    - Contains:
        - Cycles (to show robustness).
        - Errors (missing type, duplicate ID) to demo Error Panel.
        - Clear lineage paths for Subtree Highlighting.
- **Script**:
    1. **Import**: Upload `demo_showcase` CSVs.
    2. **Mapping**: Demonstrate Column Mapping.
    3. **Validation**: Show Error Panel (Red Badge, pulsing).
    4. **Navigation**: Click error to find node.
    5. **Analysis**: Use "Focus Subtree" to isolate a specific flow.
    6. **Layout**: Pan/Zoom to show canvas capabilities.
