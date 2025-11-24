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
} as const;
