import Fuse from "fuse.js";
import { useAtomValue as use_atom_value } from "jotai";

import { emoji_query_atom } from "../../atoms";
import { default as data } from "../../data.json";

const EMOJI_IDS = Object.keys(data.emojis);

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
export const use_emoji_search = (): string[] => {
  const query = use_atom_value(emoji_query_atom);

  if (!query) {
    return [];
  }

  return EmojiFuse.search(query).map(({ item }) => item);
};
