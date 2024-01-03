import { atom } from "jotai";
import { UndoManager } from "yjs";

export const can_undo_atom = atom<boolean>(false);
export const can_redo_atom = atom<boolean>(false);

export const undo_manager_atom = atom<UndoManager | null>(null);
