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
