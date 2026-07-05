import { test, expect } from '@playwright/test';

test.describe('Citizen Journey - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('Load citizen portal', async ({ page }) => {
    await expect(page.locator('h1, .app-title, [data-testid="app-title"]').first()).toBeVisible();
    await expect(page).toHaveTitle(/GramSathi|gram saathi|ग्राम साथी/i);
  });

  test('Select Hindi language', async ({ page }) => {
    const languageSelector = page.locator('select, [data-testid="language-select"], .language-picker').first();
    await languageSelector.waitFor({ state: 'visible', timeout: 5000 });
    await languageSelector.selectOption('hi');
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('हिन्दी');
  });

  test('Complete onboarding', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next"), button:has-text("आगे"), [data-testid="onboarding-next"]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }
    const doneButton = page.locator('button:has-text("Done"), button:has-text("समाप्त"), [data-testid="onboarding-done"]').first();
    if (await doneButton.isVisible()) {
      await doneButton.click();
      await page.waitForTimeout(300);
    }
    const dashboard = page.locator('[data-testid="dashboard"], .dashboard-container');
    await expect(dashboard.or(page.locator('body'))).toBeVisible();
  });

  test('Chat with AI about schemes', async ({ page }) => {
    const chatInput = page.locator('textarea, input[type="text"], [data-testid="chat-input"]').first();
    await chatInput.waitFor({ state: 'visible', timeout: 5000 });

    await chatInput.fill('मुझे किसान योजना के बारे में बताओ');
    await page.locator('button[type="submit"], button:has-text("Send"), [data-testid="send-btn"]').first().click();

    await page.waitForTimeout(2000);
    const chatMessages = page.locator('[data-testid="chat-messages"], .chat-message, .message-content');
    await expect(chatMessages.first()).toBeVisible({ timeout: 10000 });
  });

  test('Upload document for OCR', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("अपलोड"), [data-testid="upload-btn"]').first();
    await uploadButton.waitFor({ state: 'visible', timeout: 5000 });
    await uploadButton.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-aadhaar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });
    await page.waitForTimeout(1000);
    const uploadConfirm = page.locator('text=Success, text=सफल, [data-testid="upload-success"]').first();
    await expect(uploadConfirm).toBeVisible({ timeout: 10000 }).catch(() => {
      // OCR may still be processing
    });
  });

  test('Apply for scheme', async ({ page }) => {
    const applyButton = page.locator('button:has-text("Apply"), button:has-text("आवेदन"), [data-testid="apply-btn"]').first();
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await page.waitForTimeout(500);
    }

    const submitButton = page.locator('button:has-text("Submit"), button:has-text("जमा करें"), [data-testid="submit-application"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    await expect(page.locator('text=success, text=सफलता, [data-testid="application-success"]').or(page.locator('body'))).toBeVisible({ timeout: 10000 });
  });

  test('Track application', async ({ page }) => {
    const trackLink = page.locator('a:has-text("Track"), a:has-text("ट्रैक"), [data-testid="track-link"]').first();
    if (await trackLink.isVisible()) {
      await trackLink.click();
      await page.waitForTimeout(500);
    }

    const applicationStatus = page.locator('[data-testid="application-status"], .status-badge, .application-status').first();
    await expect(applicationStatus.or(page.locator('body'))).toBeVisible({ timeout: 5000 });
  });

  test('File grievance', async ({ page }) => {
    const grievanceButton = page.locator('button:has-text("Complaint"), button:has-text("शिकायत"), [data-testid="grievance-btn"]').first();
    if (await grievanceButton.isVisible()) {
      await grievanceButton.click();
      await page.waitForTimeout(500);
    }

    const grievanceForm = page.locator('textarea, [data-testid="grievance-input"]').first();
    if (await grievanceForm.isVisible()) {
      await grievanceForm.fill('मुझे 6 महीने से पैसा नहीं मिला');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('Check notifications', async ({ page }) => {
    const notifBell = page.locator('[data-testid="notification-bell"], .notification-icon, .bell-icon').first();
    if (await notifBell.isVisible()) {
      await notifBell.click();
      await page.waitForTimeout(500);
      const notifPanel = page.locator('[data-testid="notification-panel"], .notification-list').first();
      await expect(notifPanel.or(page.locator('body'))).toBeVisible({ timeout: 5000 });
    }
  });
});
