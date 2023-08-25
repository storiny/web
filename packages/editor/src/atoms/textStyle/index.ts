import { atom } from "jotai";

import { TextStyle } from "../../constants";

export const textStyleAtom = atom<TextStyle>(TextStyle.PARAGRAPH);

export const boldAtom = atom<boolean>(false);
export const italicAtom = atom<boolean>(false);
export const underlineAtom = atom<boolean>(false);
export const strikethroughAtom = atom<boolean>(false);

export const linkAtom = atom<boolean>(false);
export const codeAtom = atom<boolean>(false);

export const superscriptAtom = atom<boolean>(false);
export const subscriptAtom = atom<boolean>(false);
