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

    test("should detect self-cycles (Slice 3.1)", async ({ page }) => {
        // 1. Navigate to the app
        await page.goto("http://localhost:3001");

        // 2. Open Import Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 3. Upload Files
        const nodesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/nodes_self_cycle.csv"));
        const edgesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/edges_self_cycle.csv"));

        const nodesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "nodes_self_cycle.csv", { type: "text/csv" });
            dt.items.add(file);
            return dt;
        }, nodesBuffer.toString());

        const edgesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "edges_self_cycle.csv", { type: "text/csv" });
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

        // 5. Verify Self-Cycle Edge (B -> B)
        // We expect the edge B->B to have a red stroke.
        // ReactFlow edges are SVGs. We need to find the path element.
        // The edge ID is usually generated or can be inferred.
        // Since we have specific source/target, we can look for the edge with aria-label or specific class if available.
        // Alternatively, we can check ALL edges and see if ONE has the red stroke.

        // Pipe browser logs to console
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // Wait for graph to render (expect 3 edges)
        await expect(page.locator(".react-flow__edge")).toHaveCount(3, { timeout: 10000 });

        // Find the edge path with red stroke
        // Note: The stroke color might be computed or inline style.
        // Our implementation plan says we'll apply style={{ stroke: "#ef4444" }}
        const redEdge = page.locator('.react-flow__edge path[style*="stroke: rgb(239, 68, 68)"]'); // #ef4444 in rgb

        // We might need to be more flexible with the selector if ReactFlow handles styles differently.
        // Let's try checking for the style attribute directly.
        // Or check if any edge path has the color.

        // Let's assume we'll set the style prop on the edge object, which ReactFlow renders on the path.
        // We'll look for a path with the specific stroke color.

        // Using a more robust locator strategy:
        const edges = page.locator(".react-flow__edge");
        await expect(edges).toHaveCount(3); // A->B, B->B, B->Out

        // One edge should be red
        const redEdges = page.locator('.react-flow__edge path').filter({ hasNotText: "" }); // Filter to ensure we have elements
        // Actually, let's just evaluate the stroke color of the paths.

        const hasRedEdge = await page.evaluate(() => {
            const paths = document.querySelectorAll('.react-flow__edge path');
            return Array.from(paths).some(path => {
                const style = window.getComputedStyle(path);
                return style.stroke === 'rgb(239, 68, 68)' || path.getAttribute('style')?.includes('#ef4444');
            });
        });

        expect(hasRedEdge).toBe(true);

        // 6. Capture Visual Proof
        await page.screenshot({ path: 'self-cycle-verified.png' });
    });

    test("should detect multi-node cycles (Slice 3.2)", async ({ page }) => {
        // 1. Navigate to the app
        await page.goto("http://localhost:3001");

        // 2. Open Import Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 3. Upload Files
        const nodesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/nodes_cycle.csv"));
        const edgesBuffer = fs.readFileSync(path.join(__dirname, "fixtures/edges_cycle.csv"));

        const nodesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "nodes_cycle.csv", { type: "text/csv" });
            dt.items.add(file);
            return dt;
        }, nodesBuffer.toString());

        const edgesDataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], "edges_cycle.csv", { type: "text/csv" });
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

        // 5. Verify Multi-Node Cycle Edges (A->B, B->C, C->A)
        // All edges in the cycle should be red.

        // Wait for graph to render
        await expect(page.locator(".react-flow__edge")).toHaveCount(3, { timeout: 10000 });

        // Check if edges are red
        const hasRedEdges = await page.evaluate(() => {
            const paths = document.querySelectorAll('.react-flow__edge path');
            // We expect ALL 3 edges to be red
            const redPaths = Array.from(paths).filter(path => {
                const style = window.getComputedStyle(path);
                return style.stroke === 'rgb(239, 68, 68)' || path.getAttribute('style')?.includes('#ef4444');
            });
            return redPaths.length === 3;
        });

        expect(hasRedEdges).toBe(true);

        // 6. Capture Visual Proof
        await page.screenshot({ path: 'multi-node-cycle-verified.png' });
    });
});
