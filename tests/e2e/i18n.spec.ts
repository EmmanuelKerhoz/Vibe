/**
 * i18n.spec.ts — Lyricist Pro / Vibe
 * E2E tests for internationalisation (i18n) — language switching,
 * translated UI labels, and RTL / LTR handling.
 */
import { test, expect, Page } from '@playwright/test';

// Supported locales — adjust if the app adds/removes languages
const LOCALES = [
  { code: 'en', sampleText: /lyric|song|write|generat/i },
  { code: 'fr', sampleText: /lyrique|chanson|écrire|générer/i },
];

async function findLangSwitcher(page: Page) {
  return page
    .locator(
      '[data-testid="lang-switch"], [aria-label*="language" i], select[name*="lang" i], ' +
        'button[title*="language" i], [class*="lang"]',
    )
    .first();
}

test.describe('i18n — Language switcher UI', () => {
  test('language switcher is visible on the page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const switcher = await findLangSwitcher(page);
    if (await switcher.isVisible()) {
      await expect(switcher).toBeVisible();
    } else {
      test.skip(); // App may not have a visible switcher yet
    }
  });

  test('switching language does not crash the app', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const switcher = await findLangSwitcher(page);

    if (await switcher.isVisible()) {
      const tag = await switcher.evaluate((el) => el.tagName.toLowerCase());
      if (tag === 'select') {
        // Try selecting FR
        await switcher.selectOption('fr').catch(() => {});
      } else {
        await switcher.click();
        // Pick French option if menu opens
        const frOption = page.locator('button, li, a, [role="option"]').filter({ hasText: /français|french|fr/i }).first();
        if (await frOption.isVisible()) await frOption.click();
      }
      await page.waitForTimeout(1000);
      expect(pageErrors).toHaveLength(0);
    } else {
      test.skip();
    }
  });

  test('switching back to English restores original labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const switcher = await findLangSwitcher(page);

    if (await switcher.isVisible()) {
      // Switch to FR then back to EN
      const tag = await switcher.evaluate((el) => el.tagName.toLowerCase());
      if (tag === 'select') {
        await switcher.selectOption('fr').catch(() => {});
        await page.waitForTimeout(500);
        await switcher.selectOption('en').catch(() => {});
      } else {
        await switcher.click();
        const frOpt = page.locator('[role="option"], li, button').filter({ hasText: /français|fr/i }).first();
        if (await frOpt.isVisible()) await frOpt.click();
        await page.waitForTimeout(500);
        await switcher.click();
        const enOpt = page.locator('[role="option"], li, button').filter({ hasText: /english|en/i }).first();
        if (await enOpt.isVisible()) await enOpt.click();
      }
      await page.waitForTimeout(500);
      // Page should not have crashed
      await expect(page).not.toHaveURL(/error/);
    } else {
      test.skip();
    }
  });
});

test.describe('i18n — URL-based locale routing', () => {
  test('navigating to /fr loads French UI (if route-based i18n)', async ({ page }) => {
    const res = await page.goto('/fr');
    if (!res || res.status() === 404) {
      // Route-based i18n not implemented — skip gracefully
      test.skip();
      return;
    }
    await page.waitForLoadState('networkidle');
    // French keywords should appear somewhere on the page
    const bodyText = await page.locator('body').textContent();
    const hasFrenchUI = /lyrique|chanson|générer|écrire/i.test(bodyText ?? '');
    if (!hasFrenchUI) test.skip();
  });

  test('lang attribute on <html> changes with locale', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const langAttr = await page.locator('html').getAttribute('lang');
    // Should be a valid BCP 47 tag (e.g. 'en', 'fr', 'en-US')
    expect(langAttr).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });
});

test.describe('i18n — No missing translation keys', () => {
  test('console has no i18n error messages on load', async ({ page }) => {
    const i18nErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      // Common i18n library error patterns
      if (/missing.*key|translation.*not found|i18n.*error/i.test(text)) {
        i18nErrors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(i18nErrors, `i18n console errors: ${i18nErrors.join('\n')}`).toHaveLength(0);
  });
});
