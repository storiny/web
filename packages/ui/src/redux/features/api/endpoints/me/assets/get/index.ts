import { Asset } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const GET_SEGMENT = "me/assets";
const ITEMS_PER_PAGE = 15;

export type GetUserAssetsResponse = Asset[];

export const { useGetUserAssetsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserAssets: builder.query<
      { hasMore: boolean; items: Asset[] },
      { page: number }
    >({
      query: ({ page }) => `/${GET_SEGMENT}?page=${page}`,
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
    })
  })
});
