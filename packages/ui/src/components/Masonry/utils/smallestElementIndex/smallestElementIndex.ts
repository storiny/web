/**
 * Returns the index of the smallest item in a numeric array
 * @param arr Numeric array
 */
export const smallestElementIndex = (arr: number[]): number => {
  let currIdx = 0;

  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] < arr[currIdx]) {
      currIdx = i;
    }
  }

  return currIdx;
};
