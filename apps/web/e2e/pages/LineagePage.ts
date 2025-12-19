import * as fs from "node:fs";
import * as path from "node:path";
import { expect, type Page } from "@playwright/test";
import { NewWizardPage } from "./NewWizardPage";

export class LineagePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto("/?skipWelcome=true");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * High-level helper to perform a complete import flow using the New Wizard.
	 * Delegates to NewWizardPage to avoid code duplication.
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
		const wizard = new NewWizardPage(this.page);

		await wizard.openImportModal();
		await wizard.uploadFiles(nodesPath, edgesPath);
		await wizard.submitUpload();

		// Step 2: Map Nodes
		await wizard.mapColumns({
			id: "id",
			title: "title",
			type: "type",
			...overrideMapping?.nodes,
		});

		if (callbacks?.onNodeMapping) {
			await callbacks.onNodeMapping();
		}

		await wizard.verifyNextButtonEnabled();
		await wizard.submitMapping();

		// Step 3: Map Edges
		await wizard.mapColumns({
			source: "source",
			target: "target",
			...overrideMapping?.edges,
		});

		await wizard.verifyNextButtonEnabled();
		await wizard.submitMapping(); // Generates Graph

		// Wait for Success Step
		await wizard.verifyImportSuccess();

		// Finish
		await wizard.finishImport();

		// Wait for graph to stabilize
		await this.page.waitForTimeout(500);
	}

	async verifyGraphNode(text: string) {
		await expect(this.getGraphNode(text)).toBeVisible();
	}

	getGraphNode(id: string) {
		return this.page.locator(`.react-flow__node[data-id="${id}"]`);
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
