import { expect, test } from "@playwright/test";
import * as path from "path";

test.describe("CSV Import Modal", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for page to be ready
		await expect(
			page.getByRole("button", { name: "Generate Graph" }),
		).toBeVisible();
	});

	test("Test 1: opens import modal when button clicked", async ({ page }) => {
		// Click the Import CSV button
		await page.click('button:has-text("Import CSV")');

		// Modal should be visible
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("Import Graph from CSV")).toBeVisible();
	});

	test("Test 2: closes modal when cancel clicked", async ({ page }) => {
		// Open the modal
		await page.click('button:has-text("Import CSV")');
		await expect(page.getByRole("dialog")).toBeVisible();

		// Click cancel button
		await page.click('button:has-text("Cancel")');

		// Modal should be hidden
		await expect(page.getByRole("dialog")).not.toBeVisible();
	});

	test("Test 3: closes modal when X button clicked", async ({ page }) => {
		// Open the modal
		await page.click('button:has-text("Import CSV")');
		await expect(page.getByRole("dialog")).toBeVisible();

		// Click X close button
		await page.click('[aria-label="Close modal"]');

		// Modal should be hidden
		await expect(page.getByRole("dialog")).not.toBeVisible();
	});

	test("Test 4: closes modal when clicking outside", async ({ page }) => {
		// Open the modal
		await page.click('button:has-text("Import CSV")');
		await expect(page.getByRole("dialog")).toBeVisible();

		// Click outside the modal (on backdrop)
		await page.click(".modal-backdrop", { position: { x: 10, y: 10 } });

		// Modal should be hidden
		await expect(page.getByRole("dialog")).not.toBeVisible();
	});
});

test.describe("CSV Import Modal - Streamlined Navigation", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for page to be ready
		await expect(
			page.getByRole("button", { name: "Generate Graph" }),
		).toBeVisible();

		// Open the modal
		await page.click('button:has-text("Import CSV")');
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("Test 5: should navigate directly from upload to mapping step", async ({
		page,
	}) => {
		// Upload test files
		const nodesFile = path.join(
			__dirname,
			"../../test-csv-files/valid-basic-nodes.csv",
		);
		const edgesFile = path.join(
			__dirname,
			"../../test-csv-files/valid-basic-edges.csv",
		);

		// Upload nodes file
		const nodesInput = page.locator(
			'input[aria-label="Nodes CSV file upload"]',
		);
		await nodesInput.setInputFiles(nodesFile);

		// Upload edges file
		const edgesInput = page.locator(
			'input[aria-label="Edges CSV file upload"]',
		);
		await edgesInput.setInputFiles(edgesFile);

		// Wait for file processing
		await page.waitForTimeout(1000);

		// Click Continue button
		await page.click('button:has-text("Continue")');

		// Should skip column detection and go directly to mapping step
		await expect(page.getByText("Column Mapping")).toBeVisible();
		await expect(
			page.getByText("Map your CSV columns to the required fields"),
		).toBeVisible();

		// Should NOT show column detection UI
		await expect(page.getByText("Column Detection")).not.toBeVisible();
		await expect(
			page.getByText("Review the columns found in your CSV files"),
		).not.toBeVisible();
	});

	test("Test 6: should remove column detection UI elements", async ({
		page,
	}) => {
		// Upload test files
		const nodesFile = path.join(
			__dirname,
			"../../test-csv-files/valid-basic-nodes.csv",
		);
		const edgesFile = path.join(
			__dirname,
			"../../test-csv-files/valid-basic-edges.csv",
		);

		await page
			.locator('input[aria-label="Nodes CSV file upload"]')
			.setInputFiles(nodesFile);
		await page
			.locator('input[aria-label="Edges CSV file upload"]')
			.setInputFiles(edgesFile);

		// Wait for file processing
		await page.waitForTimeout(1000);

		// Click Continue
		await page.click('button:has-text("Continue")');

		// Should not display column badges or detection step
		await expect(page.locator(".bg-blue-100")).not.toBeVisible(); // Blue badges for node columns
		await expect(page.locator(".bg-green-100")).not.toBeVisible(); // Green badges for edge columns
		await expect(page.getByText(/\d+ rows found/)).not.toBeVisible();
	});
});

test.describe("CSV Import Modal - Auto-Generated IDs", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for page to be ready
		await expect(
			page.getByRole("button", { name: "Generate Graph" }),
		).toBeVisible();

		// Open the modal
		await page.click('button:has-text("Import CSV")');
		await expect(page.getByRole("dialog")).toBeVisible();
		
		// Upload test files and navigate to mapping step
		const nodesFile = path.join(
			__dirname,
			"../../test-csv-files/valid-basic-nodes.csv",
		);
		const edgesFile = path.join(
			__dirname,
			"../../test-csv-files/valid-basic-edges.csv",
		);

		await page
			.locator('input[aria-label="Nodes CSV file upload"]')
			.setInputFiles(nodesFile);
		await page
			.locator('input[aria-label="Edges CSV file upload"]')
			.setInputFiles(edgesFile);

		// Wait for file processing
		await page.waitForTimeout(1000);

		// Navigate to mapping step
		await page.click('button:has-text("Continue")');
		await expect(page.getByText("Column Mapping")).toBeVisible();
	});

	test("Test 7: should not show ID column mapping option", async ({
		page,
	}) => {
		// Given: CSV import at mapping step
		// When: mapping interface loads
		// Then: should not display "Node ID" dropdown selector
		await expect(page.getByLabel("Node ID column mapping")).not.toBeVisible();
		await expect(page.getByText("Node ID Column *")).not.toBeVisible();
		
		// Should still show other required fields
		await expect(page.getByText("Node Title Column *")).toBeVisible();
		await expect(page.getByText("Source Node Column *")).toBeVisible();
		await expect(page.getByText("Target Node Column *")).toBeVisible();
	});

	test("Test 8: should show auto-generation notice for IDs", async ({
		page,
	}) => {
		// Given: mapping step loaded
		// When: user views mapping interface
		// Then: should display "Node IDs will be auto-generated from title column"
		await expect(
			page.getByText("Node IDs will be auto-generated from title column"),
		).toBeVisible();
		
		// Should show it as an info message (check for blue background)
		await expect(page.locator(".bg-blue-50")).toBeVisible();
	});

	test("Test 9: should preview generated IDs in validation step", async ({
		page,
	}) => {
		// Select title column mapping
		await page.selectOption(
			'select[aria-label="Node title column mapping"]',
			"title",
		);
		
		// Select required edge mappings
		await page.selectOption(
			'select[aria-label="Source node column mapping"]',
			"source",
		);
		await page.selectOption(
			'select[aria-label="Target node column mapping"]',
			"target",
		);
		
		// Navigate to validation step
		await page.click('button:has-text("Continue")');
		await expect(page.getByText("Step 4: Validate Data")).toBeVisible();
		
		// Should show generated ID preview
		await expect(page.getByText("Generated IDs:")).toBeVisible();
		await expect(
			page.getByText(/user-count|total-revenue|new-users/),
		).toBeVisible();
	});
});
