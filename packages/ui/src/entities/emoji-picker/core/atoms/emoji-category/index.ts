import { atom } from "jotai";

import { EmojiCategory } from "../../constants";

export const emoji_category_atom = atom<EmojiCategory>(
  EmojiCategory.SMILEYS_AND_PEOPLE
);
