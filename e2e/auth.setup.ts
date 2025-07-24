import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/auth.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/signin')

  // Fill in login form
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for successful login and redirect
  await page.waitForURL('/dashboard')
  
  // Verify we're logged in by checking for user menu or dashboard content
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
})