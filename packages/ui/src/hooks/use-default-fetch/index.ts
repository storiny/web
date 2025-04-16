import { LazyQueryTrigger } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryArgFrom, QueryDefinition } from "@reduxjs/toolkit/query";
import React from "react";

/**
 * Hook to fetch data using a query definition with optional dependencies and cache preference.
 * @param trigger The lazy query trigger function to invoke for fetching data.
 * @param args The arguments passed to the trigger function to initiate the query.
 * @param fetch_deps Optional dependencies that, when changed, will trigger a re-fetch.
 * @param prefer_cache_value A boolean flag indicating whether to prefer cached values during fetching (default is true).
 */
export const use_default_fetch = <
  T extends QueryDefinition<any, any, any, any>
>(
  trigger: LazyQueryTrigger<T>,
  args: QueryArgFrom<T>,
  fetch_deps: React.DependencyList = [],
  prefer_cache_value = true
): (() => void) => {
  const default_fetch = React.useCallback(() => {
    trigger(args, prefer_cache_value);
  }, [args, prefer_cache_value, trigger]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(default_fetch, fetch_deps);

  return default_fetch;
};
