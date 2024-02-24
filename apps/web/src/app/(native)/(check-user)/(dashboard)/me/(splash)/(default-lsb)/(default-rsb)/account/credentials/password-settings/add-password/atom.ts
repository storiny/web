import { atom } from "jotai";

export type AddPasswordScreen =
  | "confirmation"
  | "verification-code"
  | "password"
  | "finish";

export const add_password_screen_atom = atom<AddPasswordScreen>("confirmation");
