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
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // 4. Verify Graph Update
            // The modal should close or we might need to click "Import".
            // Assuming auto-import on drop for this simple phase, or a confirm button.
            // Let's assume there's an "Import" button in the modal to confirm.
            const confirmButton = modal.getByRole("button", { name: "Import" });
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }

            // 5. Check for new nodes
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();
        });
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
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // 3. Expect error message
            await expect(modal).toContainText("Missing required columns: type");

            // 4. Verify no nodes were imported
            await expect(page.locator(".react-flow__node")).toHaveCount(0);
        });

        test("should clear error message when modal is closed and reopened", async ({ page }) => {
            // 1. Upload invalid file to trigger error
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await importButton.click();

            const modal = page.getByRole("dialog");
            const fixturePath = path.join(__dirname, "fixtures", "error-missing-type.csv");
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(fixturePath);

            // 2. Verify error is shown
            await expect(modal).toContainText("Missing required columns: type");

            // 3. Close the modal
            await page.keyboard.press("Escape");
            await expect(modal).not.toBeVisible();

            // 4. Reopen the modal
            await importButton.click();
            await expect(modal).toBeVisible();

            // 5. Verify error message is gone
            await expect(modal).not.toContainText("Missing required columns");
        });
    });
});
