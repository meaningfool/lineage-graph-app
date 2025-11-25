import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";

test.describe("CSV Import", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    // Helper to complete the mapping step
    async function completeMappingStep(page: Page, hasEdges = true) {
        // Wait for mapping step to appear
        await expect(page.getByText("Column Mapping")).toBeVisible();

        // Select Node columns
        await page.getByTestId("mapping-select-id").selectOption({ label: "id" });
        await page.getByTestId("mapping-select-title").selectOption({ label: "title" });
        await page.getByTestId("mapping-select-type").selectOption({ label: "type" });

        // Select Edge columns if edges are present
        if (hasEdges) {
            await page.getByTestId("mapping-select-source").selectOption({ label: "source" });
            await page.getByTestId("mapping-select-target").selectOption({ label: "target" });
        }

        // Click Next
        await page.getByTestId("mapping-next-button").click();
    }

    // ========== 1. HAPPY PATH (The "Golden Flow") ==========
    test.describe("Happy Path", () => {
        test("should import nodes and edges with mapped fields", async ({ page }) => {
            // 1. Open Modal
            await page.getByRole("button", { name: "Import CSV" }).click();

            // 2. Upload non-standard nodes file (Custom Headers)
            const fixturePath = path.join(__dirname, "fixtures", "nodes_valid_custom_headers.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(fixturePath);

            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);

            // 3. Click Next
            await page.getByRole("button", { name: "Next", exact: true }).click();

            // 4. Map columns (node_id -> id, name -> title, node_type -> type)
            await page.getByTestId("mapping-select-id").selectOption({ label: "node_id" });
            await page.getByTestId("mapping-select-title").selectOption({ label: "name" });
            await page.getByTestId("mapping-select-type").selectOption({ label: "node_type" });
            await page.getByTestId("mapping-select-source").selectOption({ label: "source" });
            await page.getByTestId("mapping-select-target").selectOption({ label: "target" });

            // 5. Click Next to import
            await page.getByRole("button", { name: "Next", exact: true }).click();

            // 6. Verify Success
            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Import successful");

            // 7. Close modal
            const closeButton = page.getByTestId("import-close-button");
            await closeButton.click();

            // 8. Verify nodes are displayed on graph
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();
            // Verify edge
            await expect(page.locator(".react-flow__edge")).toHaveCount(1);
        });

        test("should allow uploading an edges file along with nodes", async ({ page }) => {
            // 1. Click "Import CSV" button
            const importButton = page.getByRole("button", { name: "Import CSV" });
            await importButton.click();

            // 2. Upload Nodes file
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            const nodesInput = page.getByTestId("dropzone-nodes").locator('input[type="file"]');
            await nodesInput.setInputFiles(nodesPath);

            // 3. Upload Edges file
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            const edgesInput = page.getByTestId("dropzone-edges").locator('input[type="file"]');
            await edgesInput.setInputFiles(edgesPath);

            // 4. Click Next
            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeEnabled();
            await nextButton.click();

            // 5. Complete Mapping Step
            await completeMappingStep(page, true);

            // 6. Verify Nodes are displayed
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Second Node" })).toBeVisible();

            // 7. Verify Edges are displayed
            await expect(page.locator(".react-flow__edge")).toHaveCount(1);
        });
    });

    // ========== 2. WORKFLOW & STATE ==========
    test.describe("Workflow & State", () => {
        test("should reset wizard state when modal is closed and reopened", async ({ page }) => {
            // 1. Open Modal
            await page.getByRole("button", { name: "Import CSV" }).click();

            // 2. Upload BOTH files (Required to enable Next)
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);

            // 3. Go to Mapping Step
            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeEnabled();
            await nextButton.click();
            await expect(page.getByText("Column Mapping")).toBeVisible();

            // 4. Close Modal (Cancel)
            await page.getByTestId("dialog-close-button").click();
            // Note: The X button might not be visible in Mapping step if we didn't add it to StepMapping component?
            // Let's check StepMapping. If not, we use Esc or click outside.
            // The modal usually has a close button in the header.
            // If not, we can use `page.keyboard.press("Escape")`.
            await page.keyboard.press("Escape");
            await expect(page.getByRole("dialog")).not.toBeVisible();

            // 5. Reopen Modal
            await page.getByRole("button", { name: "Import CSV" }).click();

            // 6. Verify we are back at Step 1 (Upload)
            await expect(page.getByText("Upload CSV")).toBeVisible();
            await expect(page.getByText("Column Mapping")).not.toBeVisible();

            // 7. Verify Next button is disabled (files cleared)
            // We need to re-query the button as the modal was re-rendered
            const nextButton2 = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton2).toBeDisabled();
        });

        test("should show error for malformed CSV", async ({ page }) => {
            // 1. Open Modal
            await page.getByRole("button", { name: "Import CSV" }).click();

            // 2. Upload malformed file as Nodes
            const malformedPath = path.join(__dirname, "fixtures", "malformed.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(malformedPath);

            // 3. Upload malformed file as Edges
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(malformedPath);

            // 4. Click Next
            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeEnabled();
            await nextButton.click();

            // 5. Verify Error Message contains both errors
            const dialog = page.getByRole("dialog");
            await expect(dialog).toContainText("Failed to read nodes file: malformed.csv");
            // Note: Currently the code returns early, so this second assertion WILL FAIL until we fix the code.
            // But we want to see it fail first.
            await expect(dialog).toContainText("Failed to read edges file: malformed.csv");

            // 6. Verify BOTH dropzones are cleared
            await expect(page.getByTestId("dropzone-nodes")).not.toContainText("malformed.csv");
            await expect(page.getByTestId("dropzone-edges")).not.toContainText("malformed.csv");
        });

        test("should replace graph on second import", async ({ page }) => {
            // 1. First Import (Graph A)
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesAPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv"); // 2 nodes
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesAPath);
            const edgesAPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesAPath);

            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeEnabled();
            await nextButton.click();

            await completeMappingStep(page);
            await page.getByTestId("dialog-close-button").click();

            // Verify Graph A (First Node)
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).toBeVisible();

            // 2. Second Import (Graph B)
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesBPath = path.join(__dirname, "fixtures", "nodes_second_import.csv"); // "Third Node", "Fourth Node"
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesBPath);

            // Upload dummy edges for B (Required)
            // We can reuse edges_valid_basic.csv even if IDs don't match,
            // the edge validation will just drop them (which is fine, we only care about nodes for this test)
            // OR we use edges_valid_no_id_column.csv
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesAPath);

            const nextButton2 = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton2).toBeEnabled();
            await nextButton2.click();

            // Map columns for B
            await completeMappingStep(page, true);

            // Close
            await page.getByTestId("dialog-close-button").click();

            // 3. Verify Graph B is present
            await expect(page.locator(".react-flow__node").filter({ hasText: "Third Node" })).toBeVisible();
            await expect(page.locator(".react-flow__node").filter({ hasText: "Fourth Node" })).toBeVisible();

            // 4. Verify Graph A is GONE
            await expect(page.locator(".react-flow__node").filter({ hasText: "First Node" })).not.toBeVisible();
        });
    });

    // ========== 3. COLUMN MAPPING LOGIC ==========
    test.describe("Column Mapping Logic", () => {
        test("should show mapping step with ID, Title, and Type dropdowns", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const fixturePath = path.join(__dirname, "fixtures", "nodes_valid_custom_headers.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Column Mapping");

            await expect(page.getByTestId("mapping-select-id")).toContainText("node_id");
            await expect(page.getByTestId("mapping-select-title")).toContainText("name");
            await expect(page.getByTestId("mapping-select-type")).toContainText("node_type");
        });

        test("should validate mapping requirements", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const fixturePath = path.join(__dirname, "fixtures", "nodes_valid_custom_headers.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();

            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-id").selectOption({ label: "node_id" });
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-title").selectOption({ label: "name" });
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-type").selectOption({ label: "node_type" });
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-source").selectOption({ label: "source" });
            await page.getByTestId("mapping-select-target").selectOption({ label: "target" });
            await expect(nextButton).toBeEnabled();
        });

        test("should disable Next button if Source and Target columns are the same", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();

            // Map Nodes
            await page.getByTestId("mapping-select-id").selectOption({ label: "id" });
            await page.getByTestId("mapping-select-title").selectOption({ label: "title" });
            await page.getByTestId("mapping-select-type").selectOption({ label: "type" });

            // Map Edges
            await page.getByTestId("mapping-select-source").selectOption({ label: "source" });

            // Verify 'source' option in target select is disabled (Smart Filtering)
            const targetSelect = page.getByTestId("mapping-select-target");
            const sourceOption = targetSelect.locator('option[value="source"]');
            await expect(sourceOption).toBeDisabled();

            // Verify Next button disabled
            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeDisabled();

            // Fix mapping
            await page.getByTestId("mapping-select-target").selectOption({ label: "target" });
            await expect(nextButton).toBeEnabled();
        });
    });

    // ========== 4. NODE VALIDATION ==========
    test.describe("Node Validation", () => {
        test("should drop nodes with invalid types and show summary", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const fixturePath = path.join(__dirname, "fixtures", "nodes_invalid_bad_type.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("1 node dropped");
            await expect(modal).toContainText("node-2: Invalid type");

            // Verify import success for valid node
            await page.getByTestId("dialog-close-button").click();
            await expect(page.locator(".react-flow__node")).toHaveCount(1);
        });

        test("should deduplicate nodes with duplicate IDs and show warning", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const fixturePath = path.join(__dirname, "fixtures", "nodes_invalid_duplicate_ids.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("1 node dropped");
            await expect(modal).toContainText("node-1: Duplicate Node ID");

            await page.getByTestId("dialog-close-button").click();
            await expect(page.locator(".react-flow__node")).toHaveCount(2);
        });

        test("should limit warning messages to 10", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_stress_many_warnings.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("12 nodes dropped");
            const warningItems = page.locator(".rounded-md.bg-yellow-500\\/15 > div");
            await expect(warningItems).toHaveCount(11); // 10 warnings + 1 "more" message
            await expect(modal).toContainText("more warnings");
        });
    });

    // ========== 5. EDGE VALIDATION ==========
    test.describe("Edge Validation", () => {
        test("should reject edges pointing to missing nodes", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_invalid_missing_source.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Edge dropped: Source 'missing-id' not found");
        });

        test("should reject edges pointing to missing target node", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_invalid_missing_target.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Edge dropped: Target 'missing-target-id' not found");
        });

        test("should reject edges pointing to nodes dropped due to validation errors", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_invalid_bad_type.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_invalid_orphaned.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("1 node dropped");
            await expect(modal).toContainText("1 edge dropped");
            await expect(modal).toContainText("Edge dropped: Target 'node-2' not found");
        });

        test("should import edges with only source and target columns", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_no_id_column.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Import successful");
            await expect(page.locator(".react-flow__edge")).toHaveCount(1);
        });

        test("should silently deduplicate parallel edges", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_duplicates.csv");
            await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Import successful");
            await expect(modal).not.toContainText("dropped");
            await expect(page.locator(".react-flow__edge")).toHaveCount(1);
        });
    });
});
