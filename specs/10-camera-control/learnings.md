# Learnings: Camera Control & Stabilization

## Architecture
*   **Decouple UI from Domain with View Models**: We caused a frontend crash by passing "Rich Error Objects" (Domain) directly to the UI components (which expected strings).
    *   **Insight**: The Adapter layer (`reactflow-mapper`) should act as a View Model Factory, transforming internal structures into strict UI props (e.g., `tooltipText: string`) rather than passing raw objects. This ensures domain changes break the build (compile time) rather than the app (runtime).

## Process & Tooling
*   **Linting on Legacy Code**: Adding strict pre-commit hooks (`lint-staged` + `biome check`) to a codebase with existing debt (e.g., `any` types) creates a "Yak Shaving" loop that blocks feature delivery.
    *   **Insight**: Introduce strictness incrementally or use `overrides` in `biome.json` for legacy files. Do not block the commit pipeline for pre-existing issues.
*   **Workflows over Checklists**: Documentation in `README.md` requires high cognitive load to follow manually.
    *   **Insight**: Migration of critical protocols (like "Close Branch") into executable workflows (`.agent/workflows/close-branch.md`) ensures compliance (regression testing, cleanup) and reduces friction.

## Refactoring Risks
*   **Blind Auto-Fixes**: Using automated tools to "Remove Unused Variables" triggered a regression in `node-details-panel.tsx` where a variable was removed (causing a build error) because the linter deemed it unused in the visible scope.
    *   **Insight**: Always run the build/compiler check (`tsc --noEmit`) immediately after applying bulk lint fixes.
