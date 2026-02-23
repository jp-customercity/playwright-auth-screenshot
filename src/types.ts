export interface AuthConfig {
  /** Full URL of the login page */
  loginUrl: string;
  /** Email / username for login */
  email: string;
  /** Password for login */
  password: string;
  /** Built-in preset: "supabase" | "clerk" | "salesforce" | "generic" */
  preset?: string;
  /** CSS selector for the email/username input field */
  emailSelector?: string;
  /** CSS selector for the password input field */
  passwordSelector?: string;
  /** CSS selector for the submit/login button */
  submitSelector?: string;
  /** URL pattern to wait for after successful login (e.g. "/" or "/dashboard") */
  successUrlPattern?: string;
  /** CSS selector to wait for after successful login */
  successSelector?: string;
  /** Whether login is multi-step (e.g. Clerk: email first, then password) */
  multiStep?: boolean;
  /** CSS selector for the "Continue" button in multi-step flows */
  continueSelector?: string;
}

export interface ScreenshotOptions {
  /** URL to screenshot */
  url: string;
  /** Authentication config — omit for public URLs */
  auth?: AuthConfig;
  /** Viewport width in pixels (default: 1280) */
  width?: number;
  /** Viewport height in pixels (default: 720) */
  height?: number;
  /** Capture full scrollable page (default: false) */
  fullPage?: boolean;
  /** CSS selector to wait for before capture */
  waitFor?: string;
  /** Output file path — if omitted, returns buffer only */
  output?: string;
  /** Timeout for page load in ms (default: 30000) */
  timeout?: number;
  /** Extra delay after page load in ms (default: 0, 2000 if authenticated) */
  delay?: number;
}

export interface ScreenshotResult {
  /** PNG screenshot as a Buffer */
  buffer: Buffer;
  /** Output file path (if output was specified) */
  path?: string;
  /** Whether authentication was performed */
  authenticated: boolean;
  /** Final URL after navigation */
  finalUrl: string;
  /** Viewport dimensions used */
  dimensions: { width: number; height: number };
}

export interface AuthPreset {
  loginPath: string;
  emailSelector: string;
  passwordSelector: string;
  submitSelector: string;
  successUrlPattern: string;
  multiStep: boolean;
  continueSelector?: string;
}
