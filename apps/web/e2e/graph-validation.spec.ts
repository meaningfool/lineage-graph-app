import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Graph Validation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("should highlight orphan nodes with error state", async ({ page }) => {
        // 1. Open Import Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 2. Upload Files
        const nodesPath = path.join(__dirname, "fixtures", "nodes_orphan.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);

        const edgesPath = path.join(__dirname, "fixtures", "edges_orphan.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);

        // 3. Proceed to Mapping
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // 4. Map Columns
        await page.getByTestId("mapping-select-id").selectOption({ label: "id" });
        await page.getByTestId("mapping-select-title").selectOption({ label: "title" });
        await page.getByTestId("mapping-select-type").selectOption({ label: "type" });
        await page.getByTestId("mapping-select-source").selectOption({ label: "source" });
        await page.getByTestId("mapping-select-target").selectOption({ label: "target" });

        // 5. Import
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Close success modal
        await page.getByTestId("import-close-button").click();

        // 6. Verify Graph Rendering
        // Expect 3 nodes
        await expect(page.locator(".react-flow__node")).toHaveCount(3);

        // 7. Verify Orphan Node (C) has error style
        // We expect a red border class. 
        // Note: We haven't implemented this yet, so this should fail.
        const orphanNode = page.locator(".react-flow__node").filter({ hasText: "Orphan Node" });
        await expect(orphanNode).toBeVisible();

        // Check for the red border class (assuming Tailwind 'border-red-500')
        // We might need to check the inner div if the class is applied there.
        // Based on CustomNode implementation, the class is on the main div.
        // We'll check if the element OR its child has the class.
        // For now, let's assume we'll add it to the CustomNode's main div.
        // The ReactFlow node wrapper might obscure it, so we look for the content div.
        // The CustomNode renders: <div className="min-w-[150px] ...">
        // We will target that div.
        const nodeContent = orphanNode.locator("div").first();
        await expect(nodeContent).toHaveClass(/border-red-500/);

        // 8. Verify Tooltip (Phase 2)
        // We implemented a simple 'title' attribute.
        await expect(nodeContent).toHaveAttribute("title", "Orphan node: No connections found");

        // 9. Verify Connected Nodes (A, B) do NOT have error style
        const inputNode = page.locator(".react-flow__node").filter({ hasText: "Input Node" }).locator("div").first();
        await expect(inputNode).not.toHaveClass(/border-red-500/);
        await expect(inputNode).not.toHaveAttribute("title");
    });
});
