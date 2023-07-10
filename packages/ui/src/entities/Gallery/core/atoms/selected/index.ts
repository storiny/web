import { atom } from "jotai";

export type SelectedAtomValue =
  | {
      hex: string | null;
      id: string;
      src: string;
    }
  | undefined;

export const selectedAtom = atom<SelectedAtomValue>(undefined);
