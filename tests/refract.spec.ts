import { test, expect } from '@playwright/test';

test.describe('Refract: Phase 5 - Industrial Quality & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Increase navigation timeout for slow headless starts
    page.setDefaultNavigationTimeout(60000);
    await page.goto('/');
    // Skip onboarding and clear history for a clean slate
    await page.evaluate(() => {
      localStorage.setItem('rf_onboarding_seen', 'true');
      localStorage.removeItem('refract_premium_history');
    });
    await page.reload();
  });

  test('Component: Settings Modal (Accessibility & Focus)', async ({ page }) => {
    // Open via button
    await page.getByLabel(/API Settings/i).click();
    
    const modal = page.getByRole('dialog', { name: /Application Settings/i });
    await expect(modal).toBeVisible();

    // Check if close button is focused (initial focus)
    const closeBtn = page.getByLabel(/Close settings/i);
    await expect(closeBtn).toBeFocused();

    // Ensure focus is trapped
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const isBodyFocused = await page.evaluate(() => document.activeElement === document.body);
      expect(isBodyFocused).toBe(false);
    }

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Component: History Drawer (Accessibility)', async ({ page }) => {
    await page.getByLabel(/Open history/i).click();
    
    const drawer = page.getByRole('dialog', { name: /History/i });
    await expect(drawer).toBeVisible();

    // Close via button
    await page.getByLabel(/Close history/i).click();
    await expect(drawer).not.toBeVisible();
  });

  test('Visual Regression: Branding & Dark Theme', async ({ page }) => {
    // Wait for Shiki and animations
    await page.waitForTimeout(2000);
    
    // Check Volt color consistency
    const logo = page.locator('span:has-text(">_ refract")');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveCSS('color', 'rgb(168, 255, 62)');
  });

  test('Visual Regression: Result Cards Snapshots', async ({ page }) => {
    // Mock a result to test the visual layout of IssueCards
    await page.evaluate(() => {
      const mockResult = {
        score: 42,
        complexity: 'high',
        summary: 'Vulnerable code detected',
        issues: [{
          severity: 'bug',
          title: 'SQL Injection',
          description: 'Critical vulnerability',
          line: 10,
          vulnerable_code: 'query = "SELECT * FROM users WHERE id=" + id',
          fix_code: 'query = "SELECT * FROM users WHERE id=?", [id]',
          fix_explanation: 'Use parameterized queries.'
        }],
        strengths: ['Uses HTTPS']
      };
      // We can't easily mock the entire state from outside without exposing setters,
      // but we can mock the history entry and load it.
      localStorage.setItem('refract_premium_history', JSON.stringify([{
        id: 'mock-1',
        ts: Date.now(),
        lang: 'javascript',
        code: 'some code',
        score: 42,
        summary: 'Test Result',
        provider: 'mistral',
        resultCache: mockResult
      }]));
    });
    
    await page.reload();
    await page.getByLabel(/Open history/i).click();
    
    // Use the correct summary text from the mock
    const entry = page.getByText('Test Result').first();
    await expect(entry).toBeVisible();
    await entry.click();
    
    // Wait for expansion animation and Shiki rendering
    await page.waitForTimeout(1500);
    
    const resultsPanel = page.locator('div:has-text("Overview")').first();
    await expect(resultsPanel).toBeVisible();
  });
});
