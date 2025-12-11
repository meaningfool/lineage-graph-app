import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

const STRATEGIES = ["legacy", "new"] as const;

for (const strategy of STRATEGIES) {
	test.describe(`Node Properties (${strategy})`, () => {
		test.beforeEach(async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.goto();
			lineagePage.setImportStrategy(strategy);
		});

		// NOTE: Tests purely for the "Wizard UI" (Dropdown vs Pills) are intentionally
		// separate:
		// - Legacy: Covered by older focused tests (or implicit here)
		// - New: Covered by e2e/new-wizard/node-properties.spec.ts

		test("should display first property in node card (Slice 1 Preview)", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			lineagePage.setImportStrategy(strategy);

			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"node-properties",
				"nodes_with_desc.csv",
			);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"node-properties",
				"edges_with_desc.csv",
			);

			// Import with 'description' property selected
			await lineagePage.importGraph(nodesPath, edgesPath, {
				onNodeMapping: async () => {
					await lineagePage.selectProperty("description");
				},
			});

			// 7. Verify Side Panel Interaction (Slice 2)
			await lineagePage.clickNode("User Table");
			await lineagePage.verifySidePanelVisible(true);

			// Verify Content
			await lineagePage.verifySidePanelContent("User Table");
			await lineagePage.verifySidePanelContent("description");
			await lineagePage.verifySidePanelContent("Core user table");

			// Verify Preview is GONE (Slice 2 requirement)
			const node = lineagePage.getGraphNode("User Table");
			await expect(node).not.toContainText("Core user table");

			// Verify ID is visible on the card (Slice 5 requirement)
			await expect(node).toContainText("user_table");

			// Close Panel
			await lineagePage.closeSidePanel();
			await lineagePage.verifySidePanelVisible(false);
		});

		test("should handle selection, visual cues, and long content (Slice 3)", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			lineagePage.setImportStrategy(strategy);

			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"node-properties",
				"nodes_long_content.csv",
			);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"node-properties",
				"edges_long_content.csv",
			);

			// Import with 'description' and 'prop1' properties selected
			await lineagePage.importGraph(nodesPath, edgesPath, {
				onNodeMapping: async () => {
					await lineagePage.selectProperty("description");
					await lineagePage.selectProperty("prop1");
				},
			});

			// 2. Verify Hover Cursor
			const nodeA = lineagePage.getGraphNode("Node A");
			await expect(nodeA.getByTestId("custom-node-content")).toHaveCSS(
				"cursor",
				"pointer",
			);

			// 3. Verify Selection Visual Cue & Panel Open
			await lineagePage.clickNode("Node A");
			await lineagePage.verifySidePanelVisible(true);
			await lineagePage.verifySidePanelContent("Node A");
			await lineagePage.verifyNodeSelected("Node A");

			// 4. Verify Selection Switching & Content Update
			await lineagePage.clickNode("Node B");

			// Node A should lose the cue
			await lineagePage.verifyNodeNotSelected("Node A");
			// Node B should gain the cue
			await lineagePage.verifyNodeSelected("Node B");

			// Panel content should update
			await lineagePage.verifySidePanelContent("Node B");
			await lineagePage.verifySidePanelContent(
				"This is a very long description",
			);

			// 5. Verify Full Height & Scrolling (Slice 4: Floating with margins)
			const panel = page.getByTestId("node-details-panel");
			await expect(panel).toHaveClass(/absolute/);
			await expect(panel).toHaveClass(/top-4|bottom-4|right-4/);

			// 6. Verify Scrolling with Node D (Many properties)
			await lineagePage.clickNode("Node D");
			await lineagePage.verifySidePanelContent("Node D");
			await lineagePage.verifySidePanelContent("prop1");
			await lineagePage.verifySidePanelContent("Value 1 is somewhat long");
		});

		test("should not import unselected properties (Slice 3)", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			lineagePage.setImportStrategy(strategy);

			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"node-properties",
				"nodes_long_content.csv",
			);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"node-properties",
				"edges_long_content.csv",
			);

			// Import with ONLY 'description' selected
			await lineagePage.importGraph(nodesPath, edgesPath, {
				onNodeMapping: async () => {
					await lineagePage.selectProperty("description");
					// Leave prop1 unselected
				},
			});

			// 5. Verify Side Panel
			await lineagePage.clickNode("Node A");

			// Should contain 'description'
			await lineagePage.verifySidePanelContent("description");
			await lineagePage.verifySidePanelContent("Short description");

			// Should NOT contain 'prop1'
			await lineagePage.verifySidePanelMissingContent("prop1");
			await lineagePage.verifySidePanelMissingContent("val1A");
		});
	});
}
