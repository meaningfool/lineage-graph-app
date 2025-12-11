import path from "node:path";
import { expect, test } from "@playwright/test";
import { NewWizardPage } from "../pages/NewWizardPage";

test.describe("Node Properties (New Wizard)", () => {
	test.beforeEach(async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.goto();
	});

	test("should display properties pills in mapping step", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"../fixtures/node-properties/nodes_with_desc.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures/node-properties/edges_with_desc.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		// 2. Verify Properties Section
		await expect(page.getByText("Additional Properties")).toBeVisible();
		await expect(
			page.getByText("Select extra columns to import"),
		).toBeVisible();

		// 3. Verify Pills are present for unmapped columns
		// "description" is in the CSV but not auto-mapped to required fields
		// We expect a pill for it.
		// NOTE: Implementation must assign data-testid="property-pill-<columnName>"
		await expect(page.getByTestId("property-pill-description")).toBeVisible();
	});

	test("should map node properties using pills", async ({ page }) => {
		const wizardPage = new NewWizardPage(page);
		await wizardPage.openImportModal();

		const nodesPath = path.join(
			__dirname,
			"../fixtures/node-properties/nodes_with_desc.csv",
		);
		const edgesPath = path.join(
			__dirname,
			"../fixtures/node-properties/edges_with_desc.csv",
		);
		await wizardPage.uploadFiles(nodesPath, edgesPath);
		await wizardPage.submitUpload();

		// 2. Map Nodes & Select Property
		await wizardPage.mapColumns({
			id: "id",
			title: "title",
			type: "type",
		});

		// Click the pill
		await page.getByTestId("property-pill-description").click();

		// Verify selection state (e.g. check icon or class) - handled by component logic,
		// but E2E can verify visual feedback if needed.
		// For now, proceed to import.

		await wizardPage.clickNext();

		// 3. Map Edges
		await wizardPage.mapColumns({
			source: "source",
			target: "target",
		});
		await wizardPage.clickNext();

		// 4. Success
		await expect(page.getByTestId("wizard-step-success")).toBeVisible();
		await wizardPage.finishImport();

		// 5. Verify Graph Data
		// Open side panel for "User Table" (from fixtures) and check description
		await wizardPage.verifyGraphNodeCount(2);

		// Note: verifySidePanelContent needs to be available in NewWizardPage or we use manual steps
		// Re-using logic from legacy test:
		// The node "User Table" should have description "Core user table"
		// We'll click the node and check the panel.
		// Assuming clickNode works on the graph canvas.
		// We might need to implement `clickNode` in NewWizardPage if not present,
		// but for now let's assume usage of existing page methods or direct locator.
		// If NewWizardPage doesn't extend LineagePage, we might miss some helpers.
		// Let's check NewWizardPage content later, but write the test intent now.

		// Using page locator directly for graph node interaction if helper missing
		await page.getByText("User Table").first().click();
		await expect(page.getByText("Core user table")).toBeVisible();
	});
});
