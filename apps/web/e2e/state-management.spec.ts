import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

const FIXTURES_DIR = path.join(__dirname, "fixtures", "subtree-highlighting");

test.describe("State Management", () => {
	let lineagePage: LineagePage;

	test.beforeEach(async ({ page }) => {
		lineagePage = new LineagePage(page);
		await lineagePage.goto();
	});

	test("importing_new_file_clears_focus_state", async ({ page }) => {
		// 1. Import first graph (Simple DAG)
		await lineagePage.importGraph(
			path.join(FIXTURES_DIR, "simple_dag", "nodes.csv"),
			path.join(FIXTURES_DIR, "simple_dag", "edges.csv"),
		);

		// 2. Focus Node B (causing Node D to be dimmed)
		await page.getByText("Node B", { exact: true }).click();
		await page.getByTestId("focus-toggle").click();

		const nodeD_Run1 = lineagePage
			.getGraphNode("Node D")
			.getByTestId("custom-node-content");
		// Verify dimming is active (strict match for opacity-10, excluding opacity-100)
		await expect(nodeD_Run1).toHaveClass(/opacity-10(?!0)/);

		// 3. Import new graph (or same graph again)
		// Using same graph for simplicity, simulates "new file"
		await lineagePage.importGraph(
			path.join(FIXTURES_DIR, "simple_dag", "nodes.csv"),
			path.join(FIXTURES_DIR, "simple_dag", "edges.csv"),
		);

		// 4. Verify Focus is CLEARED
		const nodeD_Run2 = lineagePage
			.getGraphNode("Node D")
			.getByTestId("custom-node-content");

		// Should NOT be dimmed (should have opacity-100)
		await expect(nodeD_Run2).toHaveClass(/opacity-100/);

		// Also verify the "Focus" button state reset (it should say "Focus Subtree", not "Clear Focus")
		// Note: Button might be hidden if no node is selected, but if we just imported, nothing is selected.
		// If we select Node B again, it should show "Focus Subtree".

		await page.getByText("Node B", { exact: true }).click();
		// Check button text
		await expect(page.getByTestId("focus-toggle")).toHaveText("Focus Subtree");
	});

	/**
	 * Bug: Error nodes flash on click (unexpected behavior).
	 * Fix: Only triggering from sidebar should flash.
	 */
	test("clicking_error_node_does_not_trigger_flash", async ({ page }) => {
		// Use cycle checks to generate an error (Node in cycle)
		// Assuming cycle_dag causes validation errors due to cycle detection logic (if implemented)
		// If not, we rely on checking ANY node click doesn't trigger flash.
		// Ideally we test on a node *with* an error to be sure.

		const nodesFile = path.join(FIXTURES_DIR, "cycle_dag", "nodes.csv");
		const edgesFile = path.join(FIXTURES_DIR, "cycle_dag", "edges.csv");
		await lineagePage.importGraph(nodesFile, edgesFile);

		// Ensure Node A has an error, otherwise the test is meaningless
		await lineagePage.verifyNodeValidationStatus("Node A", "invalid");

		// Click a node (Node A in cycle)
		// We target the content div directly to ensure we hit the interactive part
		await lineagePage
			.getGraphNode("Node A")
			.getByTestId("custom-node-content")
			.click();

		// Verify it is selected but NOT displaying the flash ring
		await lineagePage.verifyNodeSelected("Node A");
		await lineagePage.verifyNodeDoesNotHavePulse("Node A");
	});
});
