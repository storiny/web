import { atom } from "jotai";

export const overflowing_figures_atom = atom<Set<string>>(new Set([]));
