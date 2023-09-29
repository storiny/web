import { atom } from "jotai";

export type DocStatus =
  | "connecting"
  | "connected"
  | "syncing"
  | "forbidden"
  | "overloaded"
  | "disconnected"
  | "reconnecting"
  | "publishing";

export const doc_status_atom = atom<DocStatus>("connecting");
