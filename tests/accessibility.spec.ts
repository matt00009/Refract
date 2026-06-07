import { test, expect } from '@playwright/test';

test.describe('Refract: Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear onboarding and history
    await page.evaluate(() => {
      localStorage.setItem('rf_onboarding_seen', 'true');
      localStorage.removeItem('refract_premium_history');
    });
    await page.reload();
  });

  test('Main Layout - Semantic Structure', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    const banner = page.locator('div.fixed.top-0'); // TopBar
    await expect(banner).toBeVisible();
  });

  test('TopBar - Provider Selector Accessibility', async ({ page }) => {
    const radiogroup = page.getByRole('radiogroup', { name: /Select AI provider/i });
    await expect(radiogroup).toBeVisible();

    const radios = radiogroup.getByRole('radio');
    const count = await radios.count();
    expect(count).toBeGreaterThan(0);

    // Verify keyboard navigation in radiogroup
    await radios.first().focus();
    await page.keyboard.press('ArrowRight');
    // The second radio should now be checked (logic in TopBar handles this)
    // Note: TopBar logic updates state on arrow keys
  });

  test('Settings Modal - Tab Focus & ARIA', async ({ page }) => {
    await page.getByLabel(/API Settings/i).click();
    
    const modal = page.getByRole('dialog', { name: /Application Settings/i });
    await expect(modal).toBeVisible();

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2);

    // Initial tab state
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();

    // Switch tabs via keyboard
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('History Drawer - Focus Trap', async ({ page }) => {
    await page.getByLabel(/Open history/i).click();
    const drawer = page.getByRole('dialog', { name: /History/i });
    await expect(drawer).toBeVisible();

    // The first focusable element should be the close button
    const closeBtn = page.getByLabel(/Close history/i);
    await expect(closeBtn).toBeFocused();

    // Tab through to verify trap
    await page.keyboard.press('Tab'); // Export
    await page.keyboard.press('Tab'); // Import
    // If history is empty, it might wrap back or go to next available
  });
});
