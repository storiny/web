/**
 * Console logging for development environment
 */

const isDev = (): boolean => process.env.NODE_ENV === "development";
const noop = (): void => {};

export const devConsole = {
  log: isDev() ? noop : console.log,
  info: isDev() ? noop : console.info,
  warn: isDev() ? noop : console.warn,
  error: isDev() ? noop : console.error
};
