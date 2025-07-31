import { test, expect } from '@playwright/test';

test.describe('Data Lineage App - Graph Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
    // Wait for nodes to be rendered
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show all available edge type options', async ({ page }) => {
    const edgeSelect = page.locator('select#edge-type-select');
    
    // Check that all edge type options are available
    const options = await edgeSelect.locator('option').allTextContents();
    
    expect(options).toContain('Bezier (Default)');
    expect(options).toContain('Straight');
    expect(options).toContain('Step');
    expect(options).toContain('Smooth Step');
    expect(options.length).toBe(4);
  });

  test('should have correct default edge type selected', async ({ page }) => {
    const edgeSelect = page.locator('select#edge-type-select');
    const selectedValue = await edgeSelect.inputValue();
    
    expect(selectedValue).toBe('smoothstep');
  });

  test('should change edge type when dropdown selection changes', async ({ page }) => {
    const edgeSelect = page.locator('select#edge-type-select');
    
    // Check default edge type is set
    await expect(edgeSelect).toHaveValue('smoothstep');
    
    // Change edge type
    await edgeSelect.selectOption('straight');
    await expect(edgeSelect).toHaveValue('straight');
    
    // Change to another edge type
    await edgeSelect.selectOption('step');
    await expect(edgeSelect).toHaveValue('step');
  });


  test('should maintain graph visibility after edge type changes', async ({ page }) => {
    // Get initial node count
    const initialNodeCount = await page.locator('.react-flow__node').count();
    
    // Change edge type
    const edgeSelect = page.locator('select#edge-type-select');
    await edgeSelect.selectOption('straight');
    
    // Give ReactFlow time to re-render with new edge type
    await page.waitForTimeout(1000);
    
    // Nodes should still be visible and same count
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    const afterNodeCount = await page.locator('.react-flow__node').count();
    expect(afterNodeCount).toBe(initialNodeCount);
    
    // Edges should still be present (count is more reliable than visibility)
    const edgeCount = await page.locator('.react-flow__edge').count();
    expect(edgeCount).toBeGreaterThan(0);
  });


  test('should handle rapid edge type switching', async ({ page }) => {
    const edgeSelect = page.locator('select#edge-type-select');
    
    // Rapidly switch between edge types
    await edgeSelect.selectOption('straight');
    await edgeSelect.selectOption('step');
    await edgeSelect.selectOption('smoothstep');
    await edgeSelect.selectOption('default');
    
    // Give ReactFlow time to settle after rapid changes
    await page.waitForTimeout(1500);
    
    // Graph should remain stable
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    
    // Verify edges are still present
    const edgeCount = await page.locator('.react-flow__edge').count();
    expect(edgeCount).toBeGreaterThan(0);
    
    // Final selection should be correct
    expect(await edgeSelect.inputValue()).toBe('default');
  });

  test('should display graph controls in correct positions', async ({ page }) => {
    // Generate Graph button should be visible and positioned
    const generateButton = page.locator('button:has-text("Generate Graph")');
    await expect(generateButton).toBeVisible();
    
    // Edge type selector should be visible and positioned
    const edgeTypeLabel = page.locator('label:has-text("Edge Type:")');
    const edgeTypeSelect = page.locator('select#edge-type-select');
    
    await expect(edgeTypeLabel).toBeVisible();
    await expect(edgeTypeSelect).toBeVisible();
    
    // Controls should be in the top-left area (check they're positioned absolutely)
    const generateButtonBox = await generateButton.boundingBox();
    const selectBox = await edgeTypeSelect.boundingBox();
    
    // Both controls should be in upper portion of screen
    expect(generateButtonBox?.y).toBeLessThan(100);
    expect(selectBox?.y).toBeLessThan(100);
  });
});