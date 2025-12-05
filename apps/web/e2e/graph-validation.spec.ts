import { expect, test } from "@playwright/test";
import path from "path";
import { LineagePage } from "./pages/LineagePage";

test.describe("Graph Validation", () => {
    test.beforeEach(async ({ page }) => {
        const lineagePage = new LineagePage(page);
        await lineagePage.goto();
    });

    test("should validate Input node rules (Slice 2.1)", async ({ page }) => {
        const lineagePage = new LineagePage(page);
        const nodesPath = path.join(__dirname, "fixtures", "graph-validation", "nodes_input_validation.csv");
        const edgesPath = path.join(__dirname, "fixtures", "graph-validation", "edges_input_validation.csv");
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 5. Verify Valid Node (A)
        await lineagePage.verifyNodeValidationStatus("Valid Input", "valid");

        // 6. Verify Invalid Nodes (B, C, D)
        const invalidNodes = [
            "Invalid Sink Input",
            "Invalid PassThrough Input",
            "Invalid Orphan Input"
        ];

        for (const label of invalidNodes) {
            await lineagePage.verifyNodeValidationStatus(label, "invalid");

            // Verify Tooltip
            const node = lineagePage.getGraphNode(label).locator("div").first();
            await node.hover();
            await expect(page.getByText(`${label}: Input node must have at least one outgoing connection and no incoming connections`)).toBeVisible();
        }
    });

    test("should validate Output node rules (Slice 2.2)", async ({ page }) => {
        const lineagePage = new LineagePage(page);
        const nodesPath = path.join(__dirname, "fixtures", "graph-validation", "nodes_output_validation.csv");
        const edgesPath = path.join(__dirname, "fixtures", "graph-validation", "edges_output_validation.csv");
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 5. Verify Valid Node (A)
        await lineagePage.verifyNodeValidationStatus("Valid Output", "valid");

        // 6. Verify Invalid Nodes (B, C, D)
        const invalidNodes = [
            "Invalid Source Output",
            "Invalid PassThrough Output",
            "Invalid Orphan Output"
        ];

        for (const label of invalidNodes) {
            await lineagePage.verifyNodeValidationStatus(label, "invalid");

            // Verify Tooltip
            const node = lineagePage.getGraphNode(label).locator("div").first();
            await node.hover();
            await expect(page.getByText(`${label}: Output node must have at least one incoming connection and no outgoing connections`)).toBeVisible();
        }
    });

    test("should validate Step node rules (Slice 2.3)", async ({ page }) => {
        const lineagePage = new LineagePage(page);
        const nodesPath = path.join(__dirname, "fixtures", "graph-validation", "nodes_step_validation.csv");
        const edgesPath = path.join(__dirname, "fixtures", "graph-validation", "edges_step_validation.csv");
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 5. Verify Valid Node (A)
        await lineagePage.verifyNodeValidationStatus("Valid Step", "valid");

        // 6. Verify Invalid Nodes (B, C, D)
        const invalidNodes = [
            "Invalid Source Step",
            "Invalid Sink Step",
            "Invalid Orphan Step"
        ];

        for (const label of invalidNodes) {
            await lineagePage.verifyNodeValidationStatus(label, "invalid");

            // Verify Tooltip
            const node = lineagePage.getGraphNode(label).locator("div").first();
            await node.hover();
            await expect(page.getByText(`${label}: Step node must have at least one incoming connection and at least one outgoing connection`)).toBeVisible();
        }
    });

    test("should detect self-cycles (Slice 3.1)", async ({ page }) => {
        const lineagePage = new LineagePage(page);
        const nodesPath = path.join(__dirname, "fixtures", "graph-validation", "nodes_self_cycle.csv");
        const edgesPath = path.join(__dirname, "fixtures", "graph-validation", "edges_self_cycle.csv");
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 5. Verify Self-Cycle Edge (B -> B)
        // We expect ONE invalid edge (the self-loop)
        await lineagePage.verifyEdgeValidationStatus("invalid", 1);

        // 6. Verify Error Message (Panel)
        await page.getByTestId("error-toggle").click();
        const panel = page.getByTestId("error-list-panel");
        await expect(panel).toBeVisible();
        await expect(panel).toContainText("Self-cycle: Self Cycle Step connects to itself");
    });

    test("should detect multi-node cycles (Slice 3.2)", async ({ page }) => {
        const lineagePage = new LineagePage(page);
        const nodesPath = path.join(__dirname, "fixtures", "graph-validation", "nodes_cycle.csv");
        const edgesPath = path.join(__dirname, "fixtures", "graph-validation", "edges_cycle.csv");
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 5. Verify Multi-Node Cycle Edges (A->B, B->C, C->A)
        // All 3 edges in the cycle should be invalid
        await lineagePage.verifyEdgeValidationStatus("invalid", 3);

        // 6. Verify Error Message
        await page.getByTestId("error-toggle").click();
        const panel = page.getByTestId("error-list-panel");
        const expectedMessage = "Cycle detected: Node A -> Node B -> Node C -> Node A";

        await expect(panel.getByText(expectedMessage).first()).toBeVisible();
        await expect(panel.getByText(expectedMessage)).toHaveCount(1);
    });
});
