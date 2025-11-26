export const AUTH_NUMERIC_CONSTANTS = {
  // Time periods in days
  SUBSCRIPTION_PERIOD_DAYS: 90,
  
  // Time conversion factors
  HOURS_PER_DAY: 24,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_MINUTE: 60,
  MILLISECONDS_PER_SECOND: 1000,
  
  // Calculated milliseconds
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  SUBSCRIPTION_PERIOD_MS: 2 * 24 * 60 * 60 * 1000,
  OTP_EXPIRATION_MS: 5 * 60 * 1000, // 5 minutes
  
  // OTP generation
  OTP_MIN_VALUE: 100000,
  OTP_MAX_RANGE: 900000,
  
  // OTP rate limiting
  OTP_RATE_LIMIT_WINDOW_MS: 30 * 60 * 1000, // 30 minutes
  OTP_RATE_LIMIT_MAX_ATTEMPTS: 5,
  OTP_RATE_LIMIT_BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hour
} as const;
