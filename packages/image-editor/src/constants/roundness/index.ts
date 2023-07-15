export enum Roundness {
  // Used for linear layers and diamonds
  PROPORTIONAL_RADIUS = 1,
  // Current default algorithm for rectangles, using fixed pixel radius.
  // It's working similarly to a regular border-radius, but attemps to make
  // radius visually similar across different layer sizes, especially
  // very large and very small layers
  ADAPTIVE_RADIUS = 2
}
