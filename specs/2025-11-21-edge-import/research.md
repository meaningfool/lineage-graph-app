# Research Log: Edge Import

## Findings
*   **Legacy CSVs**: `legacy_assets/test-files/valid/valid-basic-edges.csv` only contains `source` and `target` columns. No `label`.
*   **Current Data**: `apps/web/src/data/target-lineage.json` defines edges with `id`, `source`, and `target`. No `label` property.
*   **Conclusion**: We should **drop the `label` column requirement** from the spec to match legacy behavior and current data structure.

## Open Questions
- [ ] How to handle referential integrity (edges pointing to missing nodes)?
- [ ] Should we support multi-file upload or sequential upload?
