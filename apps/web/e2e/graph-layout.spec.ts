import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";

test.describe("Graph Layout", () => {
    test.beforeEach(async ({ page }) => {
        // Capture browser console logs
        page.on("console", (msg) => {
            if (msg.type() === "error" || msg.text().includes("DEBUG")) {
                console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
            }
        });

        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    // Helper to import CSV files
    async function importCSV(page: Page, nodesFile: string, edgesFile: string) {
        // Open modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // Upload files
        const nodesPath = path.join(__dirname, "fixtures", nodesFile);
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);

        const edgesPath = path.join(__dirname, "fixtures", edgesFile);
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);

        // Click Next
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Map columns (standard column names)
        await page.getByTestId("mapping-select-id").selectOption({ label: "id" });
        await page.getByTestId("mapping-select-title").selectOption({ label: "title" });
        await page.getByTestId("mapping-select-type").selectOption({ label: "type" });
        await page.getByTestId("mapping-select-source").selectOption({ label: "source" });
        await page.getByTestId("mapping-select-target").selectOption({ label: "target" });

        // Click Next to import
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Close modal
        await page.getByTestId("dialog-close-button").click();

        // Wait for graph to render
        await page.waitForTimeout(500);
    }

    // Helper to get node by title
    function getNode(page: Page, title: string) {
        return page.locator(`.react-flow__node`).filter({ hasText: title });
    }

    // Helper to get node position
    async function getNodePosition(page: Page, title: string) {
        const node = getNode(page, title);
        const boundingBox = await node.boundingBox();
        if (!boundingBox) {
            throw new Error(`Node ${title} not found or has no bounding box`);
        }
        return { x: boundingBox.x, y: boundingBox.y };
    }

    // Helper to get data-layer attribute
    async function getNodeLayer(page: Page, title: string) {
        const nodeWrapper = getNode(page, title);
        // The data-layer attribute is on the inner custom node div, not the wrapper
        const innerNode = nodeWrapper.locator('[data-layer]');

        // Wait for the attribute to be present
        await expect(innerNode).toHaveAttribute("data-layer", /.*/);
        const layer = await innerNode.getAttribute("data-layer");
        return layer;
    }

    test.describe("Slice 1: Basic Flows (Valid Graphs)", () => {
        test("Chain Flow: Input → Step1 → Step2 → Output", async ({ page }) => {
            await importCSV(page, "graph_layout_chain_nodes.csv", "graph_layout_chain_edges.csv");

            // Verify all 4 nodes are visible
            await expect(getNode(page, "Input Node")).toBeVisible();
            await expect(getNode(page, "Step 1")).toBeVisible();
            await expect(getNode(page, "Step 2")).toBeVisible();
            await expect(getNode(page, "Output Node")).toBeVisible();

            // Get positions
            const output = await getNodePosition(page, "Output Node");
            const step2 = await getNodePosition(page, "Step 2");
            const step1 = await getNodePosition(page, "Step 1");
            const input = await getNodePosition(page, "Input Node");

            // Verify horizontal ordering (left to right): Output < Step2 < Step1 < Input
            expect(output.x).toBeLessThan(step2.x);
            expect(step2.x).toBeLessThan(step1.x);
            expect(step1.x).toBeLessThan(input.x);

            // Verify layer assignments via data-layer attribute
            const outputLayer = await getNodeLayer(page, "Output Node");
            const step2Layer = await getNodeLayer(page, "Step 2");
            const step1Layer = await getNodeLayer(page, "Step 1");
            const inputLayer = await getNodeLayer(page, "Input Node");

            expect(outputLayer).toBe("0"); // Output at Layer 0 (leftmost)
            expect(step2Layer).toBe("1"); // Step2 at Layer 1
            expect(step1Layer).toBe("2"); // Step1 at Layer 2
            expect(inputLayer).toBe("3"); // Input at Layer 3 (rightmost)
        });

        test("Convergent Flow: Two paths converging to one output", async ({ page }) => {
            await importCSV(page, "graph_layout_convergent_nodes.csv", "graph_layout_convergent_edges.csv");

            // Verify all 5 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "Input 2")).toBeVisible();
            await expect(getNode(page, "Step A")).toBeVisible();
            await expect(getNode(page, "Step B")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();

            // Get positions
            const output1 = await getNodePosition(page, "Output 1");
            const stepB = await getNodePosition(page, "Step B");
            const stepA = await getNodePosition(page, "Step A");
            const input1 = await getNodePosition(page, "Input 1");
            const input2 = await getNodePosition(page, "Input 2");

            // Verify horizontal ordering
            // Output1 < StepB < StepA < Input1
            expect(output1.x).toBeLessThan(stepB.x);
            expect(stepB.x).toBeLessThan(stepA.x);
            expect(stepA.x).toBeLessThan(input1.x);

            // Output1 < StepB < Input2
            expect(output1.x).toBeLessThan(stepB.x);
            expect(stepB.x).toBeLessThan(input2.x);

            // Verify layer assignments via data-layer attribute
            const output1Layer = await getNodeLayer(page, "Output 1");
            const stepBLayer = await getNodeLayer(page, "Step B");
            const stepALayer = await getNodeLayer(page, "Step A");
            const input1Layer = await getNodeLayer(page, "Input 1");
            const input2Layer = await getNodeLayer(page, "Input 2");

            expect(output1Layer).toBe("0"); // Output1 at Layer 0
            expect(stepBLayer).toBe("1"); // StepB at Layer 1 (distance 1 from Output1)
            expect(stepALayer).toBe("2"); // StepA at Layer 2 (distance 2 from Output1)
            expect(input1Layer).toBe("3"); // Input1 at Layer 3
            expect(input2Layer).toBe("3"); // Input2 at Layer 3
        });

        test("Divergent Flow: One input diverging to two outputs", async ({ page }) => {
            await importCSV(page, "graph_layout_divergent_nodes.csv", "graph_layout_divergent_edges.csv");

            // Verify all 5 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "Step A")).toBeVisible();
            await expect(getNode(page, "Step B")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();
            await expect(getNode(page, "Output 2")).toBeVisible();

            // Get positions
            const output1 = await getNodePosition(page, "Output 1");
            const output2 = await getNodePosition(page, "Output 2");
            const stepB = await getNodePosition(page, "Step B");
            const stepA = await getNodePosition(page, "Step A");
            const input1 = await getNodePosition(page, "Input 1");

            // Verify horizontal ordering
            // Output1 < StepB < StepA < Input1
            expect(output1.x).toBeLessThan(stepB.x);
            expect(stepB.x).toBeLessThan(stepA.x);
            expect(stepA.x).toBeLessThan(input1.x);

            // Output2 < StepA < Input1
            expect(output2.x).toBeLessThan(stepA.x);
            expect(stepA.x).toBeLessThan(input1.x);

            // Verify layer assignments via data-layer attribute
            const output1Layer = await getNodeLayer(page, "Output 1");
            const output2Layer = await getNodeLayer(page, "Output 2");
            const stepBLayer = await getNodeLayer(page, "Step B");
            const stepALayer = await getNodeLayer(page, "Step A");
            const input1Layer = await getNodeLayer(page, "Input 1");

            expect(output1Layer).toBe("0"); // Output1 at Layer 0
            expect(output2Layer).toBe("0"); // Output2 at Layer 0 (both outputs at leftmost)
            expect(stepBLayer).toBe("1"); // StepB at Layer 1
            expect(stepALayer).toBe("2"); // StepA at Layer 2
            expect(input1Layer).toBe("3"); // Input1 at Layer 3
        });
    });
});
