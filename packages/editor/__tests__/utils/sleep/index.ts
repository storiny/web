/**
 * Sleeps for the provided amount of delay
 * @param delay Delay (in ms)
 */
export const sleep = async (delay: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, delay));
};
