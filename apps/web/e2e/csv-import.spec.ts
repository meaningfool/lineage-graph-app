import { expect, test } from "@playwright/test";
import path from "path";

test.describe("CSV Import - Simple Nodes", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("should upload a CSV and display nodes", async ({ page }) => {
        // 1. Check initial state (default graph or empty)
        // For now, we assume the default graph is loaded, but we want to replace it.

        // 2. Click "Import CSV" button
        const importButton = page.getByRole("button", { name: "Import CSV" });
        await expect(importButton).toBeVisible();
        await importButton.click();

        // 3. Verify Modal is open
        const modal = page.getByRole("dialog");
        await expect(modal).toBeVisible();
        await expect(modal).toContainText("Upload CSV");

        // 4. Upload File
        // FIXTURE STRATEGY:
        // We use an external fixture file (`apps/web/e2e/fixtures/basic-nodes.csv`) for this test.
        // - Reason: Allows manual verification with the exact same file used in automation.
        // - Content: A simple CSV with `id` and `title` columns and two rows.
        // - Maintenance: If you change this test's expectations, you MUST update the fixture file.
        const fixturePath = path.join(__dirname, "fixtures", "basic-nodes.csv");

        // Find the file input and upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(fixturePath);

        // 5. Verify Graph Update
        // The modal should close or we might need to click "Import".
        // Assuming auto-import on drop for this simple phase, or a confirm button.
        // Let's assume there's an "Import" button in the modal to confirm.
        const confirmButton = modal.getByRole("button", { name: "Import" });
        if (await confirmButton.isVisible()) {
            await confirmButton.click();
        }

        // 6. Check for new nodes
        await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
        await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();
    });
});
