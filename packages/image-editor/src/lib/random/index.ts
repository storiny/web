import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import { nanoid } from "nanoid";
import { Random } from "roughjs/bin/math";

let random = new Random(Date.now());
let testIdBase = 0;

/**
 * Returns a random integer
 */
export const randomInteger = (): number => Math.floor(random.next() * 2 ** 31);

/**
 * Reseed
 * @param seed Seed
 */
export const reseed = (seed: number): void => {
  random = new Random(seed);
  testIdBase = 0;
};

/**
 * Returns a random ID
 */
export const randomId = (): string =>
  isTestEnv() ? `id:${testIdBase++}` : nanoid();
