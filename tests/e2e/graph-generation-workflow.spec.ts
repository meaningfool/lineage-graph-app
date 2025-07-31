import { test, expect } from '@playwright/test';
import targetLineageData from '../../apps/web/src/data/target-lineage.json';

test.describe('Data Lineage App - Graph Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
    // Wait for nodes to be rendered
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load app with main elements and default graph', async ({ page }) => {
    // Check that the main page elements are present
    await expect(page.locator('button:has-text("Generate Graph")')).toBeVisible();
    await expect(page.locator('select#edge-type-select')).toBeVisible();
    
    // Check that the ReactFlow canvas is present
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('should render nodes from target-lineage.json data', async ({ page }) => {
    // Test that specific nodes from the default data are present using actual data
    const expectedNodeLabels = targetLineageData.nodes.map(node => node.label);

    for (const nodeLabel of expectedNodeLabels) {
      // Look for node content that matches the expected labels
      await expect(page.locator('.react-flow__node', { hasText: nodeLabel })).toBeVisible({ timeout: 5000 });
    }
    
    // Verify we have the correct number of nodes based on source data
    await expect(page.locator('.react-flow__node')).toHaveCount(targetLineageData.nodes.length);
  });

  test('should display correct edge count from data', async ({ page }) => {
    // Wait for edges to be rendered - use a longer timeout and wait for DOM element presence
    await page.waitForTimeout(2000); // Give ReactFlow time to render edges
    const edgeElements = page.locator('.react-flow__edge');
    await expect(edgeElements).toHaveCount(targetLineageData.edges.length, { timeout: 15000 });
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

  test('should position camera optimally for default graph', async ({ page }) => {
    // Get the ReactFlow viewport bounds
    const reactFlowElement = page.locator('.react-flow');
    const viewportBounds = await reactFlowElement.boundingBox();
    
    if (!viewportBounds) {
      throw new Error('Could not get ReactFlow viewport bounds');
    }
    
    // Get all node positions
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);
    
    // Check that nodes are positioned within reasonable viewport bounds
    // This validates that fitView is working - nodes should be visible and well-positioned
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes.nth(i);
      const nodeBounds = await node.boundingBox();
      
      if (nodeBounds) {
        // Node should be within the ReactFlow viewport (with some tolerance for padding)
        expect(nodeBounds.x).toBeGreaterThan(viewportBounds.x - 50);
        expect(nodeBounds.y).toBeGreaterThan(viewportBounds.y - 50);
        expect(nodeBounds.x + nodeBounds.width).toBeLessThan(viewportBounds.x + viewportBounds.width + 50);
        expect(nodeBounds.y + nodeBounds.height).toBeLessThan(viewportBounds.y + viewportBounds.height + 50);
      }
    }
  });

  test('should reposition camera when generating new graphs', async ({ page }) => {
    // Get initial node positions to establish baseline
    const initialNodes = page.locator('.react-flow__node');
    const initialNodePositions = [];
    
    const initialCount = await initialNodes.count();
    for (let i = 0; i < initialCount; i++) {
      const bounds = await initialNodes.nth(i).boundingBox();
      if (bounds) initialNodePositions.push({ x: bounds.x, y: bounds.y });
    }
    
    // Generate a new graph
    await page.click('button:has-text("Generate Graph")');
    await page.waitForTimeout(1500); // Wait for generation and camera adjustment
    
    // Get new node positions after camera repositioning
    const newNodes = page.locator('.react-flow__node');
    const newNodePositions = [];
    
    const newCount = await newNodes.count();
    expect(newCount).toBeGreaterThan(0);
    
    // Collect new positions
    for (let i = 0; i < newCount; i++) {
      const bounds = await newNodes.nth(i).boundingBox();
      if (bounds) newNodePositions.push({ x: bounds.x, y: bounds.y });
    }
    
    // Verify that the camera has repositioned the graph optimally
    // The exact positions may be different, but all nodes should still be well-positioned in viewport
    const reactFlowBounds = await page.locator('.react-flow').boundingBox();
    if (!reactFlowBounds) throw new Error('Could not get ReactFlow bounds');
    
    // All new nodes should be within viewport bounds (validates camera repositioned correctly)
    for (const position of newNodePositions) {
      expect(position.x).toBeGreaterThan(reactFlowBounds.x - 50);
      expect(position.y).toBeGreaterThan(reactFlowBounds.y - 50);
      expect(position.x).toBeLessThan(reactFlowBounds.x + reactFlowBounds.width + 50);
      expect(position.y).toBeLessThan(reactFlowBounds.y + reactFlowBounds.height + 50);
    }
  });
});