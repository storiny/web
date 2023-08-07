import { atom } from "jotai";

export type SelectedAtomValue = {
  hex: string | null;
  id: string;
  src: string;
} | null;

export const selectedAtom = atom<SelectedAtomValue>(null);
