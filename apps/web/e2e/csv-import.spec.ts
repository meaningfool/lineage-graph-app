import path from "node:path";
import { expect, test } from "@playwright/test";
import { LineagePage } from "./pages/LineagePage";

test.describe("CSV Import Feature", () => {
	test.beforeEach(async ({ page }) => {
		const lineagePage = new LineagePage(page);
		await lineagePage.goto();
	});

	// ========== 1. HAPPY PATH (The "Golden Flow") ==========
	test.describe("Happy Path", () => {
		test("should import nodes and edges with mapped fields", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);

			// 1. Open Modal
			await lineagePage.openImportModal();

			// 2. Upload Files
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_valid_custom_headers.csv",
			);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadFiles(nodesPath, edgesPath);

			// 3. Click Next
			await lineagePage.submitUpload();

			// 4. Map columns
			await lineagePage.mapColumns({
				id: "node_id",
				title: "name",
				type: "node_type",
				source: "source",
				target: "target",
			});

			// 5. Click Next to import
			await lineagePage.submitMapping();

			// 6. Verify Success
			await lineagePage.verifyImportSuccess();

			// 7. Close modal
			await lineagePage.closeImportModal();

			// 8. Verify nodes are displayed on graph
			await lineagePage.verifyGraphNode("First Node");
			await lineagePage.verifyGraphNode("Second Node");
			// Verify edge
			await lineagePage.verifyGraphEdgeCount(1);
		});

		test("should allow uploading an edges file along with nodes", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			// 1. Click "Import CSV" button
			await lineagePage.openImportModal();

			// 2. Upload Nodes file
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);

			// 3. Upload Edges file
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);

			// Verify files are recognized
			await lineagePage.verifyDropzoneContent(
				"dropzone-nodes",
				"nodes_valid_basic.csv",
			);
			await lineagePage.verifyDropzoneContent(
				"dropzone-edges",
				"edges_valid_basic.csv",
			);

			// 4. Click Next
			await lineagePage.verifyNextButtonEnabled();
			await lineagePage.clickNext();

			// 5. Complete Mapping Step
			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();
			await lineagePage.verifyImportSuccess();
			await lineagePage.closeImportModal();

			// 6. Verify Nodes are displayed
			await lineagePage.verifyGraphNode("First Node");
			await lineagePage.verifyGraphNode("Second Node");

			// 7. Verify Edges are displayed
			await lineagePage.verifyGraphEdgeCount(1);
		});
	});

	// ========== 2. WORKFLOW & STATE ==========
	test.describe("Workflow & State", () => {
		test("should reset wizard state when modal is closed and reopened", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			// 1. Open Modal
			await lineagePage.openImportModal();

			// 2. Upload BOTH files (Required to enable Next)
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);

			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);

			// 3. Go to Mapping Step
			await lineagePage.verifyNextButtonEnabled();
			await lineagePage.clickNext();
			await lineagePage.verifyMappingStep();

			// 4. Close Modal (Cancel)
			await lineagePage.cancelImport();
			await lineagePage.verifyDialogVisible(false);

			// 5. Reopen Modal
			await lineagePage.openImportModal();

			// 6. Verify we are back at Step 1 (Upload)
			await lineagePage.verifyUploadStepVisible();
			await lineagePage.verifyMappingStep().catch(() => {}); // Should fail or we check not visible
			await expect(page.getByText("Nodes", { exact: true })).not.toBeVisible();

			// 7. Verify Next button is disabled (files cleared)
			await lineagePage.verifyNextButtonDisabled();
		});

		test("should show error for malformed CSV", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			// 1. Open Modal
			await lineagePage.openImportModal();

			// 2. Upload malformed file as Nodes
			const malformedPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"malformed.csv",
			);
			await lineagePage.uploadNodeFile(malformedPath);

			// 3. Upload malformed file as Edges
			await lineagePage.uploadEdgeFile(malformedPath);

			// 4. Click Next
			await lineagePage.verifyNextButtonEnabled();
			await lineagePage.clickNext();

			// 5. Verify Error Message contains both errors
			await lineagePage.verifyDialogText(
				"Failed to read file(s): malformed.csv, malformed.csv",
			);

			// 6. Verify BOTH dropzones are cleared
			await lineagePage.verifyDropzoneEmpty("dropzone-nodes", "malformed.csv");
			await lineagePage.verifyDropzoneEmpty("dropzone-edges", "malformed.csv");
		});

		test("should reset wizard after successful import", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			// 1. Perform a successful import
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);

			await lineagePage.clickNext();
			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			// 2. Verify Success Step
			await lineagePage.verifyImportSuccess();

			// 3. Close via the "Close" button in the Results step
			await lineagePage.closeImportModal();
			await lineagePage.verifyDialogVisible(false);

			// 4. Re-open Modal
			await lineagePage.openImportModal();

			// 5. Verify we are back at Upload step
			await lineagePage.verifyUploadStepVisible();
			await lineagePage.verifyDropzoneContent("dropzone-nodes", "Drag & drop"); // Or just check it exists
		});

		test("should replace graph on second import", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			// 1. First Import (Graph A)
			await lineagePage.openImportModal();
			const nodesAPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			); // 2 nodes
			await lineagePage.uploadNodeFile(nodesAPath);
			const edgesAPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesAPath);

			await lineagePage.clickNext();
			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();
			await lineagePage.closeImportModal();

			// Verify Graph A (First Node)
			await lineagePage.verifyGraphNode("First Node");

			// 2. Second Import (Graph B)
			await lineagePage.openImportModal();
			const nodesBPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_second_import.csv",
			); // "Third Node", "Fourth Node"
			await lineagePage.uploadNodeFile(nodesBPath);

			// Upload dummy edges for B (Required)
			await lineagePage.uploadEdgeFile(edgesAPath);

			await lineagePage.clickNext();

			// Map columns for B
			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			// Close
			await lineagePage.closeImportModal();

			// 3. Verify Graph B is present
			await lineagePage.verifyGraphNode("Third Node");
			await lineagePage.verifyGraphNode("Fourth Node");

			// 4. Verify Graph A is GONE
			await lineagePage.verifyGraphNodeMissing("First Node");
		});
	});

	// ========== 3. COLUMN MAPPING LOGIC ==========
	test.describe("Column Mapping Logic", () => {
		test("should show mapping step with ID, Title, and Type dropdowns", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const fixturePath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_valid_custom_headers.csv",
			);
			await lineagePage.uploadNodeFile(fixturePath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.verifyDialogText("Nodes");

			// Verify ID dropdown options
			await lineagePage.openColumnDropdown("id");
			await lineagePage.verifyDropdownOption("node_id");
			await lineagePage.closeDropdown();

			// Verify Title dropdown options
			await lineagePage.openColumnDropdown("title");
			await lineagePage.verifyDropdownOption("name");
			await lineagePage.closeDropdown();

			// Verify Type dropdown options
			await lineagePage.openColumnDropdown("type");
			await lineagePage.verifyDropdownOption("node_type");
			await lineagePage.closeDropdown();
		});

		test("should validate mapping requirements", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const fixturePath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_valid_custom_headers.csv",
			);
			await lineagePage.uploadNodeFile(fixturePath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.verifyNextButtonDisabled();

			await lineagePage.openColumnDropdown("id");
			await lineagePage.verifyDropdownOption("node_id");
			await page.getByRole("option", { name: "node_id" }).click(); // Helper needed?
			await lineagePage.verifyNextButtonDisabled();

			await lineagePage.openColumnDropdown("title");
			await page.getByRole("option", { name: "name" }).click();
			await lineagePage.verifyNextButtonDisabled();

			await lineagePage.openColumnDropdown("type");
			await page.getByRole("option", { name: "node_type" }).click();
			await lineagePage.verifyNextButtonDisabled();

			await lineagePage.openColumnDropdown("source");
			await page.getByRole("option", { name: "source" }).click();

			await lineagePage.openColumnDropdown("target");
			await page.getByRole("option", { name: "target" }).click();
			await lineagePage.verifyNextButtonEnabled();
		});
	});

	// ========== 4. NODE VALIDATION ==========
	test.describe.skip("Node Validation", () => {
		test("should drop nodes with invalid types and show summary", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const fixturePath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_invalid_bad_type.csv",
			);
			await lineagePage.uploadNodeFile(fixturePath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyDialogText("1 node dropped");
			await lineagePage.verifyDialogText("node-2: Invalid type");

			// Verify import success for valid node
			await lineagePage.closeImportModal();
			await lineagePage.verifyGraphNodeCount(1);
		});

		test("should deduplicate nodes with duplicate IDs and show warning", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const fixturePath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_invalid_duplicate_ids.csv",
			);
			await lineagePage.uploadNodeFile(fixturePath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyDialogText("1 node dropped");
			await lineagePage.verifyDialogText("node-1: Duplicate Node ID");

			await lineagePage.closeImportModal();
			await lineagePage.verifyGraphNodeCount(2);
		});

		test("should limit warning messages to 10", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_stress_many_warnings.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"edges_valid_basic.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyDialogText("12 nodes dropped");
			await lineagePage.verifyWarningCount(11); // 10 warnings + 1 "more" message
			await lineagePage.verifyDialogText("more warnings");
		});
	});

	// ========== 5. EDGE VALIDATION ==========
	test.describe.skip("Edge Validation", () => {
		test("should reject edges pointing to missing nodes", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"edges_invalid_missing_source.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyDialogText(
				"Edge dropped: Source 'missing-id' not found",
			);
		});

		test("should reject edges pointing to missing target node", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"edges_invalid_missing_target.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyDialogText(
				"Edge dropped: Target 'missing-target-id' not found",
			);
		});

		test("should reject edges pointing to nodes dropped due to validation errors", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"nodes_invalid_bad_type.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"edges_invalid_orphaned.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyDialogText("1 node dropped");
			await lineagePage.verifyDialogText("1 edge dropped");
			await lineagePage.verifyDialogText(
				"Edge dropped: Target 'node-2' not found",
			);
		});

		test("should import edges with only source and target columns", async ({
			page,
		}) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"edges_valid_no_id_column.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyImportSuccess();
			await lineagePage.verifyGraphEdgeCount(1);
		});

		test("should silently deduplicate parallel edges", async ({ page }) => {
			const lineagePage = new LineagePage(page);
			await lineagePage.openImportModal();
			const nodesPath = path.join(
				__dirname,
				"fixtures",
				"shared",
				"nodes_valid_basic.csv",
			);
			await lineagePage.uploadNodeFile(nodesPath);
			const edgesPath = path.join(
				__dirname,
				"fixtures",
				"csv-import",
				"edges_valid_duplicates.csv",
			);
			await lineagePage.uploadEdgeFile(edgesPath);
			await lineagePage.clickNext();

			await lineagePage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
				source: "source",
				target: "target",
			});
			await lineagePage.submitMapping();

			await lineagePage.verifyImportSuccess();
			await lineagePage.verifyDialogDoesNotContainText("dropped");
			await lineagePage.verifyGraphEdgeCount(1);
		});
	});
});
