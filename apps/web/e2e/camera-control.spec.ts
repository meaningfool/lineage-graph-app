import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

// Slice 8: Cleanup - Removed Strategy Loop
const strategy = "new";

test.describe("Camera Control", () => {
	let lineagePage: LineagePage;

	test.beforeEach(async ({ page }) => {
		lineagePage = new LineagePage(page);
		await lineagePage.goto();
	});

	test("initial_fit_view", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"fixtures/camera-control/outliers/nodes.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures/camera-control/outliers/edges.csv",
		);

		await lineagePage.importGraph(nodesPath, edgesPath);

		// Verify outlier is visible immediately (implies Fit View worked)
		const outlier = lineagePage.getGraphNodeById("OutlierNode");
		await expect(outlier).toBeVisible();

		// Check scale is < 1 (zoomed out to fit)
		const viewport = await page.evaluate(() => {
			const transform = document.querySelector(".react-flow__viewport");
			// @ts-ignore
			return transform ? transform.style.transform : "";
		});
		// Crude check for scale < 1 or just check existence
		// Better: check that both MainCluster and Outlier are in viewport
		const main = lineagePage.getGraphNodeById("MainCluster");
		await expect(main).toBeInViewport();
		await expect(outlier).toBeInViewport();
	});

	test("reimport_resets_view", async ({ page }) => {
		// 1. Import Small Graph
		const nodesSmall = path.join(
			__dirname,
			"fixtures/shared/nodes_valid_basic.csv",
		);
		const edgesSmall = path.join(
			__dirname,
			"fixtures/shared/edges_valid_basic.csv",
		);
		await lineagePage.importGraph(nodesSmall, edgesSmall);
		await expect(lineagePage.getGraphNodeById("node-1")).toBeInViewport();

		// 2. Pan/Zoom manually? (Hard to robustly test without specific helpers)
		// Instead, Import DIFFERENT graph (Outliers)
		const nodesOutlier = path.join(
			__dirname,
			"fixtures/camera-control/outliers/nodes.csv",
		);
		const edgesOutlier = path.join(
			__dirname,
			"fixtures/camera-control/outliers/edges.csv",
		);

		await lineagePage.importGraph(nodesOutlier, edgesOutlier);

		// 3. Verify View Reset (Outlier visible)
		// If view wasn't reset, we might be zoomed in on old coords
		await expect(lineagePage.getGraphNodeById("OutlierNode")).toBeInViewport();
	});

	test("click_error_centers_node (Slice 3)", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"fixtures/camera-control/connectivity_error/nodes.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures/camera-control/connectivity_error/edges.csv",
		);

		await lineagePage.importGraph(nodesPath, edgesPath);

		// Open Error Panel
		await lineagePage.openErrorPanel();
		await lineagePage.verifyErrorItemCount(1);

		// Click Error Item ("Isolated Node" - Title)
		await lineagePage.clickErrorItem("Isolated Node");
		await page.waitForTimeout(1000); // Wait for transition

		// Verify Node Centered (roughly)
		// We can check if it is in viewport and maybe check transform if we want precision
		const node = lineagePage.getGraphNodeById("IsolatedNode");
		await expect(node).toBeInViewport();

		// Check selected state (Slice 3 req)
		await lineagePage.verifyNodeSelected("IsolatedNode");
	});

	test("click_cycle_error_fits_cycle (Slice 6 Spec 10)", async ({ page }) => {
		const nodesPath = path.join(
			__dirname,
			"fixtures/graph-validation/nodes_cycle.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures/graph-validation/edges_cycle.csv",
		);

		await lineagePage.importGraph(nodesPath, edgesPath);

		await lineagePage.openErrorPanel();

		// Click Cycle Error
		// Note: Text might contain IDs. "Cycle detected: A -> B -> C"
		await lineagePage.clickErrorItem("Cycle detected");
		await page.waitForTimeout(1000);

		// Verify all cycle nodes are in viewport
		await expect(lineagePage.getGraphNodeById("A")).toBeInViewport();
		await expect(lineagePage.getGraphNodeById("B")).toBeInViewport();
		await expect(lineagePage.getGraphNodeById("C")).toBeInViewport();
	});

	test("click_cycle_error_flashes_edges (Slice 6 Spec 10)", async ({
		page,
	}) => {
		const nodesPath = path.join(
			__dirname,
			"fixtures/graph-validation/nodes_cycle.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"fixtures/graph-validation/edges_cycle.csv",
		);

		await lineagePage.importGraph(nodesPath, edgesPath);
		await lineagePage.openErrorPanel();

		/*
					Note: We need to verify that CSS animation class is applied to the Edge.
					This requires the Edge component to have `animate-flash-stroke` class or similar
					when state.flashedEdgeIds includes it.
				*/

		await lineagePage.clickErrorItem("Cycle detected");

		// Check for presence of at least one edge with flash class
		// Assuming implementation adds a class to the path or g
		await lineagePage.verifyEdgeHasPulse();
	});
});
