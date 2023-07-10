import { Asset } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "me/assets";
const ITEMS_PER_PAGE = 15;

export type GetUserAssetsResponse = Asset[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getUserAssets = (builder: ApiQueryBuilder) =>
  builder.query<{ hasMore: boolean; items: Asset[] }, { page: number }>({
    query: ({ page }) => `/${SEGMENT}?page=${page}`,
    transformResponse: (response: Asset[]) => ({
      items: response,
      hasMore: response.length === ITEMS_PER_PAGE
    }),
    serializeQueryArgs: ({ endpointName }) => endpointName,
    merge: (currentCache, newItems) => {
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
    },
    providesTags: (result) =>
      result
        ? [
            ...result.items.map(({ id }) => ({
              type: "Asset" as const,
              id
            })),
            "Asset"
          ]
        : ["Asset"],
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page
  });

export * from "./alt";
export * from "./delete";
export * from "./favourite";
export * from "./rating";
