import { atom } from "jotai";

import type { default as data } from "../../data.json";

export const hoveredEmojiAtom = atom<keyof typeof data.emojis | null>(null);
