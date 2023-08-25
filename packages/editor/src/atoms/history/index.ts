import { atom } from "jotai";

export const canUndoAtom = atom<boolean>(false);
export const canRedoAtom = atom<boolean>(false);
