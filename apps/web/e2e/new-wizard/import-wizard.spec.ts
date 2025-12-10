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
			"Failed to read file(s): malformed.csv, malformed.csv",
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
