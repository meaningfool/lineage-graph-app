import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "../pages/LineagePage";

test.describe("New Wizard - Feature Parity Regression", () => {
	let lineagePage: LineagePage;

	test.beforeEach(async ({ page }) => {
		lineagePage = new LineagePage(page);
		await lineagePage.goto();
		// Enable "New Wizard" Strategy
		lineagePage.setImportStrategy("new");
	});

	test("should validate Input node rules (Slice 2.1)", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"../fixtures/graph-validation/nodes_input_validation.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures/graph-validation/edges_input_validation.csv",
		);

		await lineagePage.importGraph(nodesPath, edgesPath);

		// 5. Verify Valid Node (A)
		await lineagePage.verifyNodeValidationStatus("Valid Input", "valid");

		// 6. Verify Invalid Nodes
		const invalidNodes = [
			"Invalid Sink Input",
			"Invalid PassThrough Input",
			"Invalid Orphan Input",
		];

		for (const label of invalidNodes) {
			await lineagePage.verifyNodeValidationStatus(label, "invalid");
		}
	});

	test("should detect multi-node cycles (Slice 3.2)", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"../fixtures/graph-validation/nodes_cycle.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures/graph-validation/edges_cycle.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath);

		// 5. Verify Multi-Node Cycle Edges
		await lineagePage.verifyEdgeValidationStatus("invalid", 3);

		// 6. Verify Error Message
		await page.getByTestId("error-toggle").click();
		const panel = page.getByTestId("error-list-panel");
		const expectedMessage =
			"Cycle detected: Node A -> Node B -> Node C -> Node A";

		await expect(panel.getByText(expectedMessage).first()).toBeVisible();
	});
});
