import { expect, test } from "@playwright/test";

test.describe("Data Lineage App - Graph Controls Workflow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for the app to load completely
		await page.waitForLoadState("networkidle");
		// Wait for nodes to be rendered
		await expect(page.locator(".react-flow__node").first()).toBeVisible({
			timeout: 10000,
		});
	});

	test("should show all available edge type options", async ({ page }) => {
		const edgeSelect = page.locator("select#edge-type-select");

		// Check that all edge type options are available
		const options = await edgeSelect.locator("option").allTextContents();

		// Verify we have the expected edge type options
		expect(options).toContain("Bezier (Default)");
		expect(options).toContain("Straight");
		expect(options).toContain("Step");
		expect(options).toContain("Smooth Step");

		// Ensure we have more than one option (library evolution safety)
		expect(options.length).toBeGreaterThan(1);
	});

	test("should change edge type when dropdown selection changes", async ({
		page,
	}) => {
		const edgeSelect = page.locator("select#edge-type-select");

		// Get current selected value
		const initialValue = await edgeSelect.inputValue();

		// Get all available option values
		const optionValues = await edgeSelect
			.locator("option")
			.evaluateAll((options) =>
				options.map((option) => (option as HTMLOptionElement).value),
			);

		// Find a different option to switch to
		const differentValue = optionValues.find((value) => value !== initialValue);
		expect(differentValue).toBeDefined();

		// Change to different edge type
		await edgeSelect.selectOption(differentValue!);
		await expect(edgeSelect).toHaveValue(differentValue!);

		// Change back to initial value to verify switching works both ways
		await edgeSelect.selectOption(initialValue);
		await expect(edgeSelect).toHaveValue(initialValue);
	});

	test("should maintain graph stability after edge type changes", async ({
		page,
	}) => {
		// Capture initial graph data
		const initialNodeLabels = await page
			.locator(".react-flow__node")
			.allTextContents();
		const initialEdgeCount = await page.locator(".react-flow__edge").count();

		// Get edge type selector and find a different option
		const edgeSelect = page.locator("select#edge-type-select");
		const currentValue = await edgeSelect.inputValue();
		const optionValues = await edgeSelect
			.locator("option")
			.evaluateAll((options) =>
				options.map((option) => (option as HTMLOptionElement).value),
			);
		const differentValue = optionValues.find((value) => value !== currentValue);
		expect(differentValue).toBeDefined();

		// Change edge type
		await edgeSelect.selectOption(differentValue!);

		// Give ReactFlow time to re-render with new edge type
		await page.waitForTimeout(1000);

		// Capture graph data after edge type change
		const afterNodeLabels = await page
			.locator(".react-flow__node")
			.allTextContents();
		const afterEdgeCount = await page.locator(".react-flow__edge").count();

		// Verify graph data integrity - same nodes and edges, just different edge styling
		expect(afterNodeLabels).toEqual(initialNodeLabels);
		expect(afterEdgeCount).toBe(initialEdgeCount);

		// Ensure nodes are still visible after edge type change
		await expect(page.locator(".react-flow__node").first()).toBeVisible();
	});
});
