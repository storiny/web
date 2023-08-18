/**
 * Predicate action returning a `false` value
 */
export const falseAction = (): false => false;

/**
 * Predicate action returning a `true` value
 */
export const trueAction = (): true => true;

/**
 * Numerical action returning the incremented count
 */
export const incrementAction = (prevState: number): number => prevState + 1;

/**
 * Numerical action returning the decremented count
 */
export const decrementAction = (prevState: number): number => prevState - 1;
