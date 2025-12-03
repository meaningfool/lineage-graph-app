import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Error Display Feature", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("Scenario 1: No Errors [NEW]", async ({ page }) => {
        // 1. Import a clean CSV
        await page.getByRole("button", { name: "Import CSV" }).click();
        const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
        const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Map columns (standard mapping)
        await page.getByTestId("mapping-select-id-trigger").click();
        await page.getByRole("option", { name: "id", exact: true }).click();
        await page.getByTestId("mapping-select-title-trigger").click();
        await page.getByRole("option", { name: "title", exact: true }).click();
        await page.getByTestId("mapping-select-type-trigger").click();
        await page.getByRole("option", { name: "type", exact: true }).click();
        await page.getByTestId("mapping-select-source-trigger").click();
        await page.getByRole("option", { name: "source", exact: true }).click();
        await page.getByTestId("mapping-select-target-trigger").click();
        await page.getByRole("option", { name: "target", exact: true }).click();

        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page.getByTestId("dialog-close-button").click();

        // 2. Assertion: Error Toggle is NOT visible
        // We assume the toggle will have a test id "error-toggle"
        await expect(page.getByTestId("error-toggle")).toBeHidden();
    });

    test("Scenario 2: With Errors [NEW]", async ({ page }) => {
        // 1. Import CSV with errors
        await page.getByRole("button", { name: "Import CSV" }).click();
        const nodesPath = path.join(__dirname, "fixtures", "nodes_errors_display.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
        const edgesPath = path.join(__dirname, "fixtures", "edges_errors_display.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Map columns
        await page.getByTestId("mapping-select-id-trigger").click();
        await page.getByRole("option", { name: "id", exact: true }).click();
        await page.getByTestId("mapping-select-title-trigger").click();
        await page.getByRole("option", { name: "label", exact: true }).click();
        await page.getByTestId("mapping-select-type-trigger").click();
        await page.getByRole("option", { name: "type", exact: true }).click();
        await page.getByTestId("mapping-select-source-trigger").click();
        await page.getByRole("option", { name: "source", exact: true }).click();
        await page.getByTestId("mapping-select-target-trigger").click();
        await page.getByRole("option", { name: "target", exact: true }).click();

        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page.getByTestId("dialog-close-button").click();

        // 2. Assertion: Error Toggle is visible
        const toggle = page.getByTestId("error-toggle");
        await expect(toggle).toBeVisible();

        // 3. Assertion: Badge displays correct count
        // node2: Missing type -> Error
        // node5: INVALID_TYPE -> Error
        // edge3: Self cycle -> Error
        // edge5: Cycle -> (Note: Cycle might be reported on one edge or node, total is 3)
        // Total is 3.
        await expect(toggle).toContainText("3");
    });
});
