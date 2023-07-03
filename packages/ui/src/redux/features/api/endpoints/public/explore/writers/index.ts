import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "public/explore/writers";
const ITEMS_PER_PAGE = 10;

export type GetExploreWritersResponse = User[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getExploreWriters = (builder: ApiQueryBuilder) =>
  builder.query<
    { hasMore: boolean; items: User[] },
    { category?: StoryCategory | "all"; page: number; query?: string }
  >({
    query: ({ page, category = "all", query }) =>
      `/${SEGMENT}?page=${page}&category=${category}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
    transformResponse: (response: User[]) => ({
      items: response,
      hasMore: response.length === ITEMS_PER_PAGE
    }),
    merge: (currentCache, newItems) => {
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
    },
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page ||
      currentArg?.category !== previousArg?.category ||
      currentArg?.query !== previousArg?.query
  });
