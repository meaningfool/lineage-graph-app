import { test, expect } from '@playwright/test';

test.describe('Data Lineage App - Side Panel Complete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });

  // ===== BASIC SIDE PANEL FUNCTIONALITY =====
  
  test('should show side panel with node properties when clicking on a node', async ({ page }) => {
    // Initially, side panel should not be visible
    await expect(page.getByTestId('side-panel')).not.toBeVisible();
    
    // Click on the first node
    await page.locator('.react-flow__node').first().click();
    
    // Side panel should now be visible
    const sidePanel = page.getByTestId('side-panel');
    await expect(sidePanel).toBeVisible();
    
    // Should display node properties properly
    await expect(sidePanel.locator('h3')).toBeVisible();
    const nodeTitle = await sidePanel.locator('h3').textContent();
    expect(nodeTitle).toBeTruthy();
    
    // Should have at least one property with actual values
    await expect(sidePanel.locator('[data-testid^="property-"]').first()).toBeVisible();
    const propertyCount = await sidePanel.locator('[data-testid^="property-"]').count();
    expect(propertyCount).toBeGreaterThan(0);
  });

  test('should handle complete open-close-reopen cycle correctly', async ({ page }) => {
    // 1. Initially no panel should be visible
    await expect(page.getByTestId('side-panel')).not.toBeVisible();
    
    // 2. Click first node to open panel
    await page.locator('.react-flow__node').first().click();
    let sidePanel = page.getByTestId('side-panel');
    await expect(sidePanel).toBeVisible();
    
    // 3. Click close button to close panel
    await page.getByTestId('close-side-panel').click();
    await expect(page.getByTestId('side-panel')).not.toBeVisible();
    
    // 4. Click second node to reopen panel with different content
    await page.locator('.react-flow__node').nth(1).click();
    sidePanel = page.getByTestId('side-panel');
    await expect(sidePanel).toBeVisible();
    const secondNodeTitle = await sidePanel.locator('h3').textContent();
    expect(secondNodeTitle).toBeTruthy();
    
    // 5. Close again to verify panel can be closed after reopening
    await page.getByTestId('close-side-panel').click();
    await expect(page.getByTestId('side-panel')).not.toBeVisible();
  });

  test('should handle transitions correctly for opening and node switching', async ({ page }) => {
    // Click the node to open panel
    await page.locator('.react-flow__node').first().click();
    
    // Verify side panel has transition classes when opening
    const sidePanel = page.getByTestId('side-panel');
    await expect(sidePanel).toHaveClass(/transition-transform/);
    
    // When switching to another node (panel already open), should not trigger new transition
    // Panel should remain visible and just update content
    await page.locator('.react-flow__node').nth(1).click();
    await expect(sidePanel).toBeVisible();
    await expect(sidePanel).toHaveClass(/transition-transform/);
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Click on a node first
    await page.locator('.react-flow__node').first().click();
    await expect(page.getByTestId('side-panel')).toBeVisible();
    
    // Focus on the close button and press Enter
    await page.getByTestId('close-side-panel').focus();
    await page.keyboard.press('Enter');
    
    // Side panel should close
    await expect(page.getByTestId('side-panel')).not.toBeVisible();
  });

  // ===== CONTENT AND PROPERTY DISPLAY =====

  test('should update side panel content when clicking different nodes', async ({ page }) => {
    // Click on the first node
    await page.locator('.react-flow__node').first().click();
    await expect(page.getByTestId('side-panel')).toBeVisible();
    
    const sidePanel = page.getByTestId('side-panel');
    
    // Get the first node's info
    const firstNodeTitle = await sidePanel.locator('h3').textContent();
    const firstNodeProperties = await sidePanel.locator('[data-testid^="property-"]').allTextContents();
    
    // Click on a different node (second node)
    await page.locator('.react-flow__node').nth(1).click();
    
    // Side panel should still be visible
    await expect(sidePanel).toBeVisible();
    
    // Get the second node's info
    const secondNodeTitle = await sidePanel.locator('h3').textContent();
    const secondNodeProperties = await sidePanel.locator('[data-testid^="property-"]').allTextContents();
    
    // Verify content updated (either title or properties should be different)
    const titleChanged = firstNodeTitle !== secondNodeTitle;
    const propertiesChanged = JSON.stringify(firstNodeProperties) !== JSON.stringify(secondNodeProperties);
    
    expect(titleChanged || propertiesChanged).toBe(true);
  });


  // ===== BEHAVIOR WITH GRAPH CHANGES =====

  test('should maintain side panel state after graph regeneration', async ({ page }) => {
    // Click on a node to open side panel
    await page.locator('.react-flow__node').first().click();
    await expect(page.getByTestId('side-panel')).toBeVisible();
    
    // Click generate graph button
    await page.click('button:has-text("Generate Graph")');
    
    // Wait for new nodes to be rendered
    await page.waitForTimeout(1500);
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    
    // Side panel should still be visible after graph regeneration
    await expect(page.getByTestId('side-panel')).toBeVisible();
    
    // We can click on a new node to verify functionality still works
    await page.locator('.react-flow__node').first().click();
    await expect(page.getByTestId('side-panel')).toBeVisible();
  });

});