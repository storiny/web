/**
 * Media above or equal to the breakpoint
 * @param breakpoint
 */
const up = (breakpoint: Breakpoint) =>
  `(min-width: ${breakpoints[breakpoint] + 1}px)`;

/**
 * Media below the breakpoint
 * @param breakpoint
 */
const down = (breakpoint: Breakpoint) =>
  `(max-width: ${breakpoints[breakpoint]}px)`;

export const breakpoints = {
  mobile: 648,
  tablet: 1008,
  desktop: 1280,
  up,
  down,
};

export type Breakpoint = "mobile" | "tablet" | "desktop";
