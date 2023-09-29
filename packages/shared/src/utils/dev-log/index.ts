/**
 * Console logging for development environment
 */

const is_dev = (): boolean => process.env.NODE_ENV === "development";
const noop = (): void => undefined;

export const dev_console: {
  error: typeof console.error;
  info: typeof console.info;
  log: typeof console.log;
  warn: typeof console.warn;
} = {
  log: is_dev() ? console.log : noop,
  info: is_dev() ? console.info : noop,
  warn: is_dev() ? console.warn : noop,
  error: is_dev() ? console.error : noop
};
