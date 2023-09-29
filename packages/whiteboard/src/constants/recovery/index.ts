import { CLONE_PROPS } from "../../lib";
import { Layer } from "../../types";

export const RECOVERY_KEYS: Array<keyof Layer | string> = [
  ...CLONE_PROPS,
  "_type",
  "id",
  "name",
  "locked",
  "seed"
];
