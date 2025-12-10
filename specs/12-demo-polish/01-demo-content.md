# Spec: Demo Content

## Goal
Prepare the assets required for a high-quality video demo and launch.

## To-Do List
- [ ] **Create Demo Fixture (`demo_showcase.csv`)**
    - [ ] **Domain**: Real-world logic. No "Lorem Ipsum" or generic names (Node 1, Node 2).
        - **Option A (Financial)**: Trade Data -> Risk Models -> Regulatory Reports.
        - **Option B (Chemical)**: Raw Ingredients -> Compounding -> Quality Tests -> Final Product.
    - [ ] **Scale**: ~20-30 nodes. 3+ layers of depth.
    - [ ] **Features to Trigger**:
        - **Cycle**: A 3-node loop hidden in the middle layers.
        - **Orphan**: A "Step" node missing its input (showing data gap).
        - **Properties**: Rich metadata (Values, Owners, Timestamps) to pop in the Details Panel.
- [ ] **Record Video** (~60s)
    - [ ] Follow the "Happy Path with Error Discovery" script.
- [ ] **Write Content**
    - [ ] Blog Post (Technical deep dive).
    - [ ] Social Media (Twitter/LinkedIn hooks).

## Video Scenario (Script)
| Time | Action | Visual | Note |
| :--- | :--- | :--- | :--- |
| 0:00 | **Intro** | Clean Canvas | |
| 0:05 | **Import** | Drag & Drop `demo_showcase.csv` | Show speed. |
| 0:10 | **Mapping** | Config Modal | Show Column Mapping. |
| 0:15 | **Visualization** | Graph renders | |
| 0:25 | **Discovery** | Notice "Red Badge" / Error Panel | "Oh, there's an error." |
| 0:30 | **Debug** | Click Error -> Find Node | Reveal the Cycle or Orphan. |
| 0:40 | **Isolation** | Right-click -> "Focus Subtree" | Filters the noise. |
| 0:50 | **Close** | Zoom out | |

## Fixture Strategy
We need to generate this data.
*   **Challenge**: Needs to look consistent (e.g., if Node A outputs "Risk_Score_v1", Node B should input "Risk_Score_v1").
*   **Approach**: Decide between manual crafting vs. generation script.
