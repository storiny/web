import { atom } from "jotai";

export type SelectedAtomValue = {
  hex: string | null;
  id: string;
  source: "pexels" | "native";
  src: string;
} | null;

export const selectedAtom = atom<SelectedAtomValue>(null);
