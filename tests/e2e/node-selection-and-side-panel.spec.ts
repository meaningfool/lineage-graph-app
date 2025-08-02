import { expect, test } from "@playwright/test";

test.describe("Data Lineage App - Node Selection and Side Panel", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await expect(page.locator(".react-flow__node").first()).toBeVisible({
			timeout: 10000,
		});
	});

	// Helper function to check if a node is selected
	const expectNodeSelected = (node: any) =>
		expect(node.locator("div").first()).toHaveClass(/selected-node/);
	const expectNodeNotSelected = (node: any) =>
		expect(node.locator("div").first()).not.toHaveClass(/selected-node/);

	// ===== CORE SELECTION WORKFLOW =====

	test("Test 1: Basic Node Selection - should select node and open side panel when clicking node", async ({
		page,
	}) => {
		// Initial state: no selection, no panel
		await expect(page.getByTestId("side-panel")).not.toBeVisible();

		// Click on the first node
		const firstNode = page.locator(".react-flow__node").first();
		await firstNode.click();

		// Verify node is selected (has selection styling in the inner custom node)
		await expectNodeSelected(firstNode);

		// Verify side panel opens
		const sidePanel = page.getByTestId("side-panel");
		await expect(sidePanel).toBeVisible();

		// Verify side panel displays node properties
		await expect(sidePanel.locator("h3")).toBeVisible();
		const nodeTitle = await sidePanel.locator("h3").textContent();
		expect(nodeTitle).toBeTruthy();

		// Verify properties are displayed
		await expect(
			sidePanel.locator('[data-testid^="property-"]').first(),
		).toBeVisible();
		const propertyCount = await sidePanel
			.locator('[data-testid^="property-"]')
			.count();
		expect(propertyCount).toBeGreaterThan(0);
	});

	test("Test 2: Background Click Deselection - should deselect node and close side panel when clicking background", async ({
		page,
	}) => {
		// First, click node to select and open side panel
		const firstNode = page.locator(".react-flow__node").first();
		await firstNode.click();

		// Verify initial selection state
		await expectNodeSelected(firstNode);
		await expect(page.getByTestId("side-panel")).toBeVisible();

		// Click on ReactFlow background (away from nodes)
		await page.locator(".react-flow").click({ position: { x: 100, y: 100 } });

		// Verify node is deselected
		await expectNodeNotSelected(firstNode);

		// Verify side panel closes
		await expect(page.getByTestId("side-panel")).not.toBeVisible();
	});

	test("Test 3: Manual Panel Close Deselection - should deselect node when manually closing side panel", async ({
		page,
	}) => {
		// Click node to select and open side panel
		const firstNode = page.locator(".react-flow__node").first();
		await firstNode.click();

		// Verify initial selection state
		await expectNodeSelected(firstNode);
		await expect(page.getByTestId("side-panel")).toBeVisible();

		// Close side panel manually via close button
		await page.getByTestId("close-side-panel").click();

		// Verify side panel closes
		await expect(page.getByTestId("side-panel")).not.toBeVisible();

		// Verify node is also deselected
		await expectNodeNotSelected(firstNode);
	});

	test("Test 4: Node Selection Switching - should switch selection when clicking different nodes", async ({
		page,
	}) => {
		const firstNode = page.locator(".react-flow__node").first();
		const secondNode = page.locator(".react-flow__node").nth(1);

		// Click first node
		await firstNode.click();
		await expectNodeSelected(firstNode);
		await expectNodeNotSelected(secondNode);
		await expect(page.getByTestId("side-panel")).toBeVisible();

		// Get first node's title for comparison
		const sidePanel = page.getByTestId("side-panel");
		const firstNodeTitle = await sidePanel.locator("h3").textContent();

		// Click second node
		await secondNode.click();

		// Verify selection switched
		await expectNodeNotSelected(firstNode);
		await expectNodeSelected(secondNode);

		// Verify side panel remains open but content updates
		await expect(sidePanel).toBeVisible();
		const secondNodeTitle = await sidePanel.locator("h3").textContent();

		// Content should be different (either title or properties)
		const titleChanged = firstNodeTitle !== secondNodeTitle;
		expect(titleChanged).toBe(true);
	});

	// ===== SIDE PANEL BEHAVIOR AND CONTENT =====

	test("Test 5: Side Panel Transitions and Properties - should display correct node properties and handle transitions", async ({
		page,
	}) => {
		// Click node to open panel
		await page.locator(".react-flow__node").first().click();

		// Verify side panel has transition classes
		const sidePanel = page.getByTestId("side-panel");
		await expect(sidePanel).toHaveClass(/transition-transform/);
		await expect(sidePanel).toBeVisible();

		// Verify content structure
		await expect(sidePanel.locator("h3")).toBeVisible();
		await expect(
			sidePanel.locator('[data-testid^="property-"]').first(),
		).toBeVisible();

		// Switch to another node - panel should remain visible with updated content
		await page.locator(".react-flow__node").nth(1).click();
		await expect(sidePanel).toBeVisible();
		await expect(sidePanel).toHaveClass(/transition-transform/);
	});

	test("Test 6: Keyboard Navigation - should support keyboard navigation for side panel", async ({
		page,
	}) => {
		// Click on a node first to open side panel
		await page.locator(".react-flow__node").first().click();
		await expect(page.getByTestId("side-panel")).toBeVisible();

		// Verify node is selected
		const selectedNode = page.locator(".react-flow__node").first();
		await expectNodeSelected(selectedNode);

		// Focus on the close button and press Enter
		await page.getByTestId("close-side-panel").focus();
		await page.keyboard.press("Enter");

		// Verify both panel closes and node is deselected
		await expect(page.getByTestId("side-panel")).not.toBeVisible();
		await expectNodeNotSelected(selectedNode);
	});

	test("Test 7: Graph Regeneration Selection Reset - should lose selection state after graph regeneration", async ({
		page,
	}) => {
		// Click on a node to select and open side panel
		const initialNode = page.locator(".react-flow__node").first();
		await initialNode.click();
		await expectNodeSelected(initialNode);
		await expect(page.getByTestId("side-panel")).toBeVisible();

		// Click generate graph button
		await page.click('button:has-text("Generate Graph")');

		// Wait for new nodes to be rendered
		await page.waitForTimeout(1500);
		await expect(page.locator(".react-flow__node").first()).toBeVisible();

		// Side panel should be closed after graph regeneration (selection lost)
		await expect(page.getByTestId("side-panel")).not.toBeVisible();

		// All nodes should be unselected after regeneration
		const nodeCount = await page.locator(".react-flow__node").count();
		for (let i = 0; i < nodeCount; i++) {
			const node = page.locator(".react-flow__node").nth(i);
			await expectNodeNotSelected(node);
		}

		// Verify selection functionality still works with new graph
		const newFirstNode = page.locator(".react-flow__node").first();
		await newFirstNode.click();
		await expectNodeSelected(newFirstNode);
		await expect(page.getByTestId("side-panel")).toBeVisible();
	});
});
