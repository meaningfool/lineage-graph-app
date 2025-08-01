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

  test('Test 2: Clicking View Lineage loads new graph with selection persistence', async ({ page }) => {
    // Click on a node to open side panel
    const firstNode = page.locator('.react-flow__node').first()
    await firstNode.click()
    
    // Get the selected node's label from side panel
    const sidePanel = page.getByTestId('side-panel')
    await expect(sidePanel).toBeVisible()
    const selectedNodeLabel = await sidePanel.locator('h3').textContent()
    
    // Count initial nodes
    const initialNodeCount = await page.locator('.react-flow__node').count()
    
    // Click View Lineage button
    const viewLineageButton = page.getByTestId('view-lineage-button')
    await viewLineageButton.click()
    
    // Wait a bit for graph to update
    await page.waitForTimeout(500)
    
    // Test that a new graph loads (node count should change)
    const newNodeCount = await page.locator('.react-flow__node').count()
    expect(newNodeCount).not.toBe(initialNodeCount)
    
    // Test that side panel remains open
    await expect(sidePanel).toBeVisible()
    
    // Test that a node with the same label remains selected
    const currentSelectedLabel = await sidePanel.locator('h3').textContent()
    expect(currentSelectedLabel).toBe(selectedNodeLabel)
    
    // Test that View Lineage button is NOT visible after first use
    await expect(viewLineageButton).not.toBeVisible()
  })

  test('Test 3: Focus node has special visual indicator in lineage view', async ({ page }) => {
    // Click on a node to open side panel
    const firstNode = page.locator('.react-flow__node').first()
    await firstNode.click()
    
    // Get the selected node's label
    const sidePanel = page.getByTestId('side-panel')
    await expect(sidePanel).toBeVisible()
    const selectedNodeLabel = await sidePanel.locator('h3').textContent()
    
    // Click View Lineage button
    const viewLineageButton = page.getByTestId('view-lineage-button')
    await viewLineageButton.click()
    
    // Wait for lineage view to load
    await page.waitForTimeout(500)
    
    // Find the focus node (the one whose lineage we're viewing)
    const focusNode = page.locator('.react-flow__node').locator(`text=${selectedNodeLabel}`).locator('..').first()
    
    // Test that the focus node has a special visual indicator
    // The focus-node class should be on the outer container div
    await expect(focusNode).toHaveClass(/focus-node/)
    
    // Test that other nodes do not have the focus indicator
    const allNodes = page.locator('.react-flow__node')
    const nodeCount = await allNodes.count()
    
    for (let i = 0; i < nodeCount; i++) {
      const node = allNodes.nth(i)
      const nodeText = await node.textContent()
      
      if (nodeText !== selectedNodeLabel) {
        // Non-focus nodes should not have the focus class
        await expect(node).not.toHaveClass(/focus-node/)
      }
    }
  })
})