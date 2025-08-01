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
    
    // Find the focus node using a more direct approach
    // Look for the ReactFlow node that contains the selected node's text and has the focus-node class
    const focusNode = page.locator('.react-flow__node').filter({ hasText: selectedNodeLabel }).locator('div').first()
    
    // Test that the focus node has a special visual indicator
    // The focus-node class should be on the custom node div
    await expect(focusNode).toHaveClass(/focus-node/)
    
    // Test that other nodes do not have the focus indicator
    const allNodes = page.locator('.react-flow__node')
    const nodeCount = await allNodes.count()
    
    for (let i = 0; i < nodeCount; i++) {
      const node = allNodes.nth(i)
      const nodeText = await node.textContent()
      
      if (nodeText !== selectedNodeLabel) {
        // Non-focus nodes should not have the focus class
        const nodeDiv = node.locator('div').first()
        await expect(nodeDiv).not.toHaveClass(/focus-node/)
      }
    }
  })

  test('Test 4: Continuous lineage exploration allows viewing lineage of nodes within lineage view', async ({ page }) => {
    // Step 1: Click on first node (Node A) to open side panel
    const firstNode = page.locator('.react-flow__node').first()
    await firstNode.click()
    
    // Get Node A's label
    const sidePanel = page.getByTestId('side-panel')
    await expect(sidePanel).toBeVisible()
    const nodeALabel = await sidePanel.locator('h3').textContent()
    
    // Step 2: Click View Lineage button to view Node A's lineage
    const viewLineageButton = page.getByTestId('view-lineage-button')
    await viewLineageButton.click()
    await page.waitForTimeout(500)
    
    // Verify Node A has focus styling
    const focusNodeA = page.locator('.react-flow__node').filter({ hasText: nodeALabel }).locator('div').first()
    await expect(focusNodeA).toHaveClass(/focus-node/)
    
    // Step 3: Select a different node (Node B) in the lineage view
    const allNodes = page.locator('.react-flow__node')
    const nodeCount = await allNodes.count()
    
    // Find a node that's NOT Node A
    let nodeBElement
    let nodeBLabel
    for (let i = 0; i < nodeCount; i++) {
      const node = allNodes.nth(i)
      const nodeText = await node.textContent()
      
      if (nodeText !== nodeALabel) {
        nodeBElement = node
        nodeBLabel = nodeText
        break
      }
    }
    
    expect(nodeBElement).toBeDefined()
    expect(nodeBLabel).toBeDefined()
    
    // Click on Node B
    await nodeBElement.click()
    
    // Verify side panel shows Node B
    await expect(sidePanel.locator('h3')).toHaveText(nodeBLabel)
    
    // Step 4: Verify "View Lineage" button IS visible for Node B (different from current behavior)
    await expect(viewLineageButton).toBeVisible()
    await expect(viewLineageButton).toHaveText('View Lineage')
    
    // Step 5: Click View Lineage for Node B
    await viewLineageButton.click()
    await page.waitForTimeout(500)
    
    // Step 6: Verify Node B becomes the new focus node
    const focusNodeB = page.locator('.react-flow__node').filter({ hasText: nodeBLabel }).locator('div').first()
    await expect(focusNodeB).toHaveClass(/focus-node/)
    
    // Step 7: Verify Node A no longer has focus styling (if it exists in new lineage)
    const possibleNodeA = page.locator('.react-flow__node').filter({ hasText: nodeALabel }).locator('div').first()
    const nodeAExists = await possibleNodeA.count() > 0
    
    if (nodeAExists) {
      // If Node A exists in Node B's lineage, it should not have focus class
      await expect(possibleNodeA).not.toHaveClass(/focus-node/)
    }
    
    // Step 8: Verify side panel still shows Node B and remains open
    await expect(sidePanel).toBeVisible()
    await expect(sidePanel.locator('h3')).toHaveText(nodeBLabel)
  })
})