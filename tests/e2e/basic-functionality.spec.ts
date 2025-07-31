import { test, expect } from '@playwright/test';
import targetLineageData from '../../apps/web/src/data/target-lineage.json';

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
    
    // Check that the ReactFlow canvas is present
    await expect(page.locator('.react-flow')).toBeVisible();
  });


});