import { expect, test } from "@playwright/test";
import path from "path";

test.describe("Node Properties", () => {
    test.beforeEach(async ({ page }) => {

        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });



    test("should display properties field in mapping step (Slice 2)", async ({ page }) => {
        // 1. Import Data
        await page.getByRole("button", { name: "Import CSV" }).click();
        const nodesPath = path.join(__dirname, "fixtures", "nodes_with_desc.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
        const edgesPath = path.join(__dirname, "fixtures", "edges_with_desc.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // 2. Verify Properties Field
        await expect(page.getByText("Properties (Optional)")).toBeVisible();

        // 3. Verify Dropdown Content
        // Open the dropdown
        await page.getByTestId("mapping-select-properties-trigger").click();
        await expect(page.getByRole("option", { name: "description" })).toBeVisible();

        // 4. Verify Default Selection (Empty)
        // Close dropdown first
        await page.keyboard.press("Escape");
        // Check that no badges are visible (or placeholder is visible)
        await expect(page.getByText("Select properties to import...")).toBeVisible();
    });

    test("should display first property in node card (Slice 1 Preview)", async ({ page }) => {
        // 1. Open Modal
        await page.getByRole("button", { name: "Import CSV" }).click();

        // 2. Upload Nodes with extra 'description' column
        const nodesPath = path.join(__dirname, "fixtures", "nodes_with_desc.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);

        // 3. Upload Edges (Matching)
        const edgesPath = path.join(__dirname, "fixtures", "edges_with_desc.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);

        // 4. Click Next
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // 5. Map Columns
        // Note: 'description' is NOT mapped to a core field, so it should be auto-imported as a property
        // 5. Map Columns
        // Note: 'description' is NOT mapped to a core field, so it should be auto-imported as a property
        await page.getByTestId("mapping-select-id-trigger").click();
        await page.getByRole("option", { name: "id", exact: true }).click();

        await page.getByTestId("mapping-select-title-trigger").click();
        await page.getByRole("option", { name: "title", exact: true }).click();

        await page.getByTestId("mapping-select-type-trigger").click();
        await page.getByRole("option", { name: "type", exact: true }).click();

        await page.getByTestId("mapping-select-source-trigger").click();
        await page.getByRole("option", { name: "source", exact: true }).click();

        await page.getByTestId("mapping-select-target-trigger").click();
        await page.getByRole("option", { name: "target", exact: true }).click();

        // Explicitly map 'description' property (Auto-import is disabled)
        await page.getByTestId("mapping-select-properties-trigger").click();
        await page.getByRole("option", { name: "description" }).click();
        await page.keyboard.press("Escape"); // Close dropdown

        // 6. Import
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Verify success before closing
        await expect(page.getByRole("dialog")).toContainText("Import successful");

        await page.getByTestId("dialog-close-button").click();

        // 7. Verify Side Panel Interaction (Slice 2)
        // Click the node
        const node = page.locator(".react-flow__node").filter({ hasText: "User Table" });
        await expect(node).toBeVisible();
        await node.click();

        // Verify Side Panel opens
        const panel = page.getByTestId("node-details-panel");
        await expect(panel).toBeVisible();

        // Verify Content
        await expect(panel).toContainText("User Table"); // Title
        // Slice 5: Type section removed, so we don't check for "INPUT" anymore
        // await expect(panel).toContainText("INPUT"); 
        await expect(panel).toContainText("description"); // Property Key
        await expect(panel).toContainText("Core user table"); // Property Value

        // Verify Preview is GONE (Slice 2 requirement)
        await expect(node).not.toContainText("Core user table");

        // Verify ID is visible on the card (Slice 5 requirement)
        await expect(node).toContainText("user_table");

        // Close Panel by clicking canvas (top-left corner to avoid panel)
        await page.mouse.click(100, 100);
        await expect(panel).not.toBeVisible();
    });

    test("should handle selection, visual cues, and long content (Slice 3)", async ({ page }) => {
        // 1. Import Data
        await page.getByRole("button", { name: "Import CSV" }).click();
        const nodesPath = path.join(__dirname, "fixtures", "nodes_long_content.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
        const edgesPath = path.join(__dirname, "fixtures", "edges_long_content.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // Map columns
        // Map columns
        await page.getByTestId("mapping-select-id-trigger").click();
        await page.getByRole("option", { name: "id", exact: true }).click();

        await page.getByTestId("mapping-select-title-trigger").click();
        await page.getByRole("option", { name: "title", exact: true }).click();

        await page.getByTestId("mapping-select-type-trigger").click();
        await page.getByRole("option", { name: "type", exact: true }).click();

        await page.getByTestId("mapping-select-source-trigger").click();
        await page.getByRole("option", { name: "source", exact: true }).click();

        await page.getByTestId("mapping-select-target-trigger").click();
        await page.getByRole("option", { name: "target", exact: true }).click();

        // Explicitly map 'description' property and 'prop1'
        await page.getByTestId("mapping-select-properties-trigger").click();
        await page.getByRole("option", { name: "description" }).click();
        await page.locator('[data-value="prop1"]').click();
        await page.keyboard.press("Escape");

        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page.getByTestId("dialog-close-button").click();

        const nodeA = page.locator(".react-flow__node").filter({ hasText: "Node A" });
        const nodeB = page.locator(".react-flow__node").filter({ hasText: "Node B" });
        const panel = page.getByTestId("node-details-panel");

        // 2. Verify Hover Cursor (Red State: Expect failure if not implemented)
        // Check the inner content div which has the cursor-pointer class
        await expect(nodeA.getByTestId("custom-node-content")).toHaveCSS("cursor", "pointer");

        // 3. Verify Selection Visual Cue & Panel Open
        await nodeA.click();
        await expect(panel).toBeVisible();
        await expect(panel).toContainText("Node A");

        // Check for visual cue (Behavioral: Class attribute changes to include selection styles)
        // We check for *any* ring class to be less brittle about specific colors
        await expect(nodeA.getByTestId("custom-node-content")).toHaveClass(/ring-/);

        // 4. Verify Selection Switching & Content Update
        await nodeB.click();
        // Node A should lose the cue
        await expect(nodeA.getByTestId("custom-node-content")).not.toHaveClass(/ring-/);
        // Node B should gain the cue
        await expect(nodeB.getByTestId("custom-node-content")).toHaveClass(/ring-/);
        // Panel content should update
        await expect(panel).toContainText("Node B");
        await expect(panel).toContainText("This is a very long description");

        // 5. Verify Full Height & Scrolling (Slice 4: Floating with margins)
        // Check if panel has floating layout classes (Behavioral: absolute positioning)
        await expect(panel).toHaveClass(/absolute/);
        await expect(panel).toHaveClass(/top-4|bottom-4|right-4/);

        // 6. Verify Scrolling with Node D (Many properties)
        const nodeD = page.locator(".react-flow__node").filter({ hasText: "Node D" });
        await nodeD.click();
        await expect(panel).toContainText("Node D");
        // Verify prop1 is present
        await expect(panel).toContainText("prop1");
        await expect(panel).toContainText("Value 1 is somewhat long");
    });

    test("should not import unselected properties (Slice 3)", async ({ page }) => {
        // 1. Import Data with multiple extra columns
        await page.getByRole("button", { name: "Import CSV" }).click();
        const nodesPath = path.join(__dirname, "fixtures", "nodes_long_content.csv");
        await page.getByTestId("dropzone-nodes").locator('input[type="file"]').setInputFiles(nodesPath);
        const edgesPath = path.join(__dirname, "fixtures", "edges_long_content.csv");
        await page.getByTestId("dropzone-edges").locator('input[type="file"]').setInputFiles(edgesPath);
        await page.getByRole("button", { name: "Next", exact: true }).click();

        // 2. Map Columns
        await page.getByTestId("mapping-select-id-trigger").click();
        await page.getByRole("option", { name: "id", exact: true }).click();

        await page.getByTestId("mapping-select-title-trigger").click();
        await page.getByRole("option", { name: "title", exact: true }).click();

        await page.getByTestId("mapping-select-type-trigger").click();
        await page.getByRole("option", { name: "type", exact: true }).click();

        await page.getByTestId("mapping-select-source-trigger").click();
        await page.getByRole("option", { name: "source", exact: true }).click();

        await page.getByTestId("mapping-select-target-trigger").click();
        await page.getByRole("option", { name: "target", exact: true }).click();

        // 3. Select ONLY 'description', leave 'prop1' unselected
        await page.getByTestId("mapping-select-properties-trigger").click();
        await page.getByRole("option", { name: "description" }).click();
        await page.keyboard.press("Escape");

        // 4. Import
        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page.getByTestId("dialog-close-button").click();

        // 5. Verify Side Panel
        const node = page.locator(".react-flow__node").filter({ hasText: "Node A" });
        await node.click();
        const panel = page.getByTestId("node-details-panel");

        // Should contain 'description'
        await expect(panel).toContainText("description");
        await expect(panel).toContainText("Short description");

        // Should NOT contain 'prop1'
        await expect(panel).not.toContainText("prop1");
        await expect(panel).not.toContainText("val1A");
    });
});
