import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

test.describe("Camera Control", () => {
	let lineagePage: LineagePage;

	test.beforeEach(async ({ page }) => {
		lineagePage = new LineagePage(page);
		await lineagePage.goto();
	});

	// Slice 1: Initial Load
	test("load_fits_outliers", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"fixtures/camera-control/wide_cluster/nodes.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures/camera-control/wide_cluster/edges.csv",
		);

		await lineagePage.importGraph(nodesPath, edgesPath);

		// Assert A, B, C, D are all in viewport
		const nodes = ["A", "B", "C", "D"];
		for (const id of nodes) {
			// Use data-id on the wrapper and test-id on content
			const node = page
				.locator(`.react-flow__node[data-id="${id}"]`)
				.getByTestId("custom-node-content");
			await expect(node).toBeVisible();
			await expect(node).toBeInViewport();
		}

		// Assert Zoom Level (Slice 1 requirement)
		// The viewport is applied to the class .react-flow__viewport
		const viewport = page.locator(".react-flow__viewport");
		await expect(viewport).toHaveAttribute("style", /transform/);
		const style = await viewport.getAttribute("style");
		const match = style?.match(/scale\(([\d.]+)\)/);
		const scale = match ? Number.parseFloat(match[1]) : 1;

		// With 4 nodes spread over ~2000px and a window of ~1000px, scale should be < 0.6
		expect(scale).toBeLessThan(0.6);
	});

	test("reload_resets_view", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"fixtures/camera-control/wide_cluster/nodes.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures/camera-control/wide_cluster/edges.csv",
		);

		// 1. Initial Import
		await lineagePage.importGraph(nodesPath, edgesPath);

		// 2. Pan away (Manual Interaction)
		// We drag the canvas (pane) to move nodes out of view
		// The pane usually has class 'react-flow__pane'
		const pane = page.locator(".react-flow__pane");
		const box = await pane.boundingBox();
		if (!box) throw new Error("Canvas pane not found");

		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(
			box.x + box.width / 2 + 500,
			box.y + box.height / 2 + 500,
			{ steps: 5 },
		);
		await page.mouse.up();

		// Verify at least one node is OUT of viewport (optional, but good for robust test)
		// Actually, simply reloading and verifying they are BACK is enough.

		// 3. Reload (Re-import the same file to trigger 'new graph' logic)
		await page.reload();
		await lineagePage.importGraph(nodesPath, edgesPath);

		// 4. Assert Reset
		const nodes = ["A", "B", "C", "D"];
		for (const id of nodes) {
			const node = page
				.locator(`.react-flow__node[data-id="${id}"]`)
				.getByTestId("custom-node-content");
			await expect(node).toBeInViewport();
		}
	});

	test("click_connectivity_error_centers_node", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.goto();
		// Setup: Import wide_cluster (X->A->...->H)
		// A is an INPUT node but has incoming edge from X (STEP).
		// This triggers "Input node must have at least one outgoing connection and no incoming connections" (or similar).
		await lineagePage.importGraph(
			"e2e/fixtures/camera-control/wide_cluster/nodes.csv",
			"e2e/fixtures/camera-control/wide_cluster/edges.csv",
		);

		// Open Error Panel
		await lineagePage.openErrorPanel();

		// 1. Click the error for Node A
		// We find the error item related to A.
		await lineagePage.clickErrorItem("Input node must have");

		// 2. Assert Node A is centered
		// Tolerance: Distance from viewport center to node center < 50px
		const nodeA = page.locator('.react-flow__node[data-id="A"]');
		await expect(nodeA).toBeInViewport();

		// Wait for camera animation (800ms) to complete
		await page.waitForTimeout(1000);

		const nodeBox = await nodeA.boundingBox();
		const viewportSize = await page.viewportSize();

		if (!nodeBox || !viewportSize) throw new Error("Viewport or Node invalid");

		const viewCenterX = viewportSize.width / 2;
		const viewCenterY = viewportSize.height / 2;
		const nodeCenterX = nodeBox.x + nodeBox.width / 2;
		const nodeCenterY = nodeBox.y + nodeBox.height / 2;

		const distance = Math.sqrt(
			(viewCenterX - nodeCenterX) ** 2 + (viewCenterY - nodeCenterY) ** 2,
		);

		// It should be centered
		expect(distance).toBeLessThan(50);

		// 3. Assert Zoom Level is close enough (>= 1.0)
		// Load default was ~0.45. Center/Focus usually zooms to 1.0 or 1.2
		const viewport = page.locator(".react-flow__viewport");
		const style = await viewport.getAttribute("style");
		const scaleMatch = style?.match(/scale\(([\d.]+)\)/);
		const scale = scaleMatch ? Number.parseFloat(scaleMatch[1]) : 0;

		expect(scale).toBeGreaterThanOrEqual(1.0);
	});

	test("click_cycle_error_fits_cycle_component", async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.goto();
		// Setup: Import cycle_distanced
		// A-B-C-D (Cycle), E (Outlier)
		await lineagePage.importGraph(
			"e2e/fixtures/camera-control/cycle_distanced/nodes.csv",
			"e2e/fixtures/camera-control/cycle_distanced/edges.csv",
		);

		// Initial fit includes E (outlier), so scale should be small

		// Open Error Panel
		await lineagePage.openErrorPanel();

		// Mess up the view: Pan away so A,B,C,D are NOT in viewport
		// Simulate dragging from center to bottom-right
		await page.mouse.move(500, 500);
		await page.mouse.down();
		await page.mouse.move(0, 0, { steps: 50 }); // Drag 500px up-left
		await page.mouse.up();

		// Assert A is NOT in viewport (or at least check we moved)
		// Actually, let's just assert that after click, they ARE in viewport and centered.
		// If we didn't implement the logic, clicking would leave them out of view.

		// 1. Click "Cycle Detected" error
		await lineagePage.clickErrorItem("Cycle detected");

		// Wait for animation
		await page.waitForTimeout(1000);

		// 2. Assert Cycle Nodes (A,B,C,D) are in viewport
		for (const id of ["A", "B", "C", "D"]) {
			await expect(
				page.locator(`.react-flow__node[data-id="${id}"]`),
			).toBeInViewport();
		}

		// 3. Assert Outlier E is NOT in viewport (or at least strictly zoomed in on the cycle)
		// Actually, if E is very far, it shouldn't be visible if we fit A-B-C-D.
		// Or we can check Scale.
		// Scale(Cycle) should be > Scale(Load)

		const viewport = page.locator(".react-flow__viewport");
		const style = await viewport.getAttribute("style");
		const scaleMatch = style?.match(/scale\(([\d.]+)\)/);
		const cycleScale = scaleMatch ? Number.parseFloat(scaleMatch[1]) : 0;

		expect(cycleScale).toBeGreaterThan(0.8); // Assuming cycle is compact
	});
});

test("click_cycle_error_flashes_all_edges", async ({ page }) => {
	const lineagePage = new LineagePage(page);
	await lineagePage.goto();

	// Setup: Import cycle_distanced
	// A->B (e1), B->C (e2), C->D (e3), D->A (e4)
	await lineagePage.importGraph(
		"e2e/fixtures/camera-control/cycle_distanced/nodes.csv",
		"e2e/fixtures/camera-control/cycle_distanced/edges.csv",
	);

	await lineagePage.openErrorPanel();
	await lineagePage.clickErrorItem("Cycle detected");

	// Wait for animation/reaction (flash starts immediately on click)
	// Check ALL 4 edges have the flash class

	// Check ALL 4 edges have the flash class
	// Note: The app generates IDs as `e-${source}-${target}`
	const edgesToCheck = [
		{ source: "A", target: "B" },
		{ source: "B", target: "C" },
		{ source: "C", target: "D" },
		{ source: "D", target: "A" },
	];

	for (const { source, target } of edgesToCheck) {
		const id = `e-${source}-${target}`;
		// We need to find the specific edge path.
		// Usually .react-flow__edge[data-id="e1"] path.animate-flash-stroke

		// Check if the edge element exists
		// Note: we added data-id to the inner <g>
		const edge = page.locator(`.react-flow__edge [data-id="${id}"]`);
		await expect(edge).toBeAttached();

		// Check if it has the flash class (usually on the path, or the g?)
		// Based on LineagePage.ts: .react-flow__edge path.animate-flash-stroke
		// Ideally: edge.locator('path.animate-flash-stroke')
		const flashPath = edge.locator("path.animate-flash-stroke");
		await expect(flashPath).toBeAttached();
		await expect(flashPath).toHaveClass(/animate-flash-stroke/);
	}
});
