import { expect, test } from "@playwright/test";
import path from "path";

test.describe("CSV Import", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    // ========== HAPPY PATH ==========
    test.describe("Valid Files", () => {
        test("should upload a valid CSV and display nodes", async ({ page }) => {
            // 1. Click "Import CSV" button
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await expect(importButton).toBeVisible();
            await importButton.click();

            // 2. Verify Modal is open
            const modal = page.getByRole("dialog");
            await expect(modal).toBeVisible();
            await expect(modal).toContainText("Upload CSV");

            // 3. Upload File
            // FIXTURE STRATEGY:
            // We use an external fixture file (`apps/web/e2e/fixtures/basic-nodes.csv`) for this test.
            // - Reason: Allows manual verification with the exact same file used in automation.
            // - Content: A simple CSV with `id`, `title`, and `type` columns and two rows.
            // - Maintenance: If you change this test's expectations, you MUST update the fixture file.
            const fixturePath = path.join(__dirname, "fixtures", "basic-nodes.csv");

            // Find the file input and upload
            const fileInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // Click Import button (now required)
            const importAction = page.getByRole("button", { name: "Import", exact: true });
            await expect(importAction).toBeEnabled();
            await importAction.click();

            // 4. Verify we're now in the results step
            await expect(modal).toContainText("Import successful");

            // 5. Click Close button to dismiss modal
            const closeButton = page.getByTestId("import-close-button");
            await expect(closeButton).toBeVisible();
            await closeButton.click();

            // 7. Modal should close
            await expect(modal).not.toBeVisible();

            // 8. Check for new nodes on graph
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();
        });

        test("should have disabled import button initially", async ({ page }) => {
            // 1. Click "Import CSV" button
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await importButton.click();

            const modal = page.getByRole("dialog");
            await expect(modal).toBeVisible();

            // 2. Verify Import button is disabled
            const importAction = page.getByRole("button", { name: "Import", exact: true });
            await expect(importAction).toBeDisabled();

            // 3. Upload Nodes file
            const fixturePath = path.join(__dirname, "fixtures", "basic-nodes.csv");
            const fileInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // 4. Verify Import button is enabled
            await expect(importAction).toBeEnabled();
        });
    });

    test("should allow uploading an edges file along with nodes", async ({ page }) => {
        // 1. Click "Import CSV" button
        const importButton = page.getByRole("button", { name: "Import CSV" });
        await importButton.click();

        // 2. Upload Nodes file
        const nodesPath = path.join(__dirname, "fixtures", "basic-nodes.csv");
        const nodesInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
        await nodesInput.setInputFiles(nodesPath);

        // 3. Upload Edges file (using a valid edges file)
        // We need a fixture for edges. I'll check if one exists or use a dummy one.
        // Assuming 'valid-basic-edges.csv' exists in legacy or I need to create one.
        // For now, I'll use the legacy one if I can copy it, or just create a simple one on the fly?
        // Playwright can't create files easily on the fly without fs.
        // I'll use a known existing file or create a fixture file first.
        // Let's assume I need to create 'basic-edges.csv' fixture.
        const edgesPath = path.join(__dirname, "fixtures", "basic-edges.csv");
        const edgesInput = page.getByTestId("dropzone-edges").locator('input[type="file"]');
        await edgesInput.setInputFiles(edgesPath);

        // 4. Click Import
        const importAction = page.getByRole("button", { name: "Import", exact: true });
        await expect(importAction).toBeEnabled();
        await importAction.click();

        // 5. Verify Nodes are displayed
        await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
        await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();

        // 6. Verify Edges are displayed
        await expect(page.locator(".react-flow__edge")).toHaveCount(1);
    });

    test("should reject edges pointing to missing nodes", async ({ page }) => {
        // 1. Click "Import CSV" button
        const importButton = page.getByRole("button", { name: "Import CSV" });
        await importButton.click();

        // 2. Upload Valid Nodes
        const nodesPath = path.join(__dirname, "fixtures", "basic-nodes.csv");
        const nodesInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
        await nodesInput.setInputFiles(nodesPath);

        // 3. Upload Invalid Edges
        const edgesPath = path.join(__dirname, "fixtures", "error-missing-node-edge.csv");
        const edgesInput = page.getByTestId("dropzone-edges").locator('input[type="file"]');
        await edgesInput.setInputFiles(edgesPath);

        // 4. Click Import
        const importAction = page.getByRole("button", { name: "Import", exact: true });
        await importAction.click();

        // 5. Verify Warning
        const modal = page.getByRole("dialog");
        await expect(modal).toContainText("Edge dropped: Source 'missing-id' not found");
    });

    test("should reject edges pointing to missing target node", async ({ page }) => {
        // 1. Click "Import CSV" button
        const importButton = page.getByRole("button", { name: "Import CSV" });
        await importButton.click();

        // 2. Upload Valid Nodes
        const nodesPath = path.join(__dirname, "fixtures", "basic-nodes.csv");
        const nodesInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
        await nodesInput.setInputFiles(nodesPath);

        // 3. Upload Invalid Edges (Missing Target)
        const edgesPath = path.join(__dirname, "fixtures", "error-missing-target-edge.csv");
        const edgesInput = page.getByTestId("dropzone-edges").locator('input[type="file"]');
        await edgesInput.setInputFiles(edgesPath);

        // 4. Click Import
        const importAction = page.getByRole("button", { name: "Import", exact: true });
        await importAction.click();

        // 5. Verify Warning
        const modal = page.getByRole("dialog");
        await expect(modal).toContainText("Edge dropped: Target 'missing-target-id' not found");
    });

    test("should reject edges pointing to nodes dropped due to validation errors", async ({ page }) => {
        // 1. Click "Import CSV" button
        const importButton = page.getByRole("button", { name: "Import CSV" });
        await importButton.click();

        // 2. Upload Nodes with one invalid type
        // error-invalid-type.csv contains: node-1 (valid), node-2 (invalid type)
        const nodesPath = path.join(__dirname, "fixtures", "error-invalid-type.csv");
        const nodesInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
        await nodesInput.setInputFiles(nodesPath);

        // 3. Upload Edges pointing to the invalid node
        // error-edge-to-dropped-node.csv contains: edge-1 (node-1 -> node-2)
        const edgesPath = path.join(__dirname, "fixtures", "error-edge-to-dropped-node.csv");
        const edgesInput = page.getByTestId("dropzone-edges").locator('input[type="file"]');
        await edgesInput.setInputFiles(edgesPath);

        // 4. Click Import
        const importAction = page.getByRole("button", { name: "Import", exact: true });
        await importAction.click();

        // 5. Verify Warnings
        const modal = page.getByRole("dialog");
        // Verify node dropped warning
        await expect(modal).toContainText("1 node dropped");
        await expect(modal).toContainText("node-2: Invalid type");

        // Verify edge dropped warning (Cascading validation)
        await expect(modal).toContainText("1 edge dropped");
        await expect(modal).toContainText("Edge dropped: Target 'node-2' not found");
    });


    // ========== FILE-LEVEL ERRORS (BLOCKING) ==========
    test.describe("File-Level Validation", () => {
        test("should reject file with missing required columns", async ({ page }) => {
            // 1. Click "Import CSV" button
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await importButton.click();

            const modal = page.getByRole("dialog");
            await expect(modal).toBeVisible();

            // 2. Upload file missing 'type' column
            const fixturePath = path.join(__dirname, "fixtures", "error-missing-type.csv");
            const fileInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // Click Import button
            const importAction = page.getByRole("button", { name: "Import", exact: true });
            await importAction.click();

            // 3. Expect to transition to results step with error
            await expect(modal).toContainText("Missing required columns in nodes file: type");

            // 4. Verify Close button is present
            const closeButton = page.getByTestId("import-close-button");
            await expect(closeButton).toBeVisible();

            // 5. Close modal
            await closeButton.click();
            await expect(modal).not.toBeVisible();

            // 6. Verify no nodes were imported
            await expect(page.locator(".react-flow__node")).toHaveCount(0);
        });

        test("should clear error message when modal is closed and reopened", async ({ page }) => {
            // 1. Upload invalid file to trigger error
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await importButton.click();

            const modal = page.getByRole("dialog");
            const fixturePath = path.join(__dirname, "fixtures", "error-missing-type.csv");
            const fileInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // Click Import button
            const importAction = page.getByRole("button", { name: "Import", exact: true });
            await importAction.click();

            // 2. Verify error is shown in results step
            await expect(modal).toContainText("Missing required columns in nodes file: type");

            // 3. Close the modal using Close button
            const closeButton = page.getByTestId("import-close-button");
            await closeButton.click();
            await expect(modal).not.toBeVisible();

            // 4. Reopen the modal
            await importButton.click();
            await expect(modal).toBeVisible();

            // 5. Verify error message is gone
            await expect(modal).not.toContainText("Missing required columns");
        });
    });

    // ========== ROW-LEVEL ERRORS (NON-BLOCKING) ==========
    test.describe("Row-Level Validation", () => {
        test("should drop rows with invalid node types and show summary", async ({ page }) => {
            // 1. Click "Import CSV" button
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await importButton.click();

            const modal = page.getByRole("dialog");
            await expect(modal).toBeVisible();

            // 2. Upload file with one valid and one invalid node
            const fixturePath = path.join(__dirname, "fixtures", "error-invalid-type.csv");
            const fileInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // Click Import button
            const importAction = page.getByRole("button", { name: "Import", exact: true });
            await importAction.click();

            // 3. Expect import to succeed with partial data
            // Modal should transition to results step showing warnings
            await expect(modal).toContainText("1 node dropped");
            await expect(modal).toContainText("node-2: Invalid type");

            // 4. Close modal using Close button
            const closeButton = page.getByTestId("import-close-button");
            await expect(closeButton).toBeVisible();
            await closeButton.click();
            await expect(modal).not.toBeVisible();

            // 5. Verify only the valid node was imported
            await expect(page.locator(".react-flow__node")).toHaveCount(1);
            await expect(page.locator(".react-flow__node").filter({ hasText: "Valid Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Invalid Node" })).not.toBeVisible();
        });

        test("should deduplicate rows with duplicate IDs and show warning", async ({ page }) => {
            // 1. Ensure fresh page state
            await page.goto("/");
            await page.waitForLoadState("networkidle");

            // 2. Click "Import CSV" button
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await expect(importButton).toBeVisible();
            await importButton.click();

            // 3. Wait for modal to open
            const modal = page.getByRole("dialog");
            await expect(modal).toBeVisible();

            // 2. Upload file with duplicate IDs
            const fixturePath = path.join(__dirname, "fixtures", "error-duplicate-ids.csv");
            const fileInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // Click Import button
            const importAction = page.getByRole("button", { name: "Import", exact: true });
            await importAction.click();

            // 3. Expect import to succeed with deduplicated data
            // Modal should transition to results step showing warnings
            await expect(modal).toContainText("1 node dropped");
            await expect(modal).toContainText("node-1: Duplicate Node ID");

            // 4. Close modal using Close button
            const closeButton = page.getByTestId("import-close-button");
            await expect(closeButton).toBeVisible();
            await closeButton.click();
            await expect(modal).not.toBeVisible();

            // 5. Verify only 2 unique nodes were imported (first occurrence of each ID)
            await expect(page.locator(".react-flow__node")).toHaveCount(2);
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();
            // The duplicate "Duplicate Node" should not appear
            await expect(page.locator(".react-flow__node").filter({ hasText: "Duplicate Node" })).not.toBeVisible();
        });
    });
});
