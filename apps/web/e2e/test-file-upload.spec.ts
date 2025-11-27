import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Test File Upload - Hypothesis Validation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("should upload file with useFsAccessApi: false", async ({ page }) => {
        // 1. Wait for and click test button
        const testButton = page.getByTestId("test-file-upload-button");
        await expect(testButton).toBeVisible({ timeout: 10000 });
        await testButton.click();

        // 2. Wait for dialog to be visible
        await expect(page.getByRole("dialog")).toBeVisible();

        // 3. Wait for dropzone to be visible
        await expect(page.getByTestId("test-dropzone")).toBeVisible();

        // 4. Upload file using data-testid pattern
        const filePath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
        await page.getByTestId("test-dropzone").locator('input[type="file"]').setInputFiles(filePath);

        // 5. Verify file was uploaded
        await expect(page.getByTestId("uploaded-filename")).toHaveText("nodes_valid_basic.csv");
    });
});
