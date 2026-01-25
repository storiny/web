import Fuse from "fuse.js";
import { useAtomValue as use_atom_value } from "jotai";

import { TSymbol } from "~/entities/symbol-picker";

import { symbol_query_atom } from "../../atoms";
import { default as data } from "../../data.json";

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
export const use_symbol_search = (): TSymbol[] => {
  const query = use_atom_value(symbol_query_atom);

  if (!query) {
    return [];
  }

  return SymbolFuse.search(query).map(({ item }) => item);
};
