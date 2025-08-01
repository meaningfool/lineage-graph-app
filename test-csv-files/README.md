# CSV Test Files

This directory contains test CSV files for manually testing the CSV import functionality.

## Test Cases

### 1-empty.csv
- **Purpose**: Test empty file detection
- **Expected Result**: Error message "File is empty"
- **Content**: Completely empty file

### 2-malformed-quotes.csv
- **Purpose**: Test malformed CSV with unclosed quotes
- **Expected Result**: Error message "Invalid CSV format"
- **Content**: CSV with unclosed quote that breaks parsing

### 3-valid-simple.csv
- **Purpose**: Test basic valid CSV
- **Expected Result**: Success message with "2 rows parsed"
- **Content**: Simple 2-column, 2-row CSV

### 4-inconsistent-columns.csv
- **Purpose**: Test CSV with inconsistent column counts
- **Expected Result**: Error message "Invalid CSV format"
- **Content**: Rows with different numbers of columns

### 5-valid-complex.csv
- **Purpose**: Test valid CSV with complex data
- **Expected Result**: Success message with "3 rows parsed"
- **Content**: CSV with quoted values, escaped quotes, and special characters

### 6-special-characters.csv
- **Purpose**: Test CSV with edge cases (commas, quotes, newlines in values)
- **Expected Result**: Success message with "3 rows parsed"
- **Content**: CSV with various special characters properly escaped

## How to Test

1. Start the development server: `pnpm dev`
2. Open http://localhost:3001
3. Click "Import CSV" button
4. Try uploading each test file
5. Observe the different validation messages and behaviors

## Expected Behaviors

- **Empty file**: Red error message "File is empty"
- **Malformed CSV**: Red error message "Invalid CSV format"
- **Valid CSV**: Green success message "File uploaded successfully" + row count
- **Processing**: Blue loading message "Processing file..." (may be brief)