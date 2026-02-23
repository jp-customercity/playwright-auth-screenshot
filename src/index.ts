import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { authenticate } from './auth';
import { ScreenshotOptions, ScreenshotResult } from './types';

export { PRESETS } from './presets';
export type { AuthConfig, AuthPreset, ScreenshotOptions, ScreenshotResult } from './types';

/**
 * Take a screenshot of any web page, optionally with form-based authentication.
 *
 * @example Public URL
 * ```ts
 * const result = await screenshot({ url: 'https://example.com' });
 * fs.writeFileSync('screenshot.png', result.buffer);
 * ```
 *
 * @example Authenticated URL (Supabase)
 * ```ts
 * const result = await screenshot({
 *   url: 'https://myapp.com/dashboard',
 *   auth: {
 *     loginUrl: 'https://myapp.com/auth/login',
 *     email: 'user@example.com',
 *     password: 'secret',
 *     preset: 'supabase',
 *   },
 * });
 * ```
 */
export async function screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
  const width = options.width || 1280;
  const height = options.height || 720;
  const timeout = options.timeout || 30000;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width, height },
    });
    const page = await context.newPage();

    // Authenticate if config provided
    let authenticated = false;
    if (options.auth) {
      await authenticate(page, options.auth);
      authenticated = true;
    }

    // Navigate to target URL
    await page.goto(options.url, {
      waitUntil: 'networkidle',
      timeout,
    });

    // Wait for specific element if requested
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }

    // Extra delay for client-side rendering
    const delay = options.delay ?? (authenticated ? 2000 : 0);
    if (delay > 0) {
      await page.waitForTimeout(delay);
    }

    // Capture screenshot
    const buffer = Buffer.from(await page.screenshot({
      fullPage: options.fullPage || false,
      type: 'png',
    }));

    const finalUrl = page.url();

    await browser.close();

    // Write to file if output specified
    if (options.output) {
      writeFileSync(options.output, buffer);
    }

    return {
      buffer,
      path: options.output,
      authenticated,
      finalUrl,
      dimensions: { width, height },
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}
