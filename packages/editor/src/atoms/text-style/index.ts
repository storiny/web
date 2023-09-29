import { atom } from "jotai";

import { TextStyle } from "../../constants";

export const text_style_atom = atom<TextStyle>(TextStyle.PARAGRAPH);

export const bold_atom = atom<boolean>(false);
export const italic_atom = atom<boolean>(false);
export const underline_atom = atom<boolean>(false);
export const strikethrough_atom = atom<boolean>(false);

export const link_atom = atom<boolean>(false);
export const code_atom = atom<boolean>(false);

export const superscript_atom = atom<boolean>(false);
export const subscript_atom = atom<boolean>(false);
