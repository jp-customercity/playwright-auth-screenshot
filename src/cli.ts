#!/usr/bin/env node

import { screenshot } from './index';
import { ScreenshotOptions, AuthConfig } from './types';
import { readFileSync } from 'fs';

function parseArgs(argv: string[]): {
  url?: string;
  config?: string;
  output?: string;
  loginUrl?: string;
  email?: string;
  password?: string;
  preset?: string;
  emailSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  successUrlPattern?: string;
  successSelector?: string;
  multiStep?: boolean;
  continueSelector?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  waitFor?: string;
  timeout?: number;
  delay?: number;
  help?: boolean;
} {
  const args: Record<string, any> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '-o' && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === '--full-page') {
      args.fullPage = true;
    } else if (arg === '--multi-step') {
      args.multiStep = true;
    } else if (arg.startsWith('--') || arg.startsWith('-')) {
      const key = arg.replace(/^-+/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    args.url = positional[0];
  }

  // Parse numeric values
  if (args.width) args.width = parseInt(args.width, 10);
  if (args.height) args.height = parseInt(args.height, 10);
  if (args.timeout) args.timeout = parseInt(args.timeout, 10);
  if (args.delay) args.delay = parseInt(args.delay, 10);

  return args;
}

function printUsage(): void {
  console.log(`
playwright-auth-screenshot — Take authenticated screenshots of any web app

USAGE:
  playwright-auth-screenshot <url> [options]
  playwright-auth-screenshot --config <file.json>

BASIC OPTIONS:
  -o, --output <file>        Output PNG file path (default: stdout info)
  --width <px>               Viewport width (default: 1280)
  --height <px>              Viewport height (default: 720)
  --full-page                Capture full scrollable page
  --wait-for <selector>      CSS selector to wait for before capture
  --timeout <ms>             Page load timeout (default: 30000)
  --delay <ms>               Extra delay after load (default: 0, 2000 if auth)
  --config <file>            Load options from JSON config file

AUTHENTICATION OPTIONS:
  --login-url <url>          Login page URL
  --email <email>            Login email (or set AUTH_EMAIL env var)
  --password <pass>          Login password (or set AUTH_PASSWORD env var)
  --preset <name>            Auth preset: supabase, clerk, salesforce, generic

CUSTOM SELECTORS (override preset defaults):
  --email-selector <sel>     CSS selector for email input
  --password-selector <sel>  CSS selector for password input
  --submit-selector <sel>    CSS selector for submit button
  --success-url-pattern <p>  URL pattern after successful login
  --success-selector <sel>   CSS selector visible after login
  --multi-step               Enable multi-step login (email first, then password)
  --continue-selector <sel>  "Continue" button for multi-step flows

ENVIRONMENT VARIABLES:
  AUTH_EMAIL                 Login email (alternative to --email)
  AUTH_PASSWORD              Login password (alternative to --password)
  AUTH_LOGIN_URL             Login URL (alternative to --login-url)

PRESETS:
  supabase     input[type="email"] + input[type="password"] + button[type="submit"]
  clerk        Multi-step: identifier field -> continue -> password field
  salesforce   input#username + input#password + input#Login
  generic      input[type="email"] + input[type="password"] + button[type="submit"]

EXAMPLES:
  # Public URL
  playwright-auth-screenshot https://example.com -o screenshot.png

  # Supabase auth
  playwright-auth-screenshot https://myapp.com/dashboard \\
    --login-url https://myapp.com/auth/login \\
    --email user@example.com --password secret \\
    --preset supabase -o dashboard.png

  # Clerk multi-step auth
  playwright-auth-screenshot https://myapp.com/dashboard \\
    --login-url https://myapp.com/sign-in \\
    --email user@example.com --password secret \\
    --preset clerk -o dashboard.png

  # Custom selectors
  playwright-auth-screenshot https://crm.company.com/home \\
    --login-url https://login.company.com \\
    --email admin@company.com --password pass123 \\
    --email-selector "input#username" \\
    --submit-selector "input#Login" \\
    -o home.png

  # Environment variables (CI/CD friendly)
  AUTH_EMAIL=user@example.com AUTH_PASSWORD=secret \\
    playwright-auth-screenshot https://myapp.com/dashboard \\
    --login-url https://myapp.com/login --preset supabase -o out.png
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.url && !args.config)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  // Load config file if specified
  let config: Record<string, any> = {};
  if (args.config) {
    try {
      config = JSON.parse(readFileSync(args.config, 'utf-8'));
    } catch (err) {
      console.error(`Error reading config file: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // Merge: config file < CLI args < env vars
  const url = args.url || config.url;
  if (!url) {
    console.error('Error: URL is required. Usage: playwright-auth-screenshot <url> [options]');
    process.exit(1);
  }

  const loginUrl = args.loginUrl || config.loginUrl || config.auth?.loginUrl || process.env.AUTH_LOGIN_URL;
  const email = args.email || config.email || config.auth?.email || process.env.AUTH_EMAIL;
  const password = args.password || config.password || config.auth?.password || process.env.AUTH_PASSWORD;

  // Build auth config if login URL is provided
  let auth: AuthConfig | undefined;
  if (loginUrl) {
    if (!email || !password) {
      console.error('Error: --email and --password (or AUTH_EMAIL/AUTH_PASSWORD env vars) are required when --login-url is provided');
      process.exit(1);
    }
    auth = {
      loginUrl,
      email,
      password,
      preset: args.preset || config.preset || config.auth?.preset,
      emailSelector: args.emailSelector || config.emailSelector || config.auth?.emailSelector,
      passwordSelector: args.passwordSelector || config.passwordSelector || config.auth?.passwordSelector,
      submitSelector: args.submitSelector || config.submitSelector || config.auth?.submitSelector,
      successUrlPattern: args.successUrlPattern || config.successUrlPattern || config.auth?.successUrlPattern,
      successSelector: args.successSelector || config.successSelector || config.auth?.successSelector,
      multiStep: args.multiStep || config.multiStep || config.auth?.multiStep,
      continueSelector: args.continueSelector || config.continueSelector || config.auth?.continueSelector,
    };
  }

  const options: ScreenshotOptions = {
    url,
    auth,
    width: args.width || config.width,
    height: args.height || config.height,
    fullPage: args.fullPage || config.fullPage,
    waitFor: args.waitFor || config.waitFor,
    output: args.output || config.output,
    timeout: args.timeout || config.timeout,
    delay: args.delay || config.delay,
  };

  try {
    console.log(`Capturing: ${url}`);
    if (auth) {
      console.log(`Auth: ${auth.preset || 'custom'} preset, logging in at ${auth.loginUrl}`);
    }

    const result = await screenshot(options);

    console.log(`Screenshot captured: ${result.dimensions.width}x${result.dimensions.height}, ${result.buffer.length} bytes`);
    console.log(`Final URL: ${result.finalUrl}`);
    console.log(`Authenticated: ${result.authenticated}`);

    if (result.path) {
      console.log(`Saved to: ${result.path}`);
    } else {
      console.log('No output file specified — use -o <file> to save');
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
