import * as fs from "node:fs";
import * as path from "node:path";
import { expect, type Page } from "@playwright/test";

export class LineagePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto("/");
		await this.page.waitForLoadState("networkidle");
	}

	async openImportModal() {
		// Slice 8: Cleanup - Always open "Import CSV" (which is now the Wizard)
		const button = this.page.getByTestId("import-csv-trigger");
		await button.waitFor();
		// Use dispatchEvent to avoid Playwright's click retry loop which might hit the overlay
		// if it appears too quickly, causing the dialog to close immediately.
		await button.dispatchEvent("click");
		await expect(this.page.getByRole("dialog")).toBeVisible();
	}

	async uploadFiles(nodesPath: string, edgesPath: string) {
		await this.uploadNodeFile(nodesPath);
		await this.uploadEdgeFile(edgesPath);
	}

	/**
	 * High-level helper to perform a complete import flow using the New Wizard.
	 */
	async importGraph(
		nodesPath: string,
		edgesPath: string,
		callbacks?: { onNodeMapping?: () => Promise<void> },
		overrideMapping?: {
			nodes?: { id?: string; title?: string; type?: string };
			edges?: { source?: string; target?: string };
		},
	) {
		await this.openImportModal();
		await this.uploadFiles(nodesPath, edgesPath);

		// Step 1 -> 2 (Upload -> Map Nodes)
		await this.verifyNextButtonEnabled();
		await this.clickNext();

		// Step 2: Map Nodes
		// Explicitly map standard fields to ensure valid state (mirroring legacy behavior)
		await this.mapColumns({
			id: "id",
			title: "title",
			type: "type",
			...overrideMapping?.nodes,
		});
		if (callbacks?.onNodeMapping) {
			await callbacks.onNodeMapping();
		}
		await this.verifyNextButtonEnabled();
		await this.clickNext();

		// Step 3: Map Edges
		// Explicitly map standard fields
		await this.mapColumns({
			source: "source",
			target: "target",
			...overrideMapping?.edges,
		});

		// Step 3 -> 4 (Map Edges -> Success)
		// Button text changes to "Generate Graph" at this step
		await this.page.getByRole("button", { name: "Generate Graph" }).click();

		// Wait for Success Step
		await expect(this.page.getByTestId("wizard-step-success")).toBeVisible();

		// Finish (Click "Close")
		await this.page.getByRole("button", { name: "Close" }).click();

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
		await this.page.dispatchEvent(`[data-testid="${testId}"] input`, "drop", {
			dataTransfer,
		});
	}

	async submitUpload() {
		await this.clickNext();
	}

	async clickNext() {
		await this.verifyNextButtonEnabled();
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

	async verifyDropzoneEmpty(testId: string, text: string) {
		await expect(this.page.getByTestId(testId)).not.toContainText(text);
	}

	async mapColumns(mapping: {
		id?: string;
		title?: string;
		type?: string;
		source?: string;
		target?: string;
	}) {
		// Wait for mapping step
		// If mapping source/target, we expect "Map Edges" (Step 3)
		// Otherwise "Map Nodes" (Step 2)
		const stepHeader =
			mapping.source || mapping.target ? "Map Edges" : "Map Nodes";
		await expect(this.page.getByText(stepHeader, { exact: true })).toBeVisible({
			timeout: 10000,
		});

		if (mapping.id) await this.selectColumn("id", mapping.id);
		if (mapping.title) await this.selectColumn("title", mapping.title);
		if (mapping.type) await this.selectColumn("type", mapping.type);
		if (mapping.source) await this.selectColumn("source", mapping.source);
		if (mapping.target) await this.selectColumn("target", mapping.target);
	}

	async selectProperty(property: string) {
		// New Wizard: Click the pill
		await this.page.getByTestId(`property-pill-${property}`).click();
	}

	async verifyMappingStep() {
		await expect(this.page.getByText("Nodes", { exact: true })).toBeVisible({
			timeout: 10000,
		});
	}

	async openColumnDropdown(field: string) {
		await this.page.getByTestId(`mapping-select-${field}-trigger`).click();
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
			.click({ force: true });
	}

	async submitMapping() {
		await this.clickNext();
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
			await expect(this.page.getByRole("dialog")).not.toBeVisible();
		}
	}

	async verifyDialogText(text: string) {
		await expect(this.page.getByRole("dialog")).toContainText(text);
	}

	async verifyDialogDoesNotContainText(text: string) {
		await expect(this.page.getByRole("dialog")).not.toContainText(text);
	}

	async verifyUploadStepVisible() {
		await expect(this.page.getByText("Nodes CSV (Required)")).toBeVisible();
	}

	async verifyGraphNode(text: string) {
		await expect(this.getGraphNode(text)).toBeVisible();
	}

	getGraphNode(text: string) {
		return this.page.locator(".react-flow__node").filter({ hasText: text });
	}

	async getGraphNodePosition(text: string) {
		const node = this.getGraphNode(text);
		const boundingBox = await node.boundingBox();
		if (!boundingBox) {
			throw new Error(`Node ${text} not found or has no bounding box`);
		}
		return { x: boundingBox.x, y: boundingBox.y };
	}

	async getGraphNodeLayer(text: string) {
		const nodeWrapper = this.getGraphNode(text);
		const innerNode = nodeWrapper.locator("[data-layer]");
		await expect(innerNode).toHaveAttribute("data-layer", /.*/);
		return await innerNode.getAttribute("data-layer");
	}

	async verifyNodeValidationStatus(text: string, status: "valid" | "invalid") {
		const nodeWrapper = this.getGraphNode(text);
		// The data-validation-status is on the inner div (same as data-layer)
		const innerNode = nodeWrapper.locator("[data-validation-status]");
		await expect(innerNode).toHaveAttribute("data-validation-status", status);
	}

	async verifyEdgeValidationStatus(
		status: "valid" | "invalid",
		count?: number,
	) {
		// Target the invisible path that has the data attribute
		const edges = this.page.locator(`path[data-validation-status="${status}"]`);
		if (count !== undefined) {
			await expect(edges).toHaveCount(count);
		} else {
			await expect(edges).toBeVisible(); // At least one
		}
	}

	async verifyGraphNodeMissing(text: string) {
		await expect(
			this.page.locator(".react-flow__node").filter({ hasText: text }),
		).not.toBeVisible();
	}

	async clickNode(text: string) {
		await this.getGraphNode(text).click();
	}

	async verifyNodeSelected(text: string) {
		// Check for ring class on the inner content div
		const nodeContent = this.getGraphNode(text).getByTestId(
			"custom-node-content",
		);
		await expect(nodeContent).toHaveClass(/ring-/);
	}

	async verifyNodeNotSelected(text: string) {
		const nodeContent = this.getGraphNode(text).getByTestId(
			"custom-node-content",
		);
		await expect(nodeContent).not.toHaveClass(/ring-/);
	}

	async verifySidePanelVisible(visible: boolean) {
		const panel = this.page.getByTestId("node-details-panel");
		if (visible) {
			await expect(panel).toBeVisible();
		} else {
			await expect(panel).not.toBeVisible();
		}
	}

	async verifySidePanelContent(text: string) {
		const panel = this.page.getByTestId("node-details-panel");
		await expect(panel).toContainText(text);
	}

	async verifySidePanelMissingContent(text: string) {
		const panel = this.page.getByTestId("node-details-panel");
		await expect(panel).not.toContainText(text);
	}

	async closeSidePanel() {
		// Click on the canvas (pane) to close the panel
		await this.page
			.locator(".react-flow__pane")
			.click({ position: { x: 10, y: 10 } });
	}

	async verifyGraphEdgeCount(count: number) {
		await expect(this.page.locator(".react-flow__edge")).toHaveCount(count);
	}

	async verifyErrorToggleVisible(visible: boolean) {
		const toggle = this.page.getByTestId("error-toggle");
		if (visible) {
			await expect(toggle).toBeVisible();
		} else {
			await expect(toggle).toBeHidden();
		}
	}

	async verifyErrorCount(count: number) {
		const toggle = this.page.getByTestId("error-toggle");
		await expect(toggle).toContainText(count.toString());
	}

	async openErrorPanel() {
		await this.page.getByTestId("error-toggle").click();
	}

	async closeErrorPanel() {
		await this.page.getByTestId("error-panel-close").click();
	}

	async verifyErrorPanelVisible(visible: boolean) {
		const panel = this.page.getByTestId("error-list-panel");
		if (visible) {
			await expect(panel).toBeVisible();
		} else {
			await expect(panel).not.toBeVisible();
		}
	}

	async verifyErrorPanelContent(text: string) {
		const panel = this.page.getByTestId("error-list-panel");
		await expect(panel).toContainText(text);
	}

	async clickErrorItem(text: string) {
		const item = this.page.getByTestId("error-item").filter({ hasText: text });
		await item.click();
	}

	async verifyErrorItemCount(count: number) {
		const items = this.page.getByTestId("error-item");
		await expect(items).toHaveCount(count);
	}

	async verifyGraphNodeCount(count: number) {
		await expect(this.page.locator(".react-flow__node")).toHaveCount(count);
	}

	async verifyWarningCount(count: number) {
		const warningItems = this.page.getByTestId("warning-item");
		await expect(warningItems).toHaveCount(count);
	}

	async verifyNodeHasPulse(text: string) {
		const nodeContent = this.getGraphNode(text).getByTestId(
			"custom-node-content",
		);
		await expect(nodeContent.locator(".animate-flash-ring")).toBeVisible();
	}

	async verifyNodeDoesNotHavePulse(text: string) {
		const nodeContent = this.getGraphNode(text).getByTestId(
			"custom-node-content",
		);
		await expect(nodeContent.locator(".animate-flash-ring")).not.toBeVisible();
	}

	async verifyEdgeHasPulse() {
		// For edges, we expect a second path with the flash animation
		const flashedEdges = this.page.locator(
			".react-flow__edge path.animate-flash-stroke",
		);
		await expect(flashedEdges.first()).toBeAttached();
		await expect(flashedEdges.first()).toHaveClass(/animate-flash-stroke/);
	}
}
