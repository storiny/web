import { atom } from "jotai";

export type DocStatus =
  | "connecting"
  | "connected"
  | "syncing"
  | "forbidden"
  | "overloaded"
  | "disconnected"
  | "reconnecting";

export const docStatusAtom = atom<DocStatus>("connecting");
