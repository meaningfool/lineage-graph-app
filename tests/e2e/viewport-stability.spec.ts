import { test, expect } from '@playwright/test';

test.describe('Data Lineage App - Viewport Stability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });

  test('Test 1: Viewport Position - should NOT re-center when selecting nodes', async ({ page }) => {
    // Get initial viewport transform
    const getViewportTransform = async () => {
      return await page.evaluate(() => {
        const viewport = document.querySelector('.react-flow__viewport');
        if (!viewport) return null;
        const transform = window.getComputedStyle(viewport).transform;
        return transform;
      });
    };

    // Wait for initial fitView to complete
    await page.waitForTimeout(1000);
    
    // Get initial viewport position after graph loads
    const initialTransform = await getViewportTransform();
    expect(initialTransform).not.toBe('none');
    
    // Pan the viewport away from center
    const reactFlowElement = page.locator('.react-flow');
    await reactFlowElement.hover();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    
    // Wait for pan to complete
    await page.waitForTimeout(500);
    
    // Get viewport position after manual pan
    const pannedTransform = await getViewportTransform();
    expect(pannedTransform).not.toBe(initialTransform);
    
    // Click on a node to select it
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    
    // Wait to see if viewport moves (it shouldn't)
    await page.waitForTimeout(700); // Longer than fitView animation duration
    
    // Verify viewport hasn't moved
    const afterSelectionTransform = await getViewportTransform();
    expect(afterSelectionTransform).toBe(pannedTransform);
    
    // Click another node
    const secondNode = page.locator('.react-flow__node').nth(1);
    await secondNode.click();
    
    // Wait again
    await page.waitForTimeout(700);
    
    // Verify viewport still hasn't moved
    const afterSecondSelectionTransform = await getViewportTransform();
    expect(afterSecondSelectionTransform).toBe(pannedTransform);
  });

  test('Test 2: Viewport Zoom - should maintain zoom level during node selection', async ({ page }) => {
    // Get zoom level
    const getZoomLevel = async () => {
      return await page.evaluate(() => {
        const viewport = document.querySelector('.react-flow__viewport');
        if (!viewport) return null;
        const transform = window.getComputedStyle(viewport).transform;
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (!matrix) return null;
        const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
        return values[0]; // Scale X value
      });
    };

    // Wait for initial fitView
    await page.waitForTimeout(1000);
    
    // Zoom in using mouse wheel
    const reactFlow = page.locator('.react-flow');
    await reactFlow.hover();
    await page.mouse.wheel(0, -200); // Zoom in
    
    await page.waitForTimeout(500);
    const zoomedLevel = await getZoomLevel();
    
    // Select a node
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(700);
    
    // Verify zoom level unchanged
    const afterSelectionZoom = await getZoomLevel();
    expect(afterSelectionZoom).toBe(zoomedLevel);
  });

  test('Test 3: Graph Generation - SHOULD re-center viewport on new graph', async ({ page }) => {
    // Get viewport transform
    const getViewportTransform = async () => {
      return await page.evaluate(() => {
        const viewport = document.querySelector('.react-flow__viewport');
        if (!viewport) return null;
        const transform = window.getComputedStyle(viewport).transform;
        return transform;
      });
    };

    // Wait for initial fitView
    await page.waitForTimeout(1000);
    
    // Pan viewport away from center
    const reactFlowElement = page.locator('.react-flow');
    await reactFlowElement.hover();
    await page.mouse.down();
    await page.mouse.move(300, 300);
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    const pannedTransform = await getViewportTransform();
    
    // Generate new graph
    await page.click('button:has-text("Generate Graph")');
    
    // Wait for new graph and re-centering animation
    await page.waitForTimeout(1500);
    
    // Verify viewport has been re-centered (transform changed)
    const afterGenerateTransform = await getViewportTransform();
    expect(afterGenerateTransform).not.toBe(pannedTransform);
  });
});