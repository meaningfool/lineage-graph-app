import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

test.describe("Error Display Feature", () => {
	test.describe.configure({ mode: "serial" });
	// Removed serial mode

	test.beforeEach(async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.goto();
	});

	test("Scenario 1: No Errors [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"shared",
			"edges_valid_basic.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath);

		// 2. Assertion: Error Toggle is NOT visible
		await lineagePage.verifyErrorToggleVisible(false);
	});

	test("Scenario 2: With Errors [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		// 1. Map Nodes & Edges via Helper (with override for title -> label)
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});

		// 2. Assertion: Error Toggle is visible
		await lineagePage.verifyErrorToggleVisible(true);

		// 3. Assertion: Badge displays correct count
		await lineagePage.verifyErrorCount(3);

		// 4. Assertion: Verify Passive Error State (Static Red Border) [NEW]
		// Node 1 has an error but is NOT selected, so it should have red border but NO ripple
		const node1 = lineagePage
			.getGraphNode("Node 1")
			.getByTestId("custom-node-content");
		await expect(node1).toHaveClass(/border-red-500/);
		await expect(node1).not.toHaveClass(/animate-flash-ring/);

		// Edges with errors should have red stroke (Passive state)
		// We check that at least one edge path has the red stroke color
		const edgePath = page
			.locator(".react-flow__edge path.react-flow__edge-path")
			.first();
		// Note: The stroke color is applied via style prop, so we check the style attribute or computed style
		await expect(edgePath).toHaveCSS("stroke", "rgb(239, 68, 68)"); // #ef4444
		await expect(edgePath).not.toHaveClass(/animate-pulse/);
	});

	test("Scenario 3: Opening the Panel [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.uploadFiles(nodesPath, edgesPath);
		await lineagePage.clickNext();

		// 1. Map Nodes
		await lineagePage.mapColumns({
			id: "id",
			title: "label",
			type: "type",
		});

		await lineagePage.clickNext();

		// 2. Map Edges
		await lineagePage.mapColumns({
			source: "source",
			target: "target",
		});

		await lineagePage.submitMapping();
		await lineagePage.closeImportModal();

		// 2. Action: Click Error Toggle
		await lineagePage.openErrorPanel();

		// 3. Assertion: Error Panel is visible
		await lineagePage.verifyErrorPanelVisible(true);
	});

	test("Scenario 4: Closing the Panel [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});

		await lineagePage.openErrorPanel();
		await lineagePage.verifyErrorPanelVisible(true);

		// 2. Action: Click Close button
		await lineagePage.closeErrorPanel();

		// 3. Assertion: Error Panel is NOT visible
		await lineagePage.verifyErrorPanelVisible(false);
	});

	test("Scenario 5: List Accuracy [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});

		await lineagePage.openErrorPanel();

		// 2. Assertion: Check for specific error content
		await lineagePage.verifyErrorPanelContent("Node 1");
	});

	test("Scenario 6: Multiple Errors [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});

		await lineagePage.openErrorPanel();

		// 2. Assertion: Check number of error items
		await lineagePage.verifyErrorItemCount(3);
	});

	test("Scenario 7: Select Node from Error [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		// We use a file with no edge errors to keep it simple, or just ignore them
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});

		await lineagePage.openErrorPanel();

		// 2. Action: Click the error item for "Node 1"
		// The fixture has an error for Node 1 (Input node with incoming edge)
		await lineagePage.clickErrorItem("Node 1");

		// 3. Assertion: Node 1 is selected and Property Panel opens
		await lineagePage.verifyNodeSelected("Node 1");
		await lineagePage.verifySidePanelVisible(true);
		await lineagePage.verifySidePanelContent("Node 1");

		// 4. Assertion: Error Panel remains open
		await lineagePage.verifyErrorPanelVisible(true);
	});

	test("Scenario 8: Select Edge from Error [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});

		await lineagePage.openErrorPanel();

		// 2. Action: Click the error item for an Edge
		// The fixture has a "Self-cycle" error for edge3 (node3->node3)
		await lineagePage.clickErrorItem("Self-cycle");

		// 3. Assertion: Edge has pulse (or specific selected state)
		// Since we are reusing the pulse for selection as per spec slice 3 goal ("Red Pulse")
		await lineagePage.verifyEdgeHasPulse();

		// 4. Assertion: No node property panel opens
		await lineagePage.verifySidePanelVisible(false);
	});

	test("Scenario 9: Exclusive Pulse [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});
		await lineagePage.openErrorPanel();

		// 1. Action: Click "Node 1" error
		await lineagePage.clickErrorItem("Node 1");

		// 2. Assertion: Node 1 has pulse
		await lineagePage.verifyNodeHasPulse("Node 1");

		// 3. Action: Click "Self-cycle" error (Edge Error)
		// We use an edge error because Node 5 is dropped during import, so we don't have a second node error available in this fixture.
		// Switching from Node to Edge still verifies the "Exclusive Pulse" behavior (Node should stop pulsing).
		await lineagePage.clickErrorItem("Self-cycle");

		// 4. Assertion: Edge has pulse
		await lineagePage.verifyEdgeHasPulse();

		// 5. CRITICAL ASSERTION: Node 1 does NOT have pulse anymore
		// It should revert to static red border (passive state)
		await lineagePage.verifyNodeDoesNotHavePulse("Node 1");
	});
	test("Scenario 10: Restart Pulse on Re-click [NEW]", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"nodes_errors_display.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures",
			"error-display",
			"edges_errors_display.csv",
		);
		await lineagePage.importGraph(nodesPath, edgesPath, undefined, {
			nodes: { title: "label" },
		});
		await lineagePage.openErrorPanel();

		// 1. Click the error for Node 1
		await lineagePage.clickErrorItem("Node 1");

		// 2. Verify it has the flash ring
		const node1Content = lineagePage
			.getGraphNode("Node 1")
			.getByTestId("custom-node-content");
		// Note: We need to target the actual flash ring element which we will add in implementation
		// For now, let's assume it's a child with class .animate-flash-ring
		const flashRing = node1Content.locator(".animate-flash-ring");
		await expect(flashRing).toBeVisible();

		// 3. Get the current flash trigger ID
		const initialTriggerId = await flashRing.getAttribute("data-flash-trigger");

		// 4. Click the SAME error again
		await lineagePage.clickErrorItem("Node 1");

		// 5. Verify the flash trigger ID has changed (indicating a re-render/restart)
		expect(initialTriggerId).toBeTruthy();
		await expect(flashRing).not.toHaveAttribute(
			"data-flash-trigger",
			initialTriggerId as string,
		);
	});
});
