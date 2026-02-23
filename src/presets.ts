import { AuthPreset } from './types';

/**
 * Built-in selector presets for common authentication providers.
 * Use --preset <name> on the CLI or preset: "<name>" in the library.
 * Any selector can be overridden per-invocation.
 */
export const PRESETS: Record<string, AuthPreset> = {
  supabase: {
    loginPath: '/auth/login',
    emailSelector: 'input[type="email"], input#email',
    passwordSelector: 'input[type="password"], input#password',
    submitSelector: 'button[type="submit"]',
    successUrlPattern: '/',
    multiStep: false,
  },
  clerk: {
    loginPath: '/sign-in',
    emailSelector: 'input[name="identifier"], input#identifier-field',
    passwordSelector: 'input[name="password"], input#password-field',
    submitSelector: 'button[type="submit"], button.cl-formButtonPrimary',
    successUrlPattern: '/',
    multiStep: true,
    continueSelector: 'button[type="submit"]',
  },
  salesforce: {
    loginPath: '/login',
    emailSelector: 'input#username',
    passwordSelector: 'input#password',
    submitSelector: 'input#Login',
    successUrlPattern: '/home',
    multiStep: false,
  },
  generic: {
    loginPath: '/login',
    emailSelector: 'input[type="email"], input[name="email"]',
    passwordSelector: 'input[type="password"], input[name="password"]',
    submitSelector: 'button[type="submit"]',
    successUrlPattern: '/',
    multiStep: false,
  },
};
