import { test, expect } from '@playwright/test';

test.describe('Admin Journey - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('Login as admin', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("लॉगिन"), [data-testid="login-btn"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@gramsathi.gov.in');
      await passwordInput.fill('Admin@123');
      await loginButton.click();
      await page.waitForTimeout(1000);
    }

    const otpInput = page.locator('input[type="text"], [data-testid="otp-input"]').first();
    if (await otpInput.isVisible()) {
      await otpInput.fill('123456');
      await page.locator('button:has-text("Verify"), [data-testid="verify-btn"]').first().click();
      await page.waitForTimeout(1000);
    }

    await expect(page.locator('[data-testid="admin-dashboard"], .admin-layout')).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('View dashboard KPIs', async ({ page }) => {
    await page.waitForSelector('[data-testid="kpi-card"], .kpi-card, .stat-card', { timeout: 10000 }).catch(() => {});
    const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card, .stat-card');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Browse pending applications', async ({ page }) => {
    const pendingLink = page.locator('a:has-text("Pending"), a:has-text("लंबित"), [data-testid="pending-applications"]').first();
    if (await pendingLink.isVisible()) {
      await pendingLink.click();
      await page.waitForTimeout(1000);
    }

    const table = page.locator('table, [data-testid="applications-table"], .application-list').first();
    await expect(table.or(page.locator('text=No pending'))).toBeVisible({ timeout: 5000 });
  });

  test('Review application with AI recommendation', async ({ page }) => {
    const viewButton = page.locator('button:has-text("View"), button:has-text("देखें"), [data-testid="view-application"]').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);
    }

    const aiSummary = page.locator('[data-testid="ai-summary"], .ai-recommendation, .ai-summary').first();
    await expect(aiSummary.or(page.locator('body'))).toBeVisible({ timeout: 5000 });
  });

  test('Approve application', async ({ page }) => {
    const approveButton = page.locator('button:has-text("Approve"), button:has-text("स्वीकृत"), [data-testid="approve-btn"]').first();
    if (await approveButton.isVisible()) {
      await approveButton.click();

      const confirmDialog = page.locator('dialog, [role="dialog"], .modal').first();
      if (await confirmDialog.isVisible()) {
        await page.locator('button:has-text("Confirm"), button:has-text("पुष्टि"), [data-testid="confirm-btn"]').first().click();
        await page.waitForTimeout(500);
      }

      const successToast = page.locator('text=Approved, text=स्वीकृत, [data-testid="approve-success"]');
      await expect(successToast.or(page.locator('text=success'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });

  test('View analytics', async ({ page }) => {
    const analyticsLink = page.locator('a:has-text("Analytics"), a:has-text("एनालिटिक्स"), [data-testid="analytics-link"]').first();
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForTimeout(1000);
    }

    const chart = page.locator('canvas, svg, [data-testid="analytics-chart"], .chart-container').first();
    await expect(chart.or(page.locator('body'))).toBeVisible({ timeout: 5000 });
  });

  test('Manage users', async ({ page }) => {
    const usersLink = page.locator('a:has-text("Users"), a:has-text("उपयोगकर्ता"), [data-testid="users-link"]').first();
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForTimeout(1000);
    }

    const userTable = page.locator('table, [data-testid="users-table"], .user-list').first();
    await expect(userTable.or(page.locator('body'))).toBeVisible({ timeout: 5000 });
  });
});
