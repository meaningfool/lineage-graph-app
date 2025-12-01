# Learnings: CSV Import Feature

- **E2E Test Data Strategy**: Use external fixture files for file-based features (CSV, JSON uploads) to enable manual verification by users and QA, even though it creates a "two-file problem" where tests and data must be kept in sync. Use inline data for small (<10 lines), test-specific cases where the test logic depends tightly on specific values and readability is paramount.
