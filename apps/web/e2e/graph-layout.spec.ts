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

    test.describe("Slice 2: Invalid Graphs", () => {
        test("1. Invalid Source Direction: Output → Step (backward edge)", async ({ page }) => {
            await importCSV(page, "graph_layout_invalid_source_nodes.csv", "graph_layout_invalid_source_edges.csv");

            // Verify all 6 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "S1")).toBeVisible();
            await expect(getNode(page, "S2")).toBeVisible();
            await expect(getNode(page, "S3")).toBeVisible();
            await expect(getNode(page, "S4")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();

            // Get positions
            const output1 = await getNodePosition(page, "Output 1");
            const s4 = await getNodePosition(page, "S4");
            const s3 = await getNodePosition(page, "S3");
            const s2 = await getNodePosition(page, "S2");
            const s1 = await getNodePosition(page, "S1");
            const input1 = await getNodePosition(page, "Input 1");

            // Verify horizontal ordering: Output1 < S4 < S3 < S2 < S1 < Input1
            expect(output1.x).toBeLessThan(s4.x);
            expect(s4.x).toBeLessThan(s3.x);
            expect(s3.x).toBeLessThan(s2.x);
            expect(s2.x).toBeLessThan(s1.x);
            expect(s1.x).toBeLessThan(input1.x);

            // Verify layer assignments
            const output1Layer = await getNodeLayer(page, "Output 1");
            const s4Layer = await getNodeLayer(page, "S4");
            const s3Layer = await getNodeLayer(page, "S3");
            const s2Layer = await getNodeLayer(page, "S2");
            const s1Layer = await getNodeLayer(page, "S1");
            const input1Layer = await getNodeLayer(page, "Input 1");

            expect(output1Layer).toBe("0"); // Output at Layer 0
            expect(s4Layer).toBe("1"); // S4 anchored to Output
            expect(s3Layer).toBe("2");
            expect(s2Layer).toBe("3");
            expect(s1Layer).toBe("4");
            expect(input1Layer).toBe("5"); // Input at Layer 5
        });

        test("2. Missing Output: Input chain with no output", async ({ page }) => {
            await importCSV(page, "graph_layout_missing_output_nodes.csv", "graph_layout_missing_output_edges.csv");

            // Verify all 3 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "Step A")).toBeVisible();
            await expect(getNode(page, "Step B")).toBeVisible();

            // Get positions
            const stepB = await getNodePosition(page, "Step B");
            const stepA = await getNodePosition(page, "Step A");
            const input1 = await getNodePosition(page, "Input 1");

            // Verify horizontal ordering: StepB < StepA < Input1
            expect(stepB.x).toBeLessThan(stepA.x);
            expect(stepA.x).toBeLessThan(input1.x);

            // Verify layer assignments (anchored to Input at right)
            const stepBLayer = await getNodeLayer(page, "Step B");
            const stepALayer = await getNodeLayer(page, "Step A");
            const input1Layer = await getNodeLayer(page, "Input 1");

            expect(stepBLayer).toBe("1"); // StepB at Layer 1 (dead-end sink)
            expect(stepALayer).toBe("2"); // StepA at Layer 2
            expect(input1Layer).toBe("3"); // Input at Layer 3 (max)
        });

        test("3. Missing Input: Step chain ending at output", async ({ page }) => {
            await importCSV(page, "graph_layout_missing_input_nodes.csv", "graph_layout_missing_input_edges.csv");

            // Verify all 3 nodes are visible
            await expect(getNode(page, "Step A")).toBeVisible();
            await expect(getNode(page, "Step B")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();

            // Get positions
            const output1 = await getNodePosition(page, "Output 1");
            const stepB = await getNodePosition(page, "Step B");
            const stepA = await getNodePosition(page, "Step A");

            // Verify horizontal ordering: Output1 < StepB < StepA
            expect(output1.x).toBeLessThan(stepB.x);
            expect(stepB.x).toBeLessThan(stepA.x);

            // Verify layer assignments (anchored to Output at left)
            const output1Layer = await getNodeLayer(page, "Output 1");
            const stepBLayer = await getNodeLayer(page, "Step B");
            const stepALayer = await getNodeLayer(page, "Step A");

            expect(output1Layer).toBe("0"); // Output at Layer 0
            expect(stepBLayer).toBe("1"); // StepB at Layer 1
            expect(stepALayer).toBe("2"); // StepA at Layer 2
        });

        test("4. Isolated Chain: Steps only (no input, no output)", async ({ page }) => {
            await importCSV(page, "graph_layout_isolated_chain_nodes.csv", "graph_layout_isolated_chain_edges.csv");

            // Verify all 3 nodes are visible
            await expect(getNode(page, "Step A")).toBeVisible();
            await expect(getNode(page, "Step B")).toBeVisible();
            await expect(getNode(page, "Step C")).toBeVisible();

            // Get positions
            const stepC = await getNodePosition(page, "Step C");
            const stepB = await getNodePosition(page, "Step B");
            const stepA = await getNodePosition(page, "Step A");

            // Verify horizontal ordering: StepC < StepB < StepA (right to left flow)
            expect(stepC.x).toBeLessThan(stepB.x);
            expect(stepB.x).toBeLessThan(stepA.x);

            // Verify layer assignments (StepC is sink at Layer 1, not 0)
            const stepCLayer = await getNodeLayer(page, "Step C");
            const stepBLayer = await getNodeLayer(page, "Step B");
            const stepALayer = await getNodeLayer(page, "Step A");

            expect(stepCLayer).toBe("1"); // StepC (sink) at Layer 1
            expect(stepBLayer).toBe("2"); // StepB at Layer 2
            expect(stepALayer).toBe("3"); // StepA (source) at Layer 3
        });

        test("5. Mixed: Valid chain + Missing Output chain", async ({ page }) => {
            await importCSV(page, "graph_layout_mixed_missing_output_nodes.csv", "graph_layout_mixed_missing_output_edges.csv");

            // Verify all 9 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "S1")).toBeVisible();
            await expect(getNode(page, "S2")).toBeVisible();
            await expect(getNode(page, "S3")).toBeVisible();
            await expect(getNode(page, "S4")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();
            await expect(getNode(page, "Input 2")).toBeVisible();
            await expect(getNode(page, "T1")).toBeVisible();
            await expect(getNode(page, "T2")).toBeVisible();

            // Valid chain positions
            const output1 = await getNodePosition(page, "Output 1");
            const s4 = await getNodePosition(page, "S4");
            const s1 = await getNodePosition(page, "S1");
            const input1 = await getNodePosition(page, "Input 1");

            // Invalid chain positions
            const input2 = await getNodePosition(page, "Input 2");
            const t1 = await getNodePosition(page, "T1");
            const t2 = await getNodePosition(page, "T2");

            // Valid chain ordering
            expect(output1.x).toBeLessThan(s4.x);
            expect(s4.x).toBeLessThan(s1.x);
            expect(s1.x).toBeLessThan(input1.x);

            // Invalid chain ordering: T2 < T1 < Input2
            expect(t2.x).toBeLessThan(t1.x);
            expect(t1.x).toBeLessThan(input2.x);

            // Verify layer assignments
            const output1Layer = await getNodeLayer(page, "Output 1");
            const input1Layer = await getNodeLayer(page, "Input 1");
            const input2Layer = await getNodeLayer(page, "Input 2");
            const t1Layer = await getNodeLayer(page, "T1");
            const t2Layer = await getNodeLayer(page, "T2");

            expect(output1Layer).toBe("0"); // Output1 at Layer 0
            expect(input1Layer).toBe("5"); // Input1 at Layer 5 (global max)
            expect(input2Layer).toBe("5"); // Input2 also at Layer 5 (right-aligned)
            expect(t1Layer).toBe("2"); // T1 at Layer 2
            expect(t2Layer).toBe("1"); // T2 at Layer 1 (dead-end sink)
        });

        test("6. Mixed: Valid chain + Missing Input chain", async ({ page }) => {
            await importCSV(page, "graph_layout_mixed_missing_input_nodes.csv", "graph_layout_mixed_missing_input_edges.csv");

            // Verify all 9 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "S1")).toBeVisible();
            await expect(getNode(page, "S2")).toBeVisible();
            await expect(getNode(page, "S3")).toBeVisible();
            await expect(getNode(page, "S4")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();
            await expect(getNode(page, "T1")).toBeVisible();
            await expect(getNode(page, "T2")).toBeVisible();
            await expect(getNode(page, "Output 2")).toBeVisible();

            // Valid chain positions
            const output1 = await getNodePosition(page, "Output 1");
            const input1 = await getNodePosition(page, "Input 1");

            // Invalid chain positions
            const output2 = await getNodePosition(page, "Output 2");
            const t2 = await getNodePosition(page, "T2");
            const t1 = await getNodePosition(page, "T1");

            // Invalid chain ordering: Output2 < T2 < T1
            expect(output2.x).toBeLessThan(t2.x);
            expect(t2.x).toBeLessThan(t1.x);

            // Verify layer assignments
            const output1Layer = await getNodeLayer(page, "Output 1");
            const output2Layer = await getNodeLayer(page, "Output 2");
            const input1Layer = await getNodeLayer(page, "Input 1");
            const t1Layer = await getNodeLayer(page, "T1");
            const t2Layer = await getNodeLayer(page, "T2");

            expect(output1Layer).toBe("0"); // Output1 at Layer 0
            expect(output2Layer).toBe("0"); // Output2 at Layer 0 (left-aligned)
            expect(input1Layer).toBe("5"); // Input1 at Layer 5
            expect(t2Layer).toBe("1"); // T2 at Layer 1
            expect(t1Layer).toBe("2"); // T1 at Layer 2 (starts in middle)
        });

        test("7. Mixed: Valid chain + Isolated chain", async ({ page }) => {
            await importCSV(page, "graph_layout_mixed_isolated_nodes.csv", "graph_layout_mixed_isolated_edges.csv");

            // Verify all 9 nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "S1")).toBeVisible();
            await expect(getNode(page, "S2")).toBeVisible();
            await expect(getNode(page, "S3")).toBeVisible();
            await expect(getNode(page, "S4")).toBeVisible();
            await expect(getNode(page, "Output 1")).toBeVisible();
            await expect(getNode(page, "T1")).toBeVisible();
            await expect(getNode(page, "T2")).toBeVisible();
            await expect(getNode(page, "T3")).toBeVisible();

            // Valid chain positions
            const output1 = await getNodePosition(page, "Output 1");
            const input1 = await getNodePosition(page, "Input 1");

            // Isolated chain positions
            const t3 = await getNodePosition(page, "T3");
            const t2 = await getNodePosition(page, "T2");
            const t1 = await getNodePosition(page, "T1");

            // Isolated chain ordering: T3 < T2 < T1
            expect(t3.x).toBeLessThan(t2.x);
            expect(t2.x).toBeLessThan(t1.x);

            // Verify layer assignments
            const output1Layer = await getNodeLayer(page, "Output 1");
            const input1Layer = await getNodeLayer(page, "Input 1");
            const t3Layer = await getNodeLayer(page, "T3");
            const t2Layer = await getNodeLayer(page, "T2");
            const t1Layer = await getNodeLayer(page, "T1");

            expect(output1Layer).toBe("0"); // Output1 at Layer 0
            expect(input1Layer).toBe("5"); // Input1 at Layer 5
            // Isolated chain: Steps cannot be at Layer 0 (Output) or Layer 5 (Input)
            expect(t3Layer).toBe("1"); // T3 (sink) at Layer 1 (closest to output)
            expect(t2Layer).toBe("2"); // T2 at Layer 2
            expect(t1Layer).toBe("3"); // T1 (source) at Layer 3
        });

        test("8. Input-Input Connection", async ({ page }) => {
            await importCSV(page, "graph_layout_input_input_nodes.csv", "graph_layout_input_input_edges.csv");

            // Verify both nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "Input 2")).toBeVisible();

            // Get positions
            const input1 = await getNodePosition(page, "Input 1");
            const input2 = await getNodePosition(page, "Input 2");

            // Both inputs should be at the same x position (same layer)
            expect(input1.x).toBe(input2.x);

            // Verify layer assignments - both at Input layer (max)
            const input1Layer = await getNodeLayer(page, "Input 1");
            const input2Layer = await getNodeLayer(page, "Input 2");

            expect(input1Layer).toBe(input2Layer); // Same layer
            expect(input1Layer).toBe("0"); // At Layer 0 (Early Exit for Input-Only/Ignored Edges)
        });

        test("9. Output-Output Connection", async ({ page }) => {
            await importCSV(page, "graph_layout_output_output_nodes.csv", "graph_layout_output_output_edges.csv");

            // Verify both nodes are visible
            await expect(getNode(page, "Output 1")).toBeVisible();
            await expect(getNode(page, "Output 2")).toBeVisible();

            // Get positions
            const output1 = await getNodePosition(page, "Output 1");
            const output2 = await getNodePosition(page, "Output 2");

            // Both outputs should be at the same x position (same layer)
            expect(output1.x).toBe(output2.x);

            // Verify layer assignments - both at Output layer (0)
            const output1Layer = await getNodeLayer(page, "Output 1");
            const output2Layer = await getNodeLayer(page, "Output 2");

            expect(output1Layer).toBe("0"); // Output at Layer 0
            expect(output2Layer).toBe("0"); // Output at Layer 0
        });

        test("10. Input-Only Graph", async ({ page }) => {
            await importCSV(page, "graph_layout_input_only_nodes.csv", "graph_layout_input_only_edges.csv");

            // Verify both nodes are visible
            await expect(getNode(page, "Input 1")).toBeVisible();
            await expect(getNode(page, "Input 2")).toBeVisible();

            // Get positions
            const input1 = await getNodePosition(page, "Input 1");
            const input2 = await getNodePosition(page, "Input 2");

            // Both inputs should be at the same x position (Layer 0 for input-only)
            expect(input1.x).toBe(input2.x);

            // Verify layer assignments - Early Exit: All at Layer 0
            const input1Layer = await getNodeLayer(page, "Input 1");
            const input2Layer = await getNodeLayer(page, "Input 2");

            expect(input1Layer).toBe("0"); // Layer 0 (early exit for input-only)
            expect(input2Layer).toBe("0"); // Layer 0 (early exit for input-only)
        });
    });

    test.describe("Slice 3: Cycles (Self-Loops & Feedback)", () => {
        test("1. Self-Cycle: Step with self-loop in valid chain", async ({ page }) => {
            await importCSV(page, "nodes_self_cycle.csv", "edges_self_cycle.csv");

            // Verify nodes are visible
            await expect(getNode(page, "Valid Input")).toBeVisible();
            await expect(getNode(page, "Self Cycle Step")).toBeVisible();
            await expect(getNode(page, "Valid Output")).toBeVisible();

            // Get positions
            const output = await getNodePosition(page, "Valid Output");
            const step = await getNodePosition(page, "Self Cycle Step");
            const input = await getNodePosition(page, "Valid Input");

            // Verify horizontal ordering: Output < Step < Input
            expect(output.x).toBeLessThan(step.x);
            expect(step.x).toBeLessThan(input.x);

            // Verify layer assignments
            const outputLayer = await getNodeLayer(page, "Valid Output");
            const stepLayer = await getNodeLayer(page, "Self Cycle Step");
            const inputLayer = await getNodeLayer(page, "Valid Input");

            expect(outputLayer).toBe("0");
            expect(stepLayer).toBe("1");
            expect(inputLayer).toBe("2");
        });

        test("2. Isolated Cycle: 3-node cycle (Floating)", async ({ page }) => {
            await importCSV(page, "nodes_cycle.csv", "edges_cycle.csv");

            // Verify nodes are visible
            await expect(getNode(page, "Node A")).toBeVisible();
            await expect(getNode(page, "Node B")).toBeVisible();
            await expect(getNode(page, "Node C")).toBeVisible();

            // Get positions
            const nodeA = await getNodePosition(page, "Node A");
            const nodeB = await getNodePosition(page, "Node B");
            const nodeC = await getNodePosition(page, "Node C");

            // Verify nodes are NOT all at the same layer (unrolled)
            // With Pseudo-Sink strategy:
            // Node A (lowest ID) -> Layer 1
            // Node C -> Layer 2
            // Node B -> Layer 3
            // So x coordinates should be different
            expect(nodeA.x).not.toBe(nodeB.x);
            expect(nodeB.x).not.toBe(nodeC.x);

            // Verify layer assignments
            const nodeALayer = await getNodeLayer(page, "Node A");
            const nodeCLayer = await getNodeLayer(page, "Node C");
            const nodeBLayer = await getNodeLayer(page, "Node B");

            expect(nodeALayer).toBe("1"); // Pseudo-Sink
            expect(nodeCLayer).toBe("2");
            expect(nodeBLayer).toBe("3");
        });
    });
});
