/**
 * SECURITY ENHANCEMENT: Environment configuration for secure app settings
 * This file contains security-related configuration without exposing sensitive data
 */

export const SecurityConfig = {
  /* SECURITY ENHANCEMENT: Authentication settings */
  AUTH: {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBERS: true,
    PASSWORD_REQUIRE_SPECIAL_CHARS: false,
  },

  /* SECURITY ENHANCEMENT: Input validation settings */
  VALIDATION: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 20,
    USERNAME_PATTERN: /^[a-zA-Z0-9_]+$/,

    TEXT_MAX_LENGTH: 1000,
    TITLE_MAX_LENGTH: 100,

    // Sanitization patterns
    REMOVE_HTML_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    REMOVE_DANGEROUS_CHARS: /[<>\"'%;()&+]/g,
  },

  /* SECURITY ENHANCEMENT: Storage settings */
  STORAGE: {
    // Storage key prefixes for different data types
    USER_PREFIX: 'secure_users',
    SESSION_PREFIX: 'user_session',
    NOTES_PREFIX: 'notes_',
    PASSWORD_PREFIX: 'pwd_',

    // Encryption settings
    ENCRYPTION_KEY_PREFIX: 'RN_APP_',
    USE_BASE64_ENCODING: true,
  },

  /* SECURITY ENHANCEMENT: Security headers and settings */
  SECURITY: {
    // Enable additional security measures
    ENABLE_INPUT_SANITIZATION: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_SESSION_VALIDATION: true,

    // Logging settings (for security audit)
    LOG_FAILED_ATTEMPTS: true,
    LOG_SUCCESSFUL_LOGINS: false, // Set to false in production

    // Development vs Production settings
    IS_DEVELOPMENT: __DEV__,
  },

  /* SECURITY ENHANCEMENT: Common weak passwords to reject */
  WEAK_PASSWORDS: [
    'password',
    '123456',
    'password123',
    'admin',
    'qwerty',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'secret',
    'user',
    'test',
    'guest',
    'root',
    'administrator',
    '12345678',
    'abc123',
    'pass',
    'login',
    '111111',
  ],

  /* SECURITY ENHANCEMENT: Error messages (avoid revealing system details) */
  ERROR_MESSAGES: {
    GENERIC_AUTH_ERROR: 'Invalid username or password',
    ACCOUNT_LOCKED:
      'Account temporarily locked due to multiple failed attempts',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    INVALID_INPUT: 'Invalid input provided',
    NETWORK_ERROR: 'Connection error. Please try again.',
    STORAGE_ERROR: 'Failed to save data. Please try again.',
  },
};

/* SECURITY ENHANCEMENT: Production environment checks */
export const isProduction = () => !SecurityConfig.SECURITY.IS_DEVELOPMENT;

/* SECURITY ENHANCEMENT: Security audit log (for development) */
export const securityLog = (event: string, details?: any) => {
  if (SecurityConfig.SECURITY.IS_DEVELOPMENT) {
    console.log(`[SECURITY] ${new Date().toISOString()}: ${event}`, details);
  }
};
