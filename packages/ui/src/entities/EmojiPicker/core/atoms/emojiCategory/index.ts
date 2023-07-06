import { atom } from "jotai";

import { EmojiCategory } from "../../constants";

export const emojiCategoryAtom = atom<EmojiCategory>(
  EmojiCategory.SMILEYS_AND_PEOPLE
);
