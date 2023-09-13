import Fuse from "fuse.js";
import { useAtomValue } from "jotai";

import { TSymbol } from "~/entities/symbol-picker";

import { symbolQueryAtom } from "../../atoms";
import * as data from "../../data.json";

const SymbolFuse = new Fuse<TSymbol>(
  data.symbols.map(({ items }) => items).flat(),
  {
    isCaseSensitive: false,
    includeScore: false,
    shouldSort: true,
    findAllMatches: false,
    minMatchCharLength: 1,
    location: 0,
    threshold: 0.6,
    keys: ["name"]
  }
);

/**
 * Returns symbols matching the query input
 */
export const useSymbolSearch = (): TSymbol[] => {
  const query = useAtomValue(symbolQueryAtom);

  if (!query) {
    return [];
  }

  return SymbolFuse.search(query).map(({ item }) => item);
};
