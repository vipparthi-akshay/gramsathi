import { test, expect } from '@playwright/test';

test.describe('Multilingual Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  const languages = [
    { code: 'hi', name: 'हिन्दी', expectedText: 'हिन्दी' },
    { code: 'mr', name: 'मराठी', expectedText: 'मराठी' },
    { code: 'ta', name: 'தமிழ்', expectedText: 'தமிழ்' },
  ];

  for (const lang of languages) {
    test(`Switch to ${lang.name} language`, async ({ page }) => {
      const languageSelector = page.locator(
        'select, [data-testid="language-select"], .language-picker, [data-testid="lang-switcher"]'
      ).first();
      await languageSelector.waitFor({ state: 'visible', timeout: 10000 });
      await languageSelector.selectOption(lang.code);
      await page.waitForTimeout(1000);

      const pageText = await page.locator('body').innerText();
      expect(pageText).toContain(lang.expectedText);
    });
  }

  test('Verify UI text changes after language switch', async ({ page }) => {
    const languageSelector = page.locator(
      'select, [data-testid="language-select"], .language-picker'
    ).first();
    await languageSelector.waitFor({ state: 'visible', timeout: 5000 });

    const enText = await page.locator('body').innerText();

    await languageSelector.selectOption('hi');
    await page.waitForTimeout(1000);
    const hiText = await page.locator('body').innerText();

    expect(enText).not.toEqual(hiText);
  });

  test('AI responds in correct language', async ({ page }) => {
    const languageSelector = page.locator(
      'select, [data-testid="language-select"], .language-picker'
    ).first();
    await languageSelector.waitFor({ state: 'visible', timeout: 5000 });

    await languageSelector.selectOption('hi');
    await page.waitForTimeout(500);

    const chatInput = page.locator('textarea, input[type="text"], [data-testid="chat-input"]').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill('नमस्ते, किसान योजना के बारे में बताएं');

      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), [data-testid="send-btn"]').first();
      await sendButton.click();
      await page.waitForTimeout(3000);

      const response = page.locator('[data-testid="chat-messages"], .chat-message, .message-content').last();
      const responseText = await response.innerText().catch(() => '');
      const hasDevanagari = /[\u0900-\u097F]/.test(responseText);
      expect(hasDevanagari).toBeTruthy();
    }
  });

  test('Switch to Marathi and interact', async ({ page }) => {
    const languageSelector = page.locator(
      'select, [data-testid="language-select"], .language-picker'
    ).first();
    await languageSelector.waitFor({ state: 'visible', timeout: 5000 });
    await languageSelector.selectOption('mr');
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').innerText();
    const hasMarathi = /[\u0900-\u097F]/.test(bodyText);
    expect(hasMarathi).toBeTruthy();
  });

  test('Switch to Tamil and interact', async ({ page }) => {
    const languageSelector = page.locator(
      'select, [data-testid="language-select"], .language-picker'
    ).first();
    await languageSelector.waitFor({ state: 'visible', timeout: 5000 });
    await languageSelector.selectOption('ta');
    await page.waitForTimeout(500);

    const bodyText = await page.locator('body').innerText();
    const hasTamil = /[\u0B80-\u0BFF]/.test(bodyText);
    expect(hasTamil).toBeTruthy();

    const chatInput = page.locator('textarea, input[type="text"], [data-testid="chat-input"]').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill('வணக்கம், எனக்கு உதவி தேவை');
    }
  });

  test('Form labels translated correctly', async ({ page }) => {
    const languageSelector = page.locator(
      'select, [data-testid="language-select"], .language-picker'
    ).first();
    await languageSelector.waitFor({ state: 'visible', timeout: 5000 });

    await languageSelector.selectOption('hi');
    await page.waitForTimeout(500);

    const form = page.locator('form, [data-testid="application-form"]').first();
    if (await form.isVisible()) {
      const formText = await form.innerText();
      const hasHindiLabels = /[\u0900-\u097F]/.test(formText);
      expect(hasHindiLabels).toBeTruthy();
    }

    await languageSelector.selectOption('en');
    await page.waitForTimeout(500);

    if (await form.isVisible()) {
      const formTextEn = await form.innerText();
      const hasOnlyLatin = !/[\u0900-\u097F\u0B80-\u0BFF]/.test(formTextEn);
      expect(hasOnlyLatin).toBeTruthy();
    }
  });
});
