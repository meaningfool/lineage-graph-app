
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import * as fs from "fs";

test.describe("CSV Import Feature", () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    // Helper to upload file via Drag & Drop simulation
    async function uploadFile(page: Page, testId: string, filePath: string) {
        const buffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const dataTransfer = await page.evaluateHandle(
            async ({ bufferStr, fileName }) => {
                const dt = new DataTransfer();
                const file = new File([bufferStr], fileName, { type: "text/csv" });
                dt.items.add(file);
                return dt;
            },
            { bufferStr: buffer.toString(), fileName }
        );
        await page.dispatchEvent(`[data-testid="${testId}"] input`, "drop", { dataTransfer });
    }

    // Helper to complete the mapping step
    async function completeMappingStep(page: Page, hasEdges = true) {
        // Wait for mapping step to appear
        await expect(page.getByText("Nodes", { exact: true })).toBeVisible({ timeout: 10000 });

        // Select Node columns
        // ID
        await page.getByTestId("mapping-select-id-trigger").click();
        await page.getByRole("option", { name: "id", exact: true }).click();
        // Title
        await page.getByTestId("mapping-select-title-trigger").click();
        await page.getByRole("option", { name: "title", exact: true }).click();
        // Type
        await page.getByTestId("mapping-select-type-trigger").click();
        await page.getByRole("option", { name: "type", exact: true }).click();

        // Select Edge columns if edges are present
        if (hasEdges) {
            // Source
            await page.getByTestId("mapping-select-source-trigger").click();
            await page.getByRole("option", { name: "source", exact: true }).click();
            // Target
            await page.getByTestId("mapping-select-target-trigger").click();
            await page.getByRole("option", { name: "target", exact: true }).click();
        }

        // Click Next
        await page.getByTestId("mapping-next-button").click();
    }

    // ========== 1. HAPPY PATH (The "Golden Flow") ==========
    test.describe("Happy Path", () => {
        test("should import nodes and edges with mapped fields", async ({ page }) => {
            // 1. Open Modal
            await page.getByRole("button", { name: "Import CSV" }).click();

            // Upload Nodes file
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_custom_headers.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);

            // Upload Edges file
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);

            // 3. Click Next
            await page.getByRole("button", { name: "Next", exact: true }).click();

            // 4. Map columns (node_id -> id, name -> title, node_type -> type)
            // 4. Map columns (node_id -> id, name -> title, node_type -> type)
            await page.getByTestId("mapping-select-id-trigger").click();
            await page.getByRole("option", { name: "node_id" }).click();

            await page.getByTestId("mapping-select-title-trigger").click();
            await page.getByRole("option", { name: "name" }).click();

            await page.getByTestId("mapping-select-type-trigger").click();
            await page.getByRole("option", { name: "node_type" }).click();

            await page.getByTestId("mapping-select-source-trigger").click();
            await page.getByRole("option", { name: "source" }).click();

            await page.getByTestId("mapping-select-target-trigger").click();
            await page.getByRole("option", { name: "target" }).click();

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

            // 2. Upload Nodes file (Drag & Drop Simulation)
            // 2. Upload Nodes file (Drag & Drop Simulation)
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);

            // 3. Upload Edges file (Drag & Drop Simulation)
            // 3. Upload Edges file (Drag & Drop Simulation)
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);

            // Verify files are recognized
            await expect(page.getByTestId("dropzone-nodes")).toContainText("nodes_valid_basic.csv");
            await expect(page.getByTestId("dropzone-edges")).toContainText("edges_valid_basic.csv");

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
            // 2. Upload BOTH files (Drag & Drop Simulation)
            // 2. Upload BOTH files (Drag & Drop Simulation)
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);

            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);

            // 3. Go to Mapping Step
            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeEnabled();
            await nextButton.click();
            await expect(page.getByText("Nodes", { exact: true })).toBeVisible();

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
            await expect(page.getByText("Nodes CSV (Required)")).toBeVisible();
            await expect(page.getByText("Nodes", { exact: true })).not.toBeVisible();

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
            await uploadFile(page, "dropzone-nodes", malformedPath);

            // 3. Upload malformed file as Edges
            await uploadFile(page, "dropzone-edges", malformedPath);

            // 4. Click Next
            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeEnabled();
            await nextButton.click();

            // 5. Verify Error Message contains both errors
            const dialog = page.getByRole("dialog");
            await expect(dialog).toContainText("Failed to read file(s): malformed.csv, malformed.csv");

            // 6. Verify BOTH dropzones are cleared
            await expect(page.getByTestId("dropzone-nodes")).not.toContainText("malformed.csv");
            await expect(page.getByTestId("dropzone-edges")).not.toContainText("malformed.csv");
        });

        test("should reset wizard after successful import", async ({ page }) => {
            // 1. Perform a successful import
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);

            await page.getByRole("button", { name: "Next" }).click();
            await completeMappingStep(page);

            // 2. Verify Success Step
            await expect(page.getByText("Import successful")).toBeVisible();

            // 3. Close via the "Close" button in the Results step
            await page.getByTestId("import-close-button").click();
            await expect(page.getByRole("dialog")).not.toBeVisible();

            // 4. Re-open Modal
            await page.getByRole("button", { name: "Import CSV" }).click();

            // 5. Verify we are back at Upload step
            await expect(page.getByText("Nodes CSV (Required)")).toBeVisible();
            await expect(page.getByTestId("dropzone-nodes")).toBeVisible();
        });

        test("should replace graph on second import", async ({ page }) => {
            // 1. First Import (Graph A)
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesAPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv"); // 2 nodes
            await uploadFile(page, "dropzone-nodes", nodesAPath);
            const edgesAPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesAPath);

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
            await uploadFile(page, "dropzone-nodes", nodesBPath);

            // Upload dummy edges for B (Required)
            // We can reuse edges_valid_basic.csv even if IDs don't match,
            // the edge validation will just drop them (which is fine, we only care about nodes for this test)
            // OR we use edges_valid_no_id_column.csv
            await uploadFile(page, "dropzone-edges", edgesAPath);

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
            await uploadFile(page, "dropzone-nodes", fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Nodes");

            // Verify ID dropdown options
            await page.getByTestId("mapping-select-id-trigger").click();
            await expect(page.getByRole("option", { name: "node_id" })).toBeVisible();
            await page.keyboard.press("Escape");

            // Verify Title dropdown options
            await page.getByTestId("mapping-select-title-trigger").click();
            await expect(page.getByRole("option", { name: "name" })).toBeVisible();
            await page.keyboard.press("Escape");

            // Verify Type dropdown options
            await page.getByTestId("mapping-select-type-trigger").click();
            await expect(page.getByRole("option", { name: "node_type" })).toBeVisible();
            await page.keyboard.press("Escape");
        });

        test("should validate mapping requirements", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const fixturePath = path.join(__dirname, "fixtures", "nodes_valid_custom_headers.csv");
            await uploadFile(page, "dropzone-nodes", fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();

            const nextButton = page.getByRole("button", { name: "Next", exact: true });
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-id-trigger").click();
            await page.getByRole("option", { name: "node_id" }).click();
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-title-trigger").click();
            await page.getByRole("option", { name: "name" }).click();
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-type-trigger").click();
            await page.getByRole("option", { name: "node_type" }).click();
            await expect(nextButton).toBeDisabled();

            await page.getByTestId("mapping-select-source-trigger").click();
            await page.getByRole("option", { name: "source" }).click();

            await page.getByTestId("mapping-select-target-trigger").click();
            await page.getByRole("option", { name: "target" }).click();
            await expect(nextButton).toBeEnabled();
        });


    });

    // ========== 4. NODE VALIDATION ==========
    test.describe("Node Validation", () => {
        test("should drop nodes with invalid types and show summary", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const fixturePath = path.join(__dirname, "fixtures", "nodes_invalid_bad_type.csv");
            await uploadFile(page, "dropzone-nodes", fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
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
            await uploadFile(page, "dropzone-nodes", fixturePath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
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
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_basic.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
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
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_invalid_missing_source.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Edge dropped: Source 'missing-id' not found");
        });

        test("should reject edges pointing to missing target node", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_invalid_missing_target.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Edge dropped: Target 'missing-target-id' not found");
        });

        test("should reject edges pointing to nodes dropped due to validation errors", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_invalid_bad_type.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_invalid_orphaned.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
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
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_no_id_column.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Import successful");
            await expect(page.locator(".react-flow__edge")).toHaveCount(1);
        });

        test("should silently deduplicate parallel edges", async ({ page }) => {
            await page.getByRole("button", { name: "Import CSV" }).click();
            const nodesPath = path.join(__dirname, "fixtures", "nodes_valid_basic.csv");
            await uploadFile(page, "dropzone-nodes", nodesPath);
            const edgesPath = path.join(__dirname, "fixtures", "edges_valid_duplicates.csv");
            await uploadFile(page, "dropzone-edges", edgesPath);
            await page.getByRole("button", { name: "Next", exact: true }).click();
            await completeMappingStep(page, true);

            const modal = page.getByRole("dialog");
            await expect(modal).toContainText("Import successful");
            await expect(modal).not.toContainText("dropped");
            await expect(page.locator(".react-flow__edge")).toHaveCount(1);
        });
    });
});
