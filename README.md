# playwright-auth-screenshot

Take authenticated screenshots of any web app. Supports Supabase, Clerk, Salesforce, or any custom login form.

Built on [Playwright](https://playwright.dev/) — headless Chromium, form-based authentication, zero external dependencies.

## Install

```bash
npm install playwright-auth-screenshot
# Then install browser
npx playwright install chromium
```

Or use directly with npx:

```bash
npx playwright-auth-screenshot https://example.com -o screenshot.png
```

## CLI Usage

### Public URL (no auth)

```bash
playwright-auth-screenshot https://example.com -o screenshot.png
```

### Supabase Auth

```bash
playwright-auth-screenshot https://myapp.com/dashboard \
  --login-url https://myapp.com/auth/login \
  --email user@example.com \
  --password secret123 \
  --preset supabase \
  -o dashboard.png
```

### Clerk Auth (multi-step)

```bash
playwright-auth-screenshot https://myapp.com/dashboard \
  --login-url https://myapp.com/sign-in \
  --email user@example.com \
  --password secret123 \
  --preset clerk \
  -o dashboard.png
```

### Salesforce

```bash
playwright-auth-screenshot https://myorg.salesforce.com/home \
  --login-url https://login.salesforce.com \
  --email admin@company.com \
  --password pass123 \
  --preset salesforce \
  -o sf-home.png
```

### Custom Selectors

For login forms that don't match any preset:

```bash
playwright-auth-screenshot https://internal-app.company.com/dashboard \
  --login-url https://internal-app.company.com/login \
  --email admin@company.com \
  --password secret \
  --email-selector "input[name='username']" \
  --password-selector "input[name='pass']" \
  --submit-selector "#login-btn" \
  -o dashboard.png
```

### Environment Variables (CI/CD)

Keep credentials out of your command line:

```bash
export AUTH_EMAIL=user@example.com
export AUTH_PASSWORD=secret123
export AUTH_LOGIN_URL=https://myapp.com/auth/login

playwright-auth-screenshot https://myapp.com/dashboard \
  --preset supabase -o dashboard.png
```

### Config File

```bash
playwright-auth-screenshot --config screenshot-config.json
```

`screenshot-config.json`:
```json
{
  "url": "https://myapp.com/dashboard",
  "output": "dashboard.png",
  "width": 1920,
  "height": 1080,
  "fullPage": true,
  "auth": {
    "loginUrl": "https://myapp.com/auth/login",
    "email": "user@example.com",
    "password": "secret123",
    "preset": "supabase"
  }
}
```

### All CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `<url>` | URL to screenshot | required |
| `-o, --output <file>` | Output PNG file path | none |
| `--width <px>` | Viewport width | 1280 |
| `--height <px>` | Viewport height | 720 |
| `--full-page` | Capture full scrollable page | false |
| `--wait-for <selector>` | CSS selector to wait for before capture | none |
| `--timeout <ms>` | Page load timeout | 30000 |
| `--delay <ms>` | Extra delay after page load | 0 (2000 if auth) |
| `--config <file>` | JSON config file | none |
| `--login-url <url>` | Login page URL | none |
| `--email <email>` | Login email | `AUTH_EMAIL` env |
| `--password <pass>` | Login password | `AUTH_PASSWORD` env |
| `--preset <name>` | Auth preset name | generic |
| `--email-selector` | Override email input selector | preset default |
| `--password-selector` | Override password input selector | preset default |
| `--submit-selector` | Override submit button selector | preset default |
| `--multi-step` | Enable multi-step login flow | false |

## Library Usage

```typescript
import { screenshot } from 'playwright-auth-screenshot';
import { writeFileSync } from 'fs';

// Public URL
const result = await screenshot({
  url: 'https://example.com',
  output: 'screenshot.png',
});

// Authenticated URL
const authed = await screenshot({
  url: 'https://myapp.com/dashboard',
  auth: {
    loginUrl: 'https://myapp.com/auth/login',
    email: 'user@example.com',
    password: 'secret123',
    preset: 'supabase',
  },
  width: 1920,
  height: 1080,
  fullPage: true,
});

// result.buffer  — PNG Buffer
// result.path    — file path (if output was specified)
// result.authenticated — true/false
// result.finalUrl — URL after navigation
// result.dimensions — { width, height }

writeFileSync('dashboard.png', authed.buffer);
```

## Built-in Presets

| Preset | Email Selector | Password Selector | Submit | Multi-step |
|--------|---------------|-------------------|--------|------------|
| **supabase** | `input[type="email"]` | `input[type="password"]` | `button[type="submit"]` | No |
| **clerk** | `input[name="identifier"]` | `input[name="password"]` | `button[type="submit"]` | Yes |
| **salesforce** | `input#username` | `input#password` | `input#Login` | No |
| **generic** | `input[type="email"]` | `input[type="password"]` | `button[type="submit"]` | No |

All selectors can be overridden per-invocation.

## How It Works

1. Launches headless Chromium via Playwright
2. If auth config provided:
   - Navigates to the login URL
   - Fills in email field using CSS selector
   - For multi-step flows (Clerk): clicks "Continue", waits for password screen
   - Fills in password field
   - Clicks submit button
   - Waits for redirect to success URL pattern
3. Navigates to the target URL
4. Captures PNG screenshot
5. Returns buffer (and writes to file if output specified)

## Requirements

- Node.js >= 18
- Chromium (installed via `npx playwright install chromium`)

## License

MIT
