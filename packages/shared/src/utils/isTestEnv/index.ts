/**
 * Predicate function for determining testing environment
 */
export const isTestEnv = (): boolean => process.env.NODE_ENV === "test";
