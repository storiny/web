import { Asset } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/assets";
const ITEMS_PER_PAGE = 15;

export type GetUserAssetsResponse = Asset[];

export const { useGetAssetsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<
      { hasMore: boolean; items: Asset[] },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      transformResponse: (response: Asset[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
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
