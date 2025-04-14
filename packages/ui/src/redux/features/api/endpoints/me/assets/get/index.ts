import { Asset } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/assets";
const ITEMS_PER_PAGE = 15;

export type GetUserAssetsResponse = Asset[];

export const get_assets_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getAssets: builder.query<
      { has_more: boolean; items: Asset[] },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      transformResponse: (response: Asset[]) => ({
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (current_cache, data) => {
        const new_items = data.items.filter(
          (data_item) =>
            !current_cache.items.some((item) => data_item.id === item.id)
        );

        current_cache.items.push(...new_items);
        current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
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

export const { useGetAssetsQuery: use_get_assets_query } = get_assets_api;
