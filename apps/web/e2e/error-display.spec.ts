import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Error Display Feature", () => {
    test.describe.configure({ mode: 'serial' });

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

    test("Scenario 5: List Accuracy [NEW]", async ({ page }) => {
        // 1. Setup: Import and Open Panel
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

        // 2. Assertion: Check for specific error content
        // Note: Nodes with invalid types (node2, node5) are DROPPED by the importer, so they don't appear in the graph.
        // The errors we see are structural (cycles, connectivity) on the remaining nodes/edges.

        // node1 has incoming edge (from cycle), which is invalid for INPUT
        await expect(panel).toContainText("Node 1");



        // Note: Edge IDs are no longer displayed in the compact UI, so we don't assert them.
        // We rely on the message content (which is checked in graph-validation.spec.ts).
    });

    test("Scenario 6: Multiple Errors [NEW]", async ({ page }) => {
        // This scenario is implicitly covered by Scenario 5 since we have multiple errors.
        // But let's verify we have a list of items.

        // 1. Setup: Open Panel
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

        // 2. Assertion: Check number of error items
        // We expect 3 items (as per previous slice findings)
        const items = page.getByTestId("error-item");
        await expect(items).toHaveCount(3);
    });
});
