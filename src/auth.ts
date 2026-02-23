import { Page } from 'playwright';
import { AuthConfig, AuthPreset } from './types';
import { PRESETS } from './presets';

/**
 * Resolve the effective selectors by merging explicit overrides onto preset defaults.
 */
function resolveSelectors(auth: AuthConfig): {
  emailSelector: string;
  passwordSelector: string;
  submitSelector: string;
  successUrlPattern: string;
  successSelector?: string;
  multiStep: boolean;
  continueSelector?: string;
} {
  const preset: AuthPreset = PRESETS[auth.preset || 'generic'] || PRESETS.generic;

  return {
    emailSelector: auth.emailSelector || preset.emailSelector,
    passwordSelector: auth.passwordSelector || preset.passwordSelector,
    submitSelector: auth.submitSelector || preset.submitSelector,
    successUrlPattern: auth.successUrlPattern || preset.successUrlPattern,
    successSelector: auth.successSelector,
    multiStep: auth.multiStep ?? preset.multiStep,
    continueSelector: auth.continueSelector || preset.continueSelector,
  };
}

/**
 * Authenticate a Playwright page via form-based login.
 *
 * Flow:
 *   1. Navigate to loginUrl
 *   2. Fill email field
 *   3. If multi-step: click continue, wait for password field
 *   4. Fill password field
 *   5. Click submit
 *   6. Wait for success (URL pattern or CSS selector)
 */
export async function authenticate(page: Page, auth: AuthConfig): Promise<void> {
  const sel = resolveSelectors(auth);

  // Navigate to login page
  await page.goto(auth.loginUrl, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for email field
  await page.waitForSelector(sel.emailSelector, { timeout: 10000 });

  // Fill email
  await page.fill(sel.emailSelector, auth.email);

  if (sel.multiStep) {
    // Multi-step: click continue after email, wait for password on next screen
    const continueBtn = sel.continueSelector || sel.submitSelector;
    await page.click(continueBtn);
    await page.waitForSelector(sel.passwordSelector, {
      timeout: 10000,
      state: 'visible',
    });
  }

  // Fill password
  await page.fill(sel.passwordSelector, auth.password);

  // Click submit
  await page.click(sel.submitSelector);

  // Wait for successful login
  await waitForLoginSuccess(page, sel);
}

async function waitForLoginSuccess(
  page: Page,
  sel: { successUrlPattern: string; successSelector?: string },
): Promise<void> {
  const timeout = 15000;

  if (sel.successSelector) {
    await page.waitForSelector(sel.successSelector, { timeout });
    return;
  }

  if (sel.successUrlPattern) {
    await page.waitForURL(
      (url: URL) => {
        const pathname = url.pathname;
        if (sel.successUrlPattern === '/') {
          return !pathname.includes('/login') &&
                 !pathname.includes('/sign-in') &&
                 !pathname.includes('/auth/');
        }
        return pathname.includes(sel.successUrlPattern);
      },
      { timeout },
    );
    return;
  }

  // Fallback: wait for any navigation
  await page.waitForTimeout(5000);
}
