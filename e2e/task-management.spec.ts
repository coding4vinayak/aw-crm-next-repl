import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.use({ storageState: 'e2e/auth.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks')
  })

  test('should display task list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tasks')
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible()
    
    // Verify test tasks are displayed
    await expect(page.locator('text=Follow up with John')).toBeVisible()
    await expect(page.locator('text=Send proposal to Jane')).toBeVisible()
  })

  test('should create new task', async ({ page }) => {
    await page.click('button:has-text("New Task")')
    
    await page.fill('[name="title"]', 'Test Task')
    await page.fill('[name="description"]', 'This is a test task')
    await page.selectOption('[name="priority"]', 'HIGH')
    await page.fill('[name="dueDate"]', '2024-12-31')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Task created successfully')).toBeVisible()
    await expect(page.locator('text=Test Task')).toBeVisible()
  })

  test('should filter tasks by status', async ({ page }) => {
    await page.click('[data-testid="status-filter"]')
    await page.click('text=To Do')
    
    const taskRows = page.locator('[data-testid="task-row"]')
    const count = await taskRows.count()
    
    for (let i = 0; i < count; i++) {
      await expect(taskRows.nth(i).locator('[data-testid="status-badge"]')).toContainText('TODO')
    }
  })

  test('should update task status', async ({ page }) => {
    await page.click('[data-testid="task-menu-Follow up with John"]')
    await page.click('text=Mark as In Progress')
    
    await expect(page.locator('text=Task updated successfully')).toBeVisible()
    await expect(page.locator('[data-testid="status-badge"]:has-text("IN_PROGRESS")')).toBeVisible()
  })

  test('should search tasks', async ({ page }) => {
    await page.fill('[placeholder*="Search"]', 'Follow up')
    await page.waitForTimeout(500)
    
    await expect(page.locator('text=Follow up with John')).toBeVisible()
    await expect(page.locator('text=Send proposal to Jane')).not.toBeVisible()
  })
})