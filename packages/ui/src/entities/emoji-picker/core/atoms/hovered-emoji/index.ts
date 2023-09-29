import { atom } from "jotai";

import type { default as data } from "../../data.json";

export const hovered_emoji_atom = atom<keyof typeof data.emojis | null>(null);
