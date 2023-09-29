import { atom } from "jotai";

export const can_undo_atom = atom<boolean>(false);
export const can_redo_atom = atom<boolean>(false);
