import { atom } from "jotai";

export type AddPasswordScreen =
  | "confirmation"
  | "verification-code"
  | "password"
  | "finish";

export const addPasswordScreenAtom = atom<AddPasswordScreen>("confirmation");
