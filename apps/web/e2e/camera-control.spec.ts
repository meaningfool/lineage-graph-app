import { test, expect } from '@playwright/test';
import { LineagePage } from './pages/LineagePage';
import path from 'path';

test.describe('Camera Control', () => {
    let lineagePage: LineagePage;

    test.beforeEach(async ({ page }) => {
        lineagePage = new LineagePage(page);
        await lineagePage.goto();
    });

    // Slice 1: Initial Load
    test('load_fits_outliers', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/camera-control/wide_cluster/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/camera-control/wide_cluster/edges.csv');

        await lineagePage.importGraph(nodesPath, edgesPath);

        // Assert A, B, C, D are all in viewport
        const nodes = ['A', 'B', 'C', 'D'];
        for (const id of nodes) {
            // Use data-id on the wrapper and test-id on content
            const node = page.locator(`.react-flow__node[data-id="${id}"]`).getByTestId('custom-node-content');
            await expect(node).toBeVisible();
            await expect(node).toBeInViewport();
        }

        // Assert Zoom Level (Slice 1 requirement)
        // The viewport is applied to the class .react-flow__viewport
        const viewport = page.locator('.react-flow__viewport');
        await expect(viewport).toHaveAttribute('style', /transform/);
        const style = await viewport.getAttribute('style');
        const match = style?.match(/scale\(([\d.]+)\)/);
        const scale = match ? parseFloat(match[1]) : 1;

        // With 4 nodes spread over ~2000px and a window of ~1000px, scale should be < 0.6
        expect(scale).toBeLessThan(0.6);
    });

    test('reload_resets_view', async ({ page }) => {
        const nodesPath = path.join(__dirname, 'fixtures/camera-control/wide_cluster/nodes.csv');
        const edgesPath = path.join(__dirname, 'fixtures/camera-control/wide_cluster/edges.csv');

        // 1. Initial Import
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 2. Pan away (Manual Interaction)
        // We drag the canvas (pane) to move nodes out of view
        // The pane usually has class 'react-flow__pane'
        const pane = page.locator('.react-flow__pane');
        const box = await pane.boundingBox();
        if (!box) throw new Error('Canvas pane not found');

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 500, box.y + box.height / 2 + 500, { steps: 5 });
        await page.mouse.up();

        // Verify at least one node is OUT of viewport (optional, but good for robust test)
        // Actually, simply reloading and verifying they are BACK is enough.

        // 3. Reload (Re-import the same file to trigger 'new graph' logic)
        await page.reload();
        await lineagePage.importGraph(nodesPath, edgesPath);

        // 4. Assert Reset
        const nodes = ['A', 'B', 'C', 'D'];
        for (const id of nodes) {
            const node = page.locator(`.react-flow__node[data-id="${id}"]`).getByTestId('custom-node-content');
            await expect(node).toBeInViewport();
        }
    });
});
