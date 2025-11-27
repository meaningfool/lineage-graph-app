import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Test File Upload - Hypothesis Validation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("should upload file with useFsAccessApi: false", async ({ page }) => {
        // 1. Wait for and click test button using role
        const testButton = page.getByRole("button", { name: "Test File Upload" });
        await expect(testButton).toBeVisible({ timeout: 10000 });
        await testButton.click();

        // 2. Wait for dialog to be visible
        await expect(page.getByRole("dialog")).toBeVisible();

        // 3. Wait for dropzone text to appear
        await expect(page.getByText("Drop CSV here")).toBeVisible();

        // 4. Upload file - find input within the dialog
        const filePath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);

        // 5. Verify file was uploaded by checking filename appears
        await expect(page.getByText("nodes_valid_basic.csv")).toBeVisible();
    });
});
