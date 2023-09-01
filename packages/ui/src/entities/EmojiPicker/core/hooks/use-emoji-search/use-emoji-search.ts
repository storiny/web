import Fuse from "fuse.js";
import { useAtomValue } from "jotai";

import { emojiQueryAtom } from "../../atoms";
import { emojis } from "../../data.json";

const EMOJI_IDS = Object.keys(emojis);

const EmojiFuse = new Fuse<string>(EMOJI_IDS, {
  isCaseSensitive: false,
  includeScore: false,
  shouldSort: true,
  findAllMatches: false,
  minMatchCharLength: 1,
  location: 0,
  threshold: 0.6
});

/**
 * Returns emojis matching the query input
 */
export const useEmojiSearch = (): string[] => {
  const query = useAtomValue(emojiQueryAtom);

  if (!query) {
    return [];
  }

  return EmojiFuse.search(query).map(({ item }) => item);
};
