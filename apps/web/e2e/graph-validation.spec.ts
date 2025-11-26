import { expect, test } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.describe("Graph Validation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
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

    test("should validate Output node rules (Slice 2.2)", async ({ page }) => {
        // 1. Navigate to the app
        await page.goto("http://localhost:3001");

        // 2. Open Import Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 3. Upload Files
        const nodesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/nodes_output_validation.csv"));
        const edgesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/edges_output_validation.csv"));

        const nodesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "nodes_output_validation.csv", { type: "text/csv" });
            dt.items.add(file);
            return dt;
        }, nodesBuffer.toString());

        const edgesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "edges_output_validation.csv", { type: "text/csv" });
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
        const validNode = page.locator(".react-flow__node").filter({ hasText: "Valid Output" }).locator("div").first();
        await expect(validNode).not.toHaveClass(/border-red-500/);

        // 6. Verify Invalid Nodes (B, C, D)
        const invalidNodes = [
            "Invalid Source Output",
            "Invalid PassThrough Output",
            "Invalid Orphan Output"
        ];

        for (const label of invalidNodes) {
            const node = page.locator(".react-flow__node").filter({ hasText: label }).locator("div").first();

            // Verify Red Border
            await expect(node).toHaveClass(/border-red-500/);

            // Verify Tooltip
            await node.hover();
            await expect(page.getByText("Output node must have at least one incoming connection and no outgoing connections")).toBeVisible();
        }

        // 7. Capture Visual Proof
        await page.screenshot({ path: 'output-validation-verified.png' });
    });

    test("should validate Step node rules (Slice 2.3)", async ({ page }) => {
        // 1. Navigate to the app
        await page.goto("http://localhost:3001");

        // 2. Open Import Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 3. Upload Files
        const nodesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/nodes_step_validation.csv"));
        const edgesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/edges_step_validation.csv"));

        const nodesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "nodes_step_validation.csv", { type: "text/csv" });
            dt.items.add(file);
            return dt;
        }, nodesBuffer.toString());

        const edgesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "edges_step_validation.csv", { type: "text/csv" });
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
        const validNode = page.locator(".react-flow__node").filter({ hasText: "Valid Step" }).locator("div").first();
        await expect(validNode).not.toHaveClass(/border-red-500/);

        // 6. Verify Invalid Nodes (B, C, D)
        const invalidNodes = [
            "Invalid Source Step",
            "Invalid Sink Step",
            "Invalid Orphan Step"
        ];

        for (const label of invalidNodes) {
            const node = page.locator(".react-flow__node").filter({ hasText: label }).locator("div").first();

            // Verify Red Border
            await expect(node).toHaveClass(/border-red-500/);

            // Verify Tooltip
            await node.hover();
            await expect(page.getByText("Step node must have at least one incoming connection and at least one outgoing connection")).toBeVisible();
        }

        // 7. Capture Visual Proof
        await page.screenshot({ path: 'step-validation-verified.png' });
    });
});
