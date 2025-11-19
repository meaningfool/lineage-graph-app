# Legacy CSV Test Files

This directory contains 18 CSV files used for testing the CSV Import feature. They are categorized by their purpose.

## 📂 `valid/` (Happy Path)
Use these files to test standard, successful import scenarios.

| Filename | Purpose |
| :--- | :--- |
| `valid-basic-nodes.csv` | **Standard Smoke Test.** Simple, valid nodes. Use this first. |
| `valid-basic-edges.csv` | Companion edges for the basic nodes. |
| `valid-custom-columns-nodes.csv` | **Mapping Test.** Columns have different names (e.g., "Node Name" instead of "title"). Use to test column mapping logic. |
| `valid-case-insensitive-nodes.csv` | **Normalization Test.** Tests if "Input", "INPUT", and "input" are treated identically. |

## 📂 `errors/` (Validation Testing)
Use these files to test if your validation logic correctly catches errors.

| Filename | Purpose |
| :--- | :--- |
| `error-missing-id-nodes.csv` | **Required Field Test.** Rows missing the mandatory `id` column. |
| `error-duplicate-ids-nodes.csv` | **Uniqueness Test.** Contains multiple nodes with the same ID. |
| `error-orphaned-edges.csv` | **Integrity Test.** Edges that refer to source/target nodes that don't exist. |
| `error-empty.csv` | **Empty File Test.** A completely empty file. |
| `error-malformed.csv` | **Parsing Test.** Invalid CSV format (e.g., unclosed quotes). |
| `error-multiple-issues-nodes.csv` | **Stress Test.** Contains missing IDs, duplicates, and invalid types all in one file. |
