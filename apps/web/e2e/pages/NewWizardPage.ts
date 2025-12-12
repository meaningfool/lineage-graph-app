import * as fs from "node:fs";
import * as path from "node:path";
import { expect, type Page } from "@playwright/test";

export class NewWizardPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto("/");
		await this.page.waitForLoadState("networkidle");
	}

	async openImportModal() {
		await this.page.getByRole("button", { name: "Import CSV" }).click();
	}

	async uploadFiles(nodesPath: string, edgesPath: string) {
		await this.uploadNodeFile(nodesPath);
		await this.uploadEdgeFile(edgesPath);
	}

	/**
	 * High-level helper to perform a complete import flow with standard mapping.
	 */
	async importGraph(nodesPath: string, edgesPath: string) {
		await this.openImportModal();
		await this.uploadFiles(nodesPath, edgesPath);
		await this.submitUpload();

		// Map Nodes
		await this.mapColumns({
			id: "id",
			title: "title",
			type: "type",
		});
		await this.verifyNextButtonEnabled();
		await this.submitMapping();
		await this.page.waitForTimeout(500); // Wait for transition

		// Map Edges
		await this.mapColumns({
			source: "source",
			target: "target",
		});
		await this.verifyNextButtonEnabled();
		await this.submitMapping();
		await this.page.waitForTimeout(1000); // 1s for graph gen

		await this.finishImport();
		// Wait for graph to stabilize
		await this.page.waitForTimeout(500);
	}

	async uploadNodeFile(filePath: string) {
		await this.uploadFile("dropzone-nodes", filePath);
	}

	async uploadEdgeFile(filePath: string) {
		await this.uploadFile("dropzone-edges", filePath);
	}

	private async uploadFile(testId: string, filePath: string) {
		const buffer = fs.readFileSync(filePath);
		const fileName = path.basename(filePath);
		const dataTransfer = await this.page.evaluateHandle(
			async ({ bufferStr, fileName }) => {
				const dt = new DataTransfer();
				const file = new File([bufferStr], fileName, { type: "text/csv" });
				dt.items.add(file);
				return dt;
			},
			{ bufferStr: buffer.toString(), fileName },
		);
		// Note: The new wizard might not have inputs with these IDs yet, so this will fail until implemented.
		// That is expected for the "Verify Red" phase.
		await this.page.dispatchEvent(`[data-testid="${testId}"] input`, "drop", {
			dataTransfer,
		});
	}

	async submitUpload() {
		await this.clickNext();
	}

	async clickNext() {
		await this.page.getByTestId("import-next-button").click();
	}

	async verifyNextButtonEnabled() {
		await expect(this.page.getByTestId("import-next-button")).toBeEnabled();
	}

	async verifyNextButtonDisabled() {
		await expect(this.page.getByTestId("import-next-button")).toBeDisabled();
	}

	async verifyDropzoneContent(testId: string, text: string) {
		await expect(this.page.getByTestId(testId)).toContainText(text);
	}

	async verifyDropzoneEmpty(testId: string) {
		const text = testId.includes("nodes")
			? "Upload Nodes CSV"
			: "Upload Edges CSV";
		await expect(this.page.getByTestId(testId)).toContainText(text);
	}

	async mapColumns(mapping: {
		id?: string;
		title?: string;
		type?: string;
		source?: string;
		target?: string;
	}) {
		// Detect step based on keys
		const isEdgeMapping = !!mapping.source || !!mapping.target;
		const stepId = isEdgeMapping ? "step-map-edges" : "step-map-nodes";

		// Wait for mapping step
		await expect(this.page.getByTestId(stepId)).toBeVisible({
			timeout: 10000,
		});

		if (mapping.id) await this.selectColumn("id", mapping.id);
		if (mapping.title) await this.selectColumn("title", mapping.title);
		if (mapping.type) await this.selectColumn("type", mapping.type);
		if (mapping.source) await this.selectColumn("source", mapping.source);
		if (mapping.target) await this.selectColumn("target", mapping.target);
	}

	async finishImport() {
		await this.page.getByTestId("import-finish-button").click();
	}

	async selectProperty(property: string) {
		await this.page.getByTestId("mapping-select-properties-trigger").click();
		// Try finding by text or data-value to be robust
		const option = this.page
			.locator(`[role="option"]`)
			.filter({ hasText: property })
			.or(this.page.locator(`[data-value="${property}"]`));
		await option.first().click();
		await this.page.keyboard.press("Escape");
	}

	async verifyMappingStep() {
		await expect(this.page.getByText("Map Nodes", { exact: true })).toBeVisible(
			{
				timeout: 10000,
			},
		);
	}

	async openColumnDropdown(field: string) {
		await this.page.getByTestId(`mapping-select-${field}-trigger`).click();
	}

	async getDropdownOptions(field: string) {
		await this.openColumnDropdown(field);
		const options = await this.page.getByRole("option").allInnerTexts();
		await this.closeDropdown();
		return options;
	}

	async verifyDropdownOption(text: string) {
		await expect(this.page.getByRole("option", { name: text })).toBeVisible();
	}

	async closeDropdown() {
		await this.page.keyboard.press("Escape");
	}

	private async selectColumn(field: string, csvColumn: string) {
		await this.page.getByTestId(`mapping-select-${field}-trigger`).click();
		await this.page
			.getByRole("option", { name: csvColumn, exact: true })
			.click();
	}

	async mapColumn(field: string, csvColumn: string) {
		await this.selectColumn(field, csvColumn);
	}

	async submitMapping() {
		await this.page.getByRole("button", { name: "Next", exact: true }).click();
	}

	async verifyImportSuccess() {
		await expect(this.page.getByRole("dialog")).toContainText(
			"Import successful",
		);
	}

	async closeImportModal() {
		await this.page.getByTestId("import-close-button").click();
	}

	async cancelImport() {
		// Try closing via dialog close button first, fallback to Escape
		if (await this.page.getByTestId("dialog-close-button").isVisible()) {
			await this.page.getByTestId("dialog-close-button").click();
		} else {
			await this.page.keyboard.press("Escape");
		}
	}

	async verifyDialogVisible(visible: boolean) {
		if (visible) {
			await expect(this.page.getByRole("dialog")).toBeVisible();
		} else {
			await expect(this.page.getByRole("dialog")).not.toBeAttached();
		}
	}

	async verifyDialogFullyOpen() {
		// Radix UI sets data-state="open" when the dialog is fully open
		// Waiting for this attribute helps avoid race conditions with animations
		await expect(this.page.getByRole("dialog")).toHaveAttribute(
			"data-state",
			"open",
		);
	}

	async verifyDialogText(text: string) {
		await expect(this.page.getByRole("dialog")).toContainText(text);
	}

	async verifyDialogDoesNotContainText(text: string) {
		await expect(this.page.getByRole("dialog")).not.toContainText(text);
	}

	async verifyUploadStepVisible() {
		await expect(this.page.getByTestId("wizard-step-upload")).toBeVisible();
	}

	// Graph verification methods removed. Use LineagePage instead.
}
