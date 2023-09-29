/**
 * Selects media above or equal to the provided breakpoint
 * @param breakpoint Breakpoint
 */
const up = (breakpoint: Breakpoint): string =>
  `(min-width: ${BREAKPOINTS[breakpoint] + 1}px)`;

/**
 * Selects media below the provided breakpoint
 * @param breakpoint Breakpoint
 */
const down = (breakpoint: Breakpoint): string =>
  `(max-width: ${BREAKPOINTS[breakpoint]}px)`;

export const BREAKPOINTS = {
  mobile /* */: 648,
  tablet /* */: 1008,
  desktop /**/: 1280,
  up,
  down
};

export type Breakpoint = "mobile" | "tablet" | "desktop";
