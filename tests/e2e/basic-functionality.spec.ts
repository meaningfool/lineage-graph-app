import { test, expect } from '@playwright/test';

test.describe('Data Lineage App - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load the app and display the main elements', async ({ page }) => {
    // Check that the main page elements are present
    await expect(page.locator('button:has-text("Generate Graph")')).toBeVisible();
    await expect(page.locator('select#edge-type-select')).toBeVisible();
    await expect(page.locator('label:has-text("Edge Type:")')).toBeVisible();
    
    // Check that the ReactFlow canvas is present
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('should display the default graph nodes', async ({ page }) => {
    // Wait for nodes to be rendered - expect the default graph to have nodes
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
    
    // Check that we have the expected number of nodes in the default graph
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
    // The default graph should have 5 nodes based on the test results
    expect(nodeCount).toBe(5);
  });

  test('should have Generate Graph button that works', async ({ page }) => {
    // Wait for initial nodes to be rendered
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
    
    // Click generate graph button
    await page.click('button:has-text("Generate Graph")');
    
    // Wait for new nodes to be rendered
    await page.waitForTimeout(1000);
    
    // Check that nodes are still present after generation
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
  });
});