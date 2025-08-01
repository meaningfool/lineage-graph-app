import { test, expect } from '@playwright/test'

test.describe('CSV Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for page to be ready
    await expect(page.getByRole('button', { name: 'Generate Graph' })).toBeVisible()
  })

  test('Test 1: opens import modal when button clicked', async ({ page }) => {
    // Click the Import CSV button
    await page.click('button:has-text("Import CSV")')
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Import Graph from CSV')).toBeVisible()
  })

  test('Test 2: closes modal when cancel clicked', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Import CSV")')
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Click cancel button
    await page.click('button:has-text("Cancel")')
    
    // Modal should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Test 3: closes modal when X button clicked', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Import CSV")')
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Click X close button
    await page.click('[aria-label="Close modal"]')
    
    // Modal should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Test 4: closes modal when clicking outside', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Import CSV")')
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Click outside the modal (on backdrop)
    await page.click('.modal-backdrop', { position: { x: 10, y: 10 } })
    
    // Modal should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})