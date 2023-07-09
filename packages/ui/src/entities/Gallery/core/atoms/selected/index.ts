import { atom } from "jotai";

export type SelectedAtomValue =
  | {
      id: string;
      src: string;
    }
  | undefined;

export const selectedAtom = atom<SelectedAtomValue>(undefined);
