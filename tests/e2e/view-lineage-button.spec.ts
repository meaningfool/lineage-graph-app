import { test, expect } from '@playwright/test'

test.describe('View Lineage Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 })
  })

  test('Test 1: View Lineage button appears in side panel when node is selected', async ({ page }) => {
    // Click on a node to open side panel
    const firstNode = page.locator('.react-flow__node').first()
    await firstNode.click()

    // Wait for side panel to appear
    await expect(page.getByTestId('side-panel')).toBeVisible()

    // Check that View Lineage button exists
    const viewLineageButton = page.getByTestId('view-lineage-button')
    await expect(viewLineageButton).toBeVisible()
    await expect(viewLineageButton).toHaveText('View Lineage')
  })
})