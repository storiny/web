/**
 * Load and register all endpoints.
 */
export const register_api_endpoints = async () => {
  await import("./v1");
  await import("./cdn");
};
