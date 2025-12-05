# Spec Analysis Report

## 1. Overview
I analyzed spec files from three distinct eras of the project to identify patterns and evolution:
*   **Early**: `02-csv-import` (TDD-focused, Phase-based)
*   **Recent**: `06-graph-layout` (Algorithm-heavy, Data-driven)
*   **Current**: `08-error-display` (UI-focused, Stabilization-aware)

## 2. Common Patterns (`task.md`)
*   **Structure**: Always a checklist grouped by "Phases" or "Slices".
*   **Content**: Tracks "Spec Creation", "Implementation", and "Verification" tasks.
*   **Evolution**: Shifted from broad "Phases" (e.g., "Basic Upload") to granular "Vertical Slices" (e.g., "Slice 1: Error Toggle").

## 3. Common Patterns (Implementation Plans)
All plans share a core structure, though naming varies:
1.  **Goal**: Brief summary of the objective.
2.  **Requirements/Principles**: Detailed functional or algorithmic rules.
3.  **Test Scenarios**: The heart of the spec.
    *   *CSV Import*: Defined "TDD Cycles" (Red/Green).
    *   *Graph Layout*: Defined "Test Cases" with specific CSV data and assertions.
    *   *Error Display*: Defined "Scenarios" with Setup/Action/Assertion.
4.  **Implementation**: Technical details (Components, State, Functions).
5.  **Verification**: Automated vs. Manual checks.

## 4. Key Specificities & Evolution
*   **Impact Analysis**: `08-error-display` introduced a dedicated **"Existing Tests Impact"** section per slice. This is a critical improvement that aligns with the new `README.md` policy.
*   **Data-Driven**: `06-graph-layout` explicitly lists CSV fixture content. This is excellent for complex logic but maybe overkill for simple UI.
*   **Vertical Slicing**: The most recent specs (`08`) are strictly organized by "Slice" (Goal -> Changes -> Tests -> Impact), whereas older ones (`02`) separated "Test Structure" from "Cycles".

## 5. Recommendations for Template
Based on this, I propose a **`specs/TEMPLATE.md`** with the following sections:

1.  **Metadata**: Feature Name, Slice Number/ID.
2.  **Goal**: One-line summary.
3.  **Impact Analysis (New Standard)**:
    *   **Shared Components**: List components being modified (e.g., `LineageGraph`).
    *   **Affected Tests**: List existing specs that might break.
4.  **Vertical Slices** (Repeatable Block):
    *   **Goal**: What user value does this slice add?
    *   **Test Scenarios**:
        *   **New Tests**: Setup -> Action -> Assertion.
        *   **Existing Test Updates**: Specific changes required.
    *   **Implementation**: Component/Logic details.
5.  **Verification**: Checklist for E2E + Visual checks.

Shall I proceed with creating this template?
