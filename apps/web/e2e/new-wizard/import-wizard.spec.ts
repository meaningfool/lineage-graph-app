import * as path from "node:path";
import { expect, test } from "@playwright/test";
import { NewWizardPage } from "../pages/NewWizardPage";

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
			"../fixtures",
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
		await wizardPage.verifyDropzoneEmpty("dropzone-nodes", "malformed.csv");
		await wizardPage.verifyDropzoneEmpty("dropzone-edges", "malformed.csv");
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
			"../fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		await wizardPage.uploadNodeFile(nodesPath);

		// 3. Upload Edges file
		const edgesPath = path.join(
			__dirname,
			"../fixtures",
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
			"../fixtures",
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
			"../fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures",
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
			"../fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures",
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
		await wizardPage.verifyDropzoneEmpty(
			"dropzone-nodes",
			"nodes_valid_basic.csv",
		);
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
			"../fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures",
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
			"../fixtures",
			"shared",
			"nodes_valid_basic.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures",
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
});
