import { test, expect } from '@playwright/test';

test.describe('Data Lineage App - Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
    // Wait for nodes to be rendered
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });

  test('should render all nodes from target-lineage.json data', async ({ page }) => {
    // Test that specific nodes from the default data are present
    const expectedNodeLabels = [
      'New Users',
      'Paid User %', 
      'Average Revenue Per User',
      'New Paid Users',
      'New MRR'
    ];

    for (const nodeLabel of expectedNodeLabels) {
      // Look for node content that matches the expected labels
      await expect(page.locator('.react-flow__node', { hasText: nodeLabel })).toBeVisible({ timeout: 5000 });
    }

    // Verify we have exactly 5 nodes (the default graph size)
    await expect(page.locator('.react-flow__node')).toHaveCount(5);
  });

  test('should display correct number of edges from data', async ({ page }) => {
    // Wait for edges to be rendered - use a longer timeout and wait for DOM element presence
    await page.waitForTimeout(2000); // Give ReactFlow time to render edges
    const edgeElements = page.locator('.react-flow__edge');
    await expect(edgeElements).toHaveCount(4, { timeout: 15000 });
    
    // Verify at least one edge is present (visibility can be tricky with ReactFlow)
    const edgeCount = await edgeElements.count();
    expect(edgeCount).toBe(4);
  });

  test('should generate meaningful node labels in generated graphs', async ({ page }) => {
    // Click generate graph button
    await page.click('button:has-text("Generate Graph")');
    await page.waitForTimeout(1500);
    
    // Get all generated node labels
    const nodeLabels = await page.locator('.react-flow__node').allTextContents();
    
    // Verify we have nodes and they have meaningful labels
    expect(nodeLabels.length).toBeGreaterThan(0);
    
    for (const label of nodeLabels) {
      const cleanLabel = label.trim();
      expect(cleanLabel).toBeTruthy();
      expect(cleanLabel).not.toBe('undefined');
      expect(cleanLabel.length).toBeGreaterThan(0);
      // Labels should contain recognizable words (not just random strings)
      expect(cleanLabel).toMatch(/^[A-Za-z\s]+/);
    }
  });

  test('should initially load default data before Generate Graph is clicked', async ({ page }) => {
    // Before clicking Generate Graph, we should see the default node labels
    const nodeLabels = await page.locator('.react-flow__node').allTextContents();
    
    // Check for some expected default labels (partial matches)
    const hasNewUsers = nodeLabels.some(label => label.includes('New Users'));
    const hasPaidUser = nodeLabels.some(label => label.includes('Paid User'));
    const hasRevenue = nodeLabels.some(label => label.includes('Revenue'));
    
    expect(hasNewUsers || hasPaidUser || hasRevenue).toBe(true);
  });
});