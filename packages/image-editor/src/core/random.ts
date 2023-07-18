import { nanoid } from "nanoid";
import { Random } from "roughjs/bin/math";

import { isTestEnv } from "../lib/utils/utils";

let random = new Random(Date.now());
let testIdBase = 0;

export const randomInteger = (): number => Math.floor(random.next() * 2 ** 31);

export const reseed = (seed: number): void => {
  random = new Random(seed);
  testIdBase = 0;
};

export const randomId = (): string =>
  isTestEnv() ? `id${testIdBase++}` : nanoid();
