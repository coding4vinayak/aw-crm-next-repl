import { test, expect } from '@playwright/test'

test.describe('Customer Management', () => {
  test.use({ storageState: 'e2e/auth.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/customers')
  })

  test('should display customer list', async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Customers')
    
    // Check if customer table/list is visible
    await expect(page.locator('[data-testid="customer-list"]')).toBeVisible()
    
    // Verify test customers are displayed
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=Jane Smith')).toBeVisible()
  })

  test('should search customers', async ({ page }) => {
    // Wait for search input to be visible
    await expect(page.locator('[placeholder*="Search"]')).toBeVisible()
    
    // Search for a specific customer
    await page.fill('[placeholder*="Search"]', 'John')
    
    // Wait for search results
    await page.waitForTimeout(500)
    
    // Verify search results
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=Jane Smith')).not.toBeVisible()
  })

  test('should create new customer', async ({ page }) => {
    // Click create customer button
    await page.click('button:has-text("New Customer")')
    
    // Fill in customer form
    await page.fill('[name="firstName"]', 'New')
    await page.fill('[name="lastName"]', 'Customer')
    await page.fill('[name="email"]', 'new.customer@example.com')
    await page.fill('[name="company"]', 'New Company')
    await page.fill('[name="phone"]', '+1234567890')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify success message or redirect
    await expect(page.locator('text=Customer created successfully')).toBeVisible()
    
    // Verify new customer appears in list
    await expect(page.locator('text=New Customer')).toBeVisible()
  })

  test('should edit customer', async ({ page }) => {
    // Click on a customer to view details
    await page.click('text=John Doe')
    
    // Click edit button
    await page.click('button:has-text("Edit")')
    
    // Update customer information
    await page.fill('[name="company"]', 'Updated Company')
    
    // Save changes
    await page.click('button:has-text("Save")')
    
    // Verify success message
    await expect(page.locator('text=Customer updated successfully')).toBeVisible()
    
    // Verify updated information is displayed
    await expect(page.locator('text=Updated Company')).toBeVisible()
  })

  test('should filter customers by status', async ({ page }) => {
    // Click on status filter
    await page.click('[data-testid="status-filter"]')
    
    // Select active status
    await page.click('text=Active')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="customer-list"]')).toBeVisible()
    
    // All visible customers should be active
    const customerRows = page.locator('[data-testid="customer-row"]')
    const count = await customerRows.count()
    
    for (let i = 0; i < count; i++) {
      await expect(customerRows.nth(i).locator('[data-testid="status-badge"]')).toContainText('Active')
    }
  })

  test('should view customer details', async ({ page }) => {
    // Click on a customer
    await page.click('text=John Doe')
    
    // Verify customer details page
    await expect(page.locator('h1')).toContainText('John Doe')
    await expect(page.locator('text=john.doe@example.com')).toBeVisible()
    await expect(page.locator('text=Acme Corp')).toBeVisible()
    
    // Verify tabs are present
    await expect(page.locator('text=Overview')).toBeVisible()
    await expect(page.locator('text=Activities')).toBeVisible()
    await expect(page.locator('text=Deals')).toBeVisible()
    await expect(page.locator('text=Tasks')).toBeVisible()
  })

  test('should delete customer', async ({ page }) => {
    // Click on customer options menu
    await page.click('[data-testid="customer-menu-John Doe"]')
    
    // Click delete option
    await page.click('text=Delete')
    
    // Confirm deletion in modal
    await page.click('button:has-text("Delete Customer")')
    
    // Verify success message
    await expect(page.locator('text=Customer deleted successfully')).toBeVisible()
    
    // Verify customer is removed from list
    await expect(page.locator('text=John Doe')).not.toBeVisible()
  })

  test('should handle pagination', async ({ page }) => {
    // Check if pagination is visible (assuming there are enough customers)
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page"]')
      
      // Verify URL or content changed
      await expect(page.url()).toContain('page=2')
      
      // Click previous page
      await page.click('[data-testid="prev-page"]')
      
      // Verify we're back to page 1
      await expect(page.url()).toContain('page=1')
    }
  })

  test('should export customer data', async ({ page }) => {
    // Click export button
    await page.click('button:has-text("Export")')
    
    // Select export format
    await page.click('text=CSV')
    
    // Wait for download to start
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Download")')
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('customers')
    expect(download.suggestedFilename()).toContain('.csv')
  })
})