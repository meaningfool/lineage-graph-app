import { test, expect } from '@playwright/test';
import targetLineageData from '../../apps/web/src/data/target-lineage.json';

test.describe('Data Lineage App - Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
    // Wait for nodes to be rendered
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });

  test('should render all nodes from target-lineage.json data', async ({ page }) => {
    // Test that specific nodes from the default data are present using actual data
    const expectedNodeLabels = targetLineageData.nodes.map(node => node.label);

    for (const nodeLabel of expectedNodeLabels) {
      // Look for node content that matches the expected labels
      await expect(page.locator('.react-flow__node', { hasText: nodeLabel })).toBeVisible({ timeout: 5000 });
    }

    // Verify we have the correct number of nodes based on source data
    await expect(page.locator('.react-flow__node')).toHaveCount(targetLineageData.nodes.length);
  });

  test('should display correct number of edges from data', async ({ page }) => {
    // Wait for edges to be rendered - use a longer timeout and wait for DOM element presence
    await page.waitForTimeout(2000); // Give ReactFlow time to render edges
    const edgeElements = page.locator('.react-flow__edge');
    await expect(edgeElements).toHaveCount(4, { timeout: 15000 });
  });

  test('should generate different graphs when Generate Graph button is clicked', async ({ page }) => {
    // Capture the default graph state
    const defaultNodeLabels = await page.locator('.react-flow__node').allTextContents();
    
    // Click Generate Graph once
    await page.click('button:has-text("Generate Graph")');
    await page.waitForTimeout(1500);
    
    // Get first generated graph state
    const firstGeneratedLabels = await page.locator('.react-flow__node').allTextContents();
    
    // Verify first generation is different from default
    expect(firstGeneratedLabels).not.toEqual(defaultNodeLabels);
    
    // Click Generate Graph again
    await page.click('button:has-text("Generate Graph")');
    await page.waitForTimeout(1500);
    
    // Get second generated graph state
    const secondGeneratedLabels = await page.locator('.react-flow__node').allTextContents();
    
    // Verify second generation is different from first generation
    expect(secondGeneratedLabels).not.toEqual(firstGeneratedLabels);
    
    // Ensure we still have nodes after each generation
    expect(firstGeneratedLabels.length).toBeGreaterThan(0);
    expect(secondGeneratedLabels.length).toBeGreaterThan(0);
  });
});