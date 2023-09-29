/**
 * Predicate function for determining testing environment
 */
export const is_test_env = (): boolean => process.env.NODE_ENV === "test";
