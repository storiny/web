import { useAtomValue } from "jotai";

import { queryAtom } from "../../atoms";
import { emojis } from "../../data.json";

const EMOJI_IDS = Object.keys(emojis);

/**
 * Returns emojis matching the query input
 */
export const useSearch = (): string[] => {
  const query = useAtomValue(queryAtom);

  if (!query) {
    return [];
  }

  const queryRegex = new RegExp(
    `${query
      // Make query regex-safe
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      // Remove space
      .replace(/ /g, "")}`,
    "i"
  );
  return EMOJI_IDS.filter((emoji) => queryRegex.test(emoji));
};
