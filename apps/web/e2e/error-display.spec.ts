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

    test("Scenario 3: Opening the Panel [NEW]", async ({ page }) => {
        // 1. Import CSV with errors (reuse setup from Scenario 2 logic, or just do it again)
        // For speed, we'll just replicate the import steps or extract them if we were refactoring, 
        // but for now copy-paste is safer to avoid breaking previous tests.
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

        // 2. Action: Click Error Toggle
        await page.getByTestId("error-toggle").click();

        // 3. Assertion: Error Panel is visible
        const panel = page.getByTestId("error-list-panel");
        await expect(panel).toBeVisible();

        // Check it's on the left (optional, but good for layout verification)
        // We can check if it has a class or style, or just trust visibility for now.
    });

    test("Scenario 4: Closing the Panel [NEW]", async ({ page }) => {
        // 1. Setup: Open panel (same steps as above)
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

        await page.getByTestId("error-toggle").click();
        const panel = page.getByTestId("error-list-panel");
        await expect(panel).toBeVisible();

        // 2. Action: Click Close button
        await page.getByTestId("error-panel-close").click();

        // 3. Assertion: Error Panel is NOT visible
        await expect(panel).not.toBeVisible();
    });
});
