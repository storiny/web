export enum Roundness {
  // Used for legacy rounding (rectangles), which currently works the same
  // as `PROPORTIONAL_RADIUS`, but we need to differentiate for UI purposes
  LEGACY = 1,
  // Used for linear elements and diamonds
  PROPORTIONAL_RADIUS = 2,
  // Current default algorithm for rectangles, using fixed pixel radius.
  // It's working similarly to a regular border-radius, but attemps to make
  // radius visually similar across different element sizes, especially
  // very large and very small elements
  ADAPTIVE_RADIUS = 3
}
