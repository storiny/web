/**
 * Selects media above or equal to the provided breakpoint
 * @param breakpoint Breakpoint
 */
const up = (breakpoint: Breakpoint | number): string =>
  `(min-width: ${
    typeof breakpoint === "number" ? breakpoint : BREAKPOINTS[breakpoint]
  }px)`;

/**
 * Selects media below the provided breakpoint
 * @param breakpoint Breakpoint
 */
const down = (breakpoint: Breakpoint | number): string =>
  `(max-width: ${
    (typeof breakpoint === "number" ? breakpoint : BREAKPOINTS[breakpoint]) -
    0.05
  }px)`;

export const BREAKPOINTS = {
  mobile /* */: 648,
  tablet /* */: 1008,
  desktop /**/: 1280,
  up,
  down
};

export type Breakpoint = "mobile" | "tablet" | "desktop";
