/**
 * Returns the index of the smallest item in a numeric array
 * @param arr Numeric array
 */
export const smallest_element_index = (arr: number[]): number => {
  let curr_index = 0;

  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] < arr[curr_index]) {
      curr_index = i;
    }
  }

  return curr_index;
};
