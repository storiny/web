/**
 * Load and register all endpoints.
 */
export const registerApiEndpoints = async () => {
  await import("./v1");
  await import("./cdn");
};
