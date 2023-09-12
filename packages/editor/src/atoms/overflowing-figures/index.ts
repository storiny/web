import { atom } from "jotai";

export const overflowingFiguresAtom = atom<Set<string>>(new Set([]));
