import { test, expect } from '@playwright/test';
import { LineagePage } from './pages/LineagePage';
import path from 'path';

test.describe('Subtree Highlighting', () => {
    let lineagePage: LineagePage;

    test.beforeEach(async ({ page }) => {
        lineagePage = new LineagePage(page);
        await lineagePage.goto();
    });

    test('toggle_focus_ui', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);

        // Open details for Node B
        await lineagePage.clickNode('B');

        // Check toggle button exists and state
        const toggle = page.getByTestId('focus-toggle');
        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('data-active', 'false');
        await expect(toggle).toHaveText('Focus Subtree');

        // Click to activate
        await toggle.click();
        await expect(toggle).toHaveAttribute('data-active', 'true');
        await expect(toggle).toHaveText('Clear Focus');

        // Click to deactivate
        await toggle.click();
        await expect(toggle).toHaveAttribute('data-active', 'false');
        await expect(toggle).toHaveText('Focus Subtree');
    });

    test('visual_dimming_acyclic', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);
        await lineagePage.clickNode('B');

        // Focus B
        await page.getByTestId('focus-toggle').click();

        // Wait for visual update
        await page.waitForTimeout(500);

        // A (Upstream), B (Focus), C (Downstream) should NOT be dimmed
        // D (Isolated) SHOULD be dimmed
        const nodeA = page.locator('.react-flow__node[data-id="A"]').getByTestId('custom-node-content');
        const nodeB = page.locator('.react-flow__node[data-id="B"]').getByTestId('custom-node-content');
        const nodeC = page.locator('.react-flow__node[data-id="C"]').getByTestId('custom-node-content');
        const nodeD = page.locator('.react-flow__node[data-id="D"]').getByTestId('custom-node-content');

        await expect(nodeA).toHaveClass(/opacity-100/); // Should be opacity-100 (default)
        await expect(nodeB).toHaveClass(/opacity-100/);
        await expect(nodeC).toHaveClass(/opacity-100/);

        await expect(nodeD).toHaveClass(/opacity-10\b/); // Use boundary to avoid matching 100
    });

    test('clear_focus_restores_opacity', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);

        // Focus B then Clear
        await lineagePage.clickNode('B');
        await page.getByTestId('focus-toggle').click();
        await page.waitForTimeout(200);
        await page.getByTestId('focus-toggle').click(); // Clear

        // Wait for visual update
        await page.waitForTimeout(500);

        // All nodes should be full opacity
        const nodeD = page.locator('.react-flow__node[data-id="D"]').getByTestId('custom-node-content');
        await expect(nodeD).toHaveClass(/opacity-100/);
    });

    test('self_loop_handling', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/subtree-highlighting/self_loop/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/subtree-highlighting/self_loop/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);

        // Focus SelfLoopNode
        await lineagePage.clickNode('SelfLoopNode');
        await page.getByTestId('focus-toggle').click();

        await page.waitForTimeout(500);

        // SelfLoopNode should be highlighted (not dimmed)
        const selfLoopNode = page.locator('.react-flow__node[data-id="SelfLoopNode"]').getByTestId('custom-node-content');
        await expect(selfLoopNode).toHaveClass(/opacity-100/);

        // Isolated should be dimmed
        const isolated = page.locator('.react-flow__node[data-id="Isolated"]').getByTestId('custom-node-content');
        await expect(isolated).toHaveClass(/opacity-10\b/);
    });

    test('background_dismiss', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);
        await lineagePage.clickNode('B');
        await page.getByTestId('focus-toggle').click();

        // Verify D is dimmed
        const nodeD = page.locator('.react-flow__node[data-id="D"]').getByTestId('custom-node-content');
        await expect(nodeD).toHaveClass(/opacity-10\b/);

        // Click Background (Pane)
        const pane = page.locator('.react-flow__pane');
        await pane.click({ position: { x: 10, y: 10 } });

        // Verify Focus Cleared (D is not dimmed)
        await page.waitForTimeout(500);
        await expect(nodeD).toHaveClass(/opacity-100/);
    });

    test('panning_preserves_focus', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/subtree-highlighting/simple_dag/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);
        await lineagePage.clickNode('B');
        await page.getByTestId('focus-toggle').click();

        // Verify D is dimmed
        const nodeD = page.locator('.react-flow__node[data-id="D"]').getByTestId('custom-node-content');
        await expect(nodeD).toHaveClass(/opacity-10\b/);

        // Pan the canvas (Drag)
        const pane = page.locator('.react-flow__pane');
        const box = await pane.boundingBox();
        if (box) {
            await page.mouse.move(box.x + 100, box.y + 100);
            await page.mouse.down();
            await page.mouse.move(box.x + 300, box.y + 300, { steps: 5 });
            await page.mouse.up();
        }

        // Verify Focus PERSISTS (D is still dimmed)
        await page.waitForTimeout(500);
        await expect(nodeD).toHaveClass(/opacity-10\b/);
    });
});
