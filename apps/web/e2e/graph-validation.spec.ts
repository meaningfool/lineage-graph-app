import { expect, test } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

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
        // We implemented a custom tooltip div that appears on hover.
        // We hover the node content div.
        await nodeContent.hover();

        // Expect the tooltip text to be visible
        await expect(page.getByText("Orphan node: No connections found")).toBeVisible();

        // Capture screenshot for verification
        await page.screenshot({ path: 'orphan-tooltip-verified.png' });

        // 9. Verify Connected Nodes (A, B) do NOT have error style
        const inputNode = page.locator(".react-flow__node").filter({ hasText: "Input Node" }).locator("div").first();
        await expect(inputNode).not.toHaveClass(/border-red-500/);
        // Ensure tooltip is NOT visible for valid node
        await inputNode.hover();
        await expect(page.getByText("Orphan node: No connections found")).not.toBeVisible();
    });

    test("should validate Input node rules (Slice 2.1)", async ({ page }) => {
        // 1. Navigate to the app
        await page.goto("http://localhost:3001");

        // 2. Open Import Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 3. Upload Files
        const nodesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/nodes_input_validation.csv"));
        const edgesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/edges_input_validation.csv"));

        const nodesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "nodes_input_validation.csv", { type: "text/csv" });
            dt.items.add(file);
            return dt;
        }, nodesBuffer.toString());

        const edgesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "edges_input_validation.csv", { type: "text/csv" });
            dt.items.add(file);
            return dt;
        }, edgesBuffer.toString());

        await page.dispatchEvent('[data-testid="dropzone-nodes"] input', "drop", { dataTransfer: nodesDataTransfer });
        await page.dispatchEvent('[data-testid="dropzone-edges"] input', "drop", { dataTransfer: edgesDataTransfer });

        // 4. Proceed through wizard
        await page.getByRole("button", { name: "Next" }).click();

        // Map Columns
        await page.getByTestId("mapping-select-id").selectOption({ label: "id" });
        await page.getByTestId("mapping-select-title").selectOption({ label: "title" });
        await page.getByTestId("mapping-select-type").selectOption({ label: "type" });
        await page.getByTestId("mapping-select-source").selectOption({ label: "source" });
        await page.getByTestId("mapping-select-target").selectOption({ label: "target" });

        await page.getByRole("button", { name: "Next" }).click();
        await page.getByRole("button", { name: "Close" }).click();

        // 5. Verify Valid Node (A)
        const validNode = page.locator(".react-flow__node").filter({ hasText: "Valid Input" }).locator("div").first();
        await expect(validNode).not.toHaveClass(/border-red-500/);

        // 6. Verify Invalid Nodes (B, C, D)
        const invalidNodes = [
            "Invalid Sink Input",
            "Invalid PassThrough Input",
            "Invalid Orphan Input"
        ];

        for (const label of invalidNodes) {
            const node = page.locator(".react-flow__node").filter({ hasText: label }).locator("div").first();

            // Verify Red Border
            await expect(node).toHaveClass(/border-red-500/);

            // Verify Tooltip
            await node.hover();
            await expect(page.getByText("Input node must have at least one outgoing connection and no incoming connections")).toBeVisible();
        }

        // 7. Capture Visual Proof
        await page.screenshot({ path: 'input-validation-verified.png' });
    });
});
