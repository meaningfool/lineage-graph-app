import { expect, test } from "@playwright/test";
import targetLineageData from "../src/data/target-lineage.json";

test.describe("Smoke Test - Lineage Graph", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for the app to load completely
		await page.waitForLoadState("networkidle");
		// Wait for nodes to be rendered
		await expect(page.locator(".react-flow__node").first()).toBeVisible({
			timeout: 10000,
		});
	});

	test("should load app with main elements and default graph", async ({
		page,
	}) => {
		// Check that the ReactFlow canvas is present
		await expect(page.locator(".react-flow")).toBeVisible();

		// Verify we have the correct number of nodes based on source data
		await expect(page.locator(".react-flow__node")).toHaveCount(
			targetLineageData.nodes.length,
		);
	});

	test("should render nodes from target-lineage.json data", async ({
		page,
	}) => {
		// Test that specific nodes from the default data are present using actual data
		const expectedNodeLabels = targetLineageData.nodes.map(
			(node) => node.label,
		);

		for (const nodeLabel of expectedNodeLabels) {
			// Look for node content that matches the expected labels
			// Using first() to avoid strict mode violation if multiple elements match (though they shouldn't)
			await expect(
				page.locator(".react-flow__node", { hasText: nodeLabel }).first(),
			).toBeVisible({ timeout: 10000 });
		}
	});

	test("should display correct edge count from data", async ({ page }) => {
		// Wait for edges to be rendered - use a longer timeout and wait for DOM element presence
		await page.waitForTimeout(2000); // Give ReactFlow time to render edges
		const edgeElements = page.locator(".react-flow__edge");
		await expect(edgeElements).toHaveCount(4, { timeout: 15000 });
	});
});
