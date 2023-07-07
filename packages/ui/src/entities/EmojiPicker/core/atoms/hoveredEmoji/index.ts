import { atom } from "jotai";

import type { emojis } from "../../data.json";

export const hoveredEmojiAtom = atom<keyof typeof emojis | null>(null);
