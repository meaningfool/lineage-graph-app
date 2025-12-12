import * as path from "node:path";
import { expect, test } from "@playwright/test";
import { NewWizardPage } from "./pages/NewWizardPage";

test.describe("New Import Wizard - Slice 1: Upload & File Validation", () => {
	test.beforeEach(async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.goto();
	});

	test("should show error for malformed CSV", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		// 1. Open Modal
		await wizardPage.openImportModal();

		// 2. Upload malformed file as Nodes
		const malformedPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"malformed.csv",
		);
		await wizardPage.uploadNodeFile(malformedPath);

		// 3. Upload malformed file as Edges
		await wizardPage.uploadEdgeFile(malformedPath);

		// 4. Click Next
		await wizardPage.verifyNextButtonEnabled();
		await wizardPage.clickNext();

		// 5. Verify Error Message contains both errors
		await wizardPage.verifyDialogText(
			"Failed to read Nodes file (malformed.csv) and Edges file (malformed.csv)",
		);

		// 6. Verify BOTH dropzones are cleared
		await wizardPage.verifyDropzoneEmpty("dropzone-nodes");
		await wizardPage.verifyDropzoneEmpty("dropzone-edges");
	});

	test("should allow uploading an edges file along with nodes", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		// 1. Click "Import CSV" button
		await wizardPage.openImportModal();

		// 2. Upload Nodes file
		const nodesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);

		// 3. Upload Edges file
		const edgesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"edges_valid_basic.csv",
		);
		await wizardPage.uploadEdgeFile(edgesPath);

		// Verify files are recognized
		await wizardPage.verifyDropzoneContent(
			"dropzone-nodes",
			"nodes_valid_basic.csv",
		);
		await wizardPage.verifyDropzoneContent(
			"dropzone-edges",
			"edges_valid_basic.csv",
		);

		// 4. Click Next
		await wizardPage.verifyNextButtonEnabled();
		await wizardPage.clickNext();

		// 5. Complete Mapping Step (Just to ensure we moved past upload)
		// NOTE: In this slice we only care about getting past the upload step with valid files
		await wizardPage.verifyMappingStep();
	});

	test("should disable next button if only nodes uploaded", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);

		await wizardPage.verifyDropzoneContent(
			"dropzone-nodes",
			"nodes_valid_basic.csv",
		);
		await wizardPage.verifyNextButtonDisabled();
	});
});

test.describe("New Import Wizard - Slice 2: Node Mapping & Reset", () => {
	test.beforeEach(async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.goto();
	});

	test("should populate dropdowns with exact CSV headers", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// Upload valid files
		const nodesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"edges_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);
		await wizardPage.uploadEdgeFile(edgesPath);
		await wizardPage.clickNext();

		// Verify dropdown options for 'id' field
		// The fixture headers are: id,title,type
		const expectedHeaders = ["id", "title", "type"];
		const options = await wizardPage.getDropdownOptions("title"); // We changed ID from 'label' to 'title'
		expect(options).toEqual(expectedHeaders);
	});

	test("should reset wizard state when modal is closed and reopened", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// 1. Upload files and go to mapping step
		const nodesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"edges_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);
		await wizardPage.uploadEdgeFile(edgesPath);
		await wizardPage.clickNext();

		// 2. Verify we are on mapping step
		await wizardPage.verifyMappingStep();

		// 3. Close modal
		await wizardPage.closeImportModal();

		// 4. Reopen modal
		await wizardPage.openImportModal();

		// 5. Verify we are back at upload step (empty)
		await wizardPage.verifyDropzoneEmpty("dropzone-nodes");
	});
});

test.describe("New Import Wizard - Slice 3: Edge Mapping", () => {
	test.beforeEach(async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.goto();
	});

	test("should validate edge mapping requirements", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// Upload valid files
		const nodesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"edges_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);
		await wizardPage.uploadEdgeFile(edgesPath);
		await wizardPage.clickNext();

		// Map Nodes
		await wizardPage.mapColumn("id", "id");
		await wizardPage.mapColumn("title", "title");
		await wizardPage.mapColumn("type", "type");
		await wizardPage.clickNext(); // Should go to Edge Mapping

		// Now we should be on Edge Mapping step
		await expect(page.getByText("Map Edges", { exact: true })).toBeVisible();

		// Next should be disabled initially
		await wizardPage.verifyNextButtonDisabled();

		// Map Source
		await wizardPage.mapColumn("source", "source");
		await wizardPage.verifyNextButtonDisabled();

		// Map Target
		await wizardPage.mapColumn("target", "target");
		await wizardPage.verifyNextButtonEnabled();
	});

	test("should disable selected source column in target dropdown", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// Upload valid files
		const nodesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures",
			"shared",
			"edges_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);
		await wizardPage.uploadEdgeFile(edgesPath);
		await wizardPage.clickNext();

		// Map Nodes & Proceed
		await wizardPage.mapColumn("id", "id");
		await wizardPage.mapColumn("title", "title");
		await wizardPage.mapColumn("type", "type");
		await wizardPage.clickNext();

		// Select 'source' in Source dropdown
		await wizardPage.openColumnDropdown("source");
		await page.getByRole("option", { name: "source" }).click();

		// Verify 'source' is disabled in Target dropdown
		await wizardPage.openColumnDropdown("target");
		const sourceOption = page
			.getByRole("option", { name: "source" })
			.and(page.locator('[aria-disabled="true"]'));
		await expect(sourceOption).toBeDisabled();
	});

	// ========== SLICE 4: HAPPY PATH INTEGRATION ==========
	test.describe("Slice 4: Happy Path Integration", () => {
		test("should import nodes and edges and render graph", async ({ page }) => {
			// This test covers the full "Happy Path" from Upload -> Mapping -> Success -> Graph
			const wizardPage = new NewWizardPage(page);
			await wizardPage.openImportModal();

			// 1. Upload
			const nodesPath = path.join(
				__dirname,
				"./fixtures/csv-import/nodes_valid_custom_headers.csv",
			);
			const edgesPath = path.join(
				__dirname,
				"./fixtures/shared/edges_valid_basic.csv",
			);
			await wizardPage.uploadFiles(nodesPath, edgesPath);
			await wizardPage.submitUpload();

			// 2. Map Nodes
			await wizardPage.mapColumns({
				id: "node_id",
				title: "name",
				type: "node_type",
			});
			await wizardPage.clickNext();

			// 3. Map Edges
			await wizardPage.mapColumns({
				source: "source",
				target: "target",
			});
			await wizardPage.clickNext(); // Should Trigger Generate Graph

			// 4. Verify Success Step
			// Using data-testid for robustness
			await expect(page.getByTestId("wizard-step-success")).toBeVisible({
				timeout: 5000,
			});
			await expect(page.getByText("Import successful")).toBeVisible();

			// 5. Close and Verify Graph
			await wizardPage.finishImport();
			await wizardPage.verifyGraphNode("First Node");
			await wizardPage.verifyGraphNode("Second Node");
			await wizardPage.verifyGraphEdgeCount(1);
		});

		test("should replace existing graph on second import", async ({ page }) => {
			// Run full import flow twice.
			const wizardPage = new NewWizardPage(page);

			// --- Import 1 ---
			await wizardPage.openImportModal();
			await wizardPage.uploadFiles(
				path.join(__dirname, "./fixtures/shared/nodes_valid_basic.csv"),
				path.join(__dirname, "./fixtures/shared/edges_valid_basic.csv"),
			);
			await wizardPage.submitUpload();
			await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
			await wizardPage.clickNext();
			await wizardPage.mapColumns({ source: "source", target: "target" });
			await wizardPage.clickNext();
			await expect(page.getByTestId("wizard-step-success")).toBeVisible();
			await wizardPage.finishImport();

			await wizardPage.verifyGraphNode("First Node");

			// --- Import 2 (Different Data) ---
			await wizardPage.openImportModal();
			const nodesBPath = path.join(
				__dirname,
				"./fixtures/csv-import/nodes_second_import.csv",
			);
			const edgesAPath = path.join(
				__dirname,
				"./fixtures/shared/edges_valid_basic.csv",
			); // Dummy edges

			await wizardPage.uploadFiles(nodesBPath, edgesAPath);
			await wizardPage.submitUpload();

			// Map Nodes
			await wizardPage.mapColumns({
				id: "id",
				title: "title",
				type: "type",
			});
			await wizardPage.clickNext();

			// Map Edges
			await wizardPage.mapColumns({
				source: "source",
				target: "target",
			});
			await wizardPage.clickNext(); // Generate

			// Verify Success & Close
			await expect(page.getByTestId("wizard-step-success")).toBeVisible();
			await wizardPage.finishImport();

			// --- Verify Replacement ---
			// Graph B nodes ("Third Node") should be present
			await wizardPage.verifyGraphNode("Third Node");
			// Graph A nodes ("First Node") should be GONE
			await wizardPage.verifyGraphNodeMissing("First Node");
		});

		test("should reset wizard state after successful import and close", async ({
			page,
		}) => {
			const wizardPage = new NewWizardPage(page);
			// 1. Complete Import
			await wizardPage.openImportModal();
			await wizardPage.uploadFiles(
				path.join(__dirname, "./fixtures/shared/nodes_valid_basic.csv"),
				path.join(__dirname, "./fixtures/shared/edges_valid_basic.csv"),
			);
			await wizardPage.submitUpload();
			await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
			await wizardPage.clickNext();
			await wizardPage.mapColumns({ source: "source", target: "target" });
			await wizardPage.clickNext();
			await expect(page.getByTestId("wizard-step-success")).toBeVisible();
			await wizardPage.finishImport();
			await wizardPage.verifyDialogVisible(false);
			await page.waitForTimeout(500); // Ensure unmount/state clearance

			// 2. Re-open Modal
			await wizardPage.openImportModal();
			await wizardPage.verifyDialogFullyOpen();

			// 3. Verify Reset
			// Should be back at Upload step
			await wizardPage.verifyUploadStepVisible();
			// Dropzones should be empty
			await wizardPage.verifyDropzoneEmpty("dropzone-nodes");
		});

		test("should import edges with only source and target columns", async ({
			page,
		}) => {
			const wizardPage = new NewWizardPage(page);
			await wizardPage.openImportModal();

			const nodesPath = path.join(
				__dirname,
				"./fixtures/shared/nodes_valid_basic.csv",
			);
			const edgesPath = path.join(
				__dirname,
				"./fixtures/csv-import/edges_valid_no_id_column.csv",
			);
			await wizardPage.uploadFiles(nodesPath, edgesPath);
			await wizardPage.submitUpload();

			// Map Nodes
			await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
			await wizardPage.clickNext();

			// Map Edges
			await wizardPage.mapColumns({ source: "source", target: "target" });
			await wizardPage.clickNext();

			// Verify Success
			await expect(page.getByTestId("wizard-step-success")).toBeVisible();
			await wizardPage.finishImport();

			// Verify Edge loaded
			await wizardPage.verifyGraphEdgeCount(1);
		});
	});
});

test.describe("New Import Wizard - Slice 5: Domain Validation & Error Handling", () => {
	test.beforeEach(async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.goto();
	});

	test("should drop nodes with invalid types and show summary", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// 1. Upload
		const nodesPath = path.join(
			__dirname,
			"./fixtures/csv-import/nodes_invalid_bad_type.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/shared/edges_valid_basic.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		// 2. Map Nodes
		await wizardPage.mapColumns({
			id: "id",
			title: "title",
			type: "type",
		});
		await wizardPage.clickNext();

		// 3. Map Edges
		await wizardPage.mapColumns({
			source: "source",
			target: "target",
		});
		await wizardPage.clickNext(); // Should generate graph and show success

		// 4. Verify Warnings in Success Step
		await expect(page.getByTestId("wizard-step-success")).toBeVisible();

		// Expect warnings to be displayed
		await expect(page.getByText("1 node dropped")).toBeVisible();
		// Expect warnings section to be displayed
		await expect(page.getByText("Warnings during import:")).toBeVisible();
		// Ensure at least one warning item is present
		await expect(page.locator("ul li").first()).toBeVisible();

		// 5. Verify import success for valid node
		await wizardPage.finishImport();
		await wizardPage.verifyGraphNodeCount(1);
	});

	test("should deduplicate nodes with duplicate IDs and show warning", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// 1. Upload
		const nodesPath = path.join(
			__dirname,
			"./fixtures/csv-import/nodes_invalid_duplicate_ids.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/shared/edges_valid_basic.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		// 2. Map Nodes
		await wizardPage.mapColumns({
			id: "id",
			title: "title",
			type: "type",
		});
		await wizardPage.clickNext();

		// 3. Map Edges
		await wizardPage.mapColumns({
			source: "source",
			target: "target",
		});
		await wizardPage.clickNext();

		// 4. Verify Warnings
		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		await expect(page.getByText("1 node dropped")).toBeVisible();
		await expect(page.getByText("node-1: Duplicate Node ID")).toBeVisible();

		await wizardPage.finishImport();
		await wizardPage.verifyGraphNodeCount(2);
	});

	test("should limit warning messages to 10", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		// 1. Upload
		const nodesPath = path.join(
			__dirname,
			"./fixtures/csv-import/nodes_stress_many_warnings.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/shared/edges_valid_basic.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		// 2. Map Nodes
		await wizardPage.mapColumns({
			id: "id",
			title: "title",
			type: "type",
		});
		await wizardPage.clickNext();

		// 3. Map Edges
		await wizardPage.mapColumns({
			source: "source",
			target: "target",
		});
		await wizardPage.clickNext();

		// 4. Verify Warnings Limit
		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		await expect(page.getByText("12 nodes dropped")).toBeVisible();

		// Count warning items in the list (assuming a specific list item selector or text match)
		// Since we don't have the implementation yet, we'll look for the "more warnings" text
		await expect(page.getByText("more warnings")).toBeVisible();
	});

	test("should reject edges pointing to missing nodes", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"./fixtures/shared/nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/csv-import/edges_invalid_missing_source.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
		await wizardPage.clickNext();
		await wizardPage.mapColumns({ source: "source", target: "target" });
		await wizardPage.clickNext();

		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		await expect(
			page.getByText("Edge dropped: Source 'missing-id' not found"),
		).toBeVisible();
	});

	test("should reject edges pointing to missing target node", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"./fixtures/shared/nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/csv-import/edges_invalid_missing_target.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
		await wizardPage.clickNext();
		await wizardPage.mapColumns({ source: "source", target: "target" });
		await wizardPage.clickNext();

		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		await expect(
			page.getByText("Edge dropped: Target 'missing-target-id' not found"),
		).toBeVisible();
	});

	test("should reject edges pointing to nodes dropped due to validation errors", async ({
		page,
	}) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"./fixtures/csv-import/nodes_invalid_bad_type.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/csv-import/edges_invalid_orphaned.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
		await wizardPage.clickNext();
		await wizardPage.mapColumns({ source: "source", target: "target" });
		await wizardPage.clickNext();

		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		await expect(page.getByText("1 node dropped")).toBeVisible();
		await expect(page.getByText("1 edge dropped")).toBeVisible();
		await expect(
			page.getByText("Edge dropped: Target 'node-2' not found"),
		).toBeVisible();
	});

	test("should silently deduplicate parallel edges", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"./fixtures/shared/nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"./fixtures/csv-import/edges_valid_duplicates.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		await wizardPage.mapColumns({ id: "id", title: "title", type: "type" });
		await wizardPage.clickNext();
		await wizardPage.mapColumns({ source: "source", target: "target" });
		await wizardPage.clickNext();

		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		// Ensure NO drop warnings
		await expect(page.getByText("dropped")).not.toBeVisible();

		await wizardPage.finishImport();
		await wizardPage.verifyGraphEdgeCount(1);
	});
});
