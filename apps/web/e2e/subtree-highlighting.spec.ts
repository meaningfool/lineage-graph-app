
import { test, expect } from "@playwright/test";
import path from "path";
import { LineagePage } from "./pages/LineagePage";

test.describe("Subtree Highlighting", () => {
    let lineagePage: LineagePage;
    const FIXTURES_DIR = path.join(__dirname, "fixtures", "subtree-highlighting");

    test.beforeEach(async ({ page }) => {
        lineagePage = new LineagePage(page);
        await lineagePage.goto();
    });

    /**
     * Slice 1: Focus Toggle UI
     * Goal: Verify the "Focus" button exists, toggles state, and updates accessibility attributes.
     */
    test("toggle_focus_ui", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "simple_dag", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "simple_dag", "edges.csv");

        // 1. Import Graph
        await lineagePage.importGraph(nodesFile, edgesFile);

        // 2. Open Details for Node B
        await page.getByText("Node B", { exact: true }).click();
        await expect(page.getByTestId("node-details-panel")).toBeVisible();

        // 3. Verify Focus Button Initial State
        const focusButton = page.getByTestId("focus-toggle");
        await expect(focusButton).toBeVisible();
        await expect(focusButton).toHaveAttribute("data-active", "false");
        await expect(focusButton).toHaveText("Focus Subtree");

        // 4. Click Toggle -> Active
        await focusButton.click();
        await expect(focusButton).toHaveAttribute("data-active", "true");
        await expect(focusButton).toHaveText("Clear Focus");

        // 5. Click Toggle -> Inactive
        await focusButton.click();
        await expect(focusButton).toHaveAttribute("data-active", "false");
        await expect(focusButton).toHaveText("Focus Subtree");
    });

    /**
     * Slice 2: Highlighting Logic
     * Goal: Verify visual dimming of unrelated nodes (D) while lineage (A->B->C) remains opaque.
     */
    test("visual_dimming_acyclic", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "simple_dag", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "simple_dag", "edges.csv");

        await lineagePage.importGraph(nodesFile, edgesFile);

        // Focus Node B
        await page.getByText("Node B", { exact: true }).click();
        await page.getByTestId("focus-toggle").click();

        // Assert A, B, C are opaque (opacity 1)
        const nodeA = lineagePage.getGraphNode("Node A").getByTestId("custom-node-content");
        const nodeB = lineagePage.getGraphNode("Node B").getByTestId("custom-node-content");
        const nodeC = lineagePage.getGraphNode("Node C").getByTestId("custom-node-content");
        const nodeD = lineagePage.getGraphNode("Node D").getByTestId("custom-node-content");

        await expect(nodeA).toHaveCSS("opacity", "1");
        await expect(nodeB).toHaveCSS("opacity", "1");
        await expect(nodeC).toHaveCSS("opacity", "1");

        // Assert D is dimmed (checking for opacity < 1)
        await expect(nodeD).not.toHaveCSS("opacity", "1");
    });

    test("clear_focus_restores_opacity", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "simple_dag", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "simple_dag", "edges.csv");

        await lineagePage.importGraph(nodesFile, edgesFile);

        // Focus Node B
        await page.getByText("Node B", { exact: true }).click();
        await page.getByTestId("focus-toggle").click();

        const nodeD = lineagePage.getGraphNode("Node D").getByTestId("custom-node-content");
        await expect(nodeD).not.toHaveCSS("opacity", "1");

        // Clear Focus
        await page.getByTestId("focus-toggle").click();

        // Assert D returns to opaque
        await expect(nodeD).toHaveCSS("opacity", "1");
    });

    /**
     * Slice 3: Handling Cycles & Self-Loops
     * Goal: Verify infinite recursion protection and correct highlighting for cycles and self-loops.
     */
    test("highlight_cycle", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "cycle_dag", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "cycle_dag", "edges.csv");

        await lineagePage.importGraph(nodesFile, edgesFile);

        // Cycle: A -> B -> C -> A. D -> E is separate.
        // Focus Node B. Should traverse B -> C -> A -> B...
        // Entire cycle A, B, C should be highlighted.
        // D and E should be dimmed.

        await page.getByText("Node B", { exact: true }).click({ force: true });
        await page.getByTestId("focus-toggle").click();

        const nodeA = lineagePage.getGraphNode("Node A").getByTestId("custom-node-content");
        const nodeB = lineagePage.getGraphNode("Node B").getByTestId("custom-node-content");
        const nodeC = lineagePage.getGraphNode("Node C").getByTestId("custom-node-content");
        const nodeD = lineagePage.getGraphNode("Node D").getByTestId("custom-node-content");
        const nodeE = lineagePage.getGraphNode("Node E").getByTestId("custom-node-content");

        await expect(nodeA).toHaveCSS("opacity", "1");
        await expect(nodeB).toHaveCSS("opacity", "1");
        await expect(nodeC).toHaveCSS("opacity", "1");

        await expect(nodeD).not.toHaveCSS("opacity", "1");
        await expect(nodeE).not.toHaveCSS("opacity", "1");
    });

    test("highlight_self_loop", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "self_loop", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "self_loop", "edges.csv");

        await lineagePage.importGraph(nodesFile, edgesFile);

        // A -> A (Self Loop). B -> B (Self Loop).
        // Focus A. A should be highlighted. B should be dimmed.

        await page.getByText("Node A", { exact: true }).click({ force: true });
        await page.getByTestId("focus-toggle").click();

        const nodeA = lineagePage.getGraphNode("Node A").getByTestId("custom-node-content");
        const nodeB = lineagePage.getGraphNode("Node B").getByTestId("custom-node-content");

        await expect(nodeB).not.toHaveCSS("opacity", "1");
    });

    /**
     * Slice 4: Interaction Refinements
     * Goal: Improve UX by allowing background click to dismiss focus, preserve panning.
     */
    test("background_dismiss", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "simple_dag", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "simple_dag", "edges.csv");

        await lineagePage.importGraph(nodesFile, edgesFile);

        // Focus Node B
        await page.getByText("Node B", { exact: true }).click();
        await page.getByTestId("focus-toggle").click();

        const nodeD = lineagePage.getGraphNode("Node D").getByTestId("custom-node-content");
        await expect(nodeD).not.toHaveCSS("opacity", "1"); // Dimmed

        // Click Background (Pane)
        // We click at a position guaranteed to be empty (0,0 is top left, usually safe if graph is centered?)
        // Actually fitView puts graph in center. 0,0 might be safe. Or use specific coordinate.
        await page.locator(".react-flow__pane").click({ position: { x: 10, y: 10 }, force: true });

        // Assert Focus cleared (D returns to opaque)
        await expect(nodeD).toHaveCSS("opacity", "1");
    });

    test("panning_preserves_focus", async ({ page }) => {
        const nodesFile = path.join(FIXTURES_DIR, "simple_dag", "nodes.csv");
        const edgesFile = path.join(FIXTURES_DIR, "simple_dag", "edges.csv");

        await lineagePage.importGraph(nodesFile, edgesFile);

        // Focus Node B
        await page.getByText("Node B", { exact: true }).click();
        await page.getByTestId("focus-toggle").click();

        const nodeD = lineagePage.getGraphNode("Node D").getByTestId("custom-node-content");
        await expect(nodeD).not.toHaveCSS("opacity", "1");

        // Pan the canvas
        // We drag the pane from one point to another
        const pane = page.locator(".react-flow__pane");
        const box = await pane.boundingBox();
        if (!box) throw new Error("Canvas not found");

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
        await page.mouse.up();

        // Assert Focus REMAINS active (D still dimmed)
        // Panning should NOT trigger onPaneClick
        await expect(nodeD).not.toHaveCSS("opacity", "1");
    });
});
