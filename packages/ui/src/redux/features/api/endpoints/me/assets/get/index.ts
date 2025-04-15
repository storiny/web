import { Asset } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/assets";
const ITEMS_PER_PAGE = 15;

export type GetUserAssetsResponse = Asset[];

export const get_assets_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getAssets: builder.query<
      { has_more: boolean; items: Asset[]; page: number },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      transformResponse: (response: Asset[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (cache, data) => merge_fn(cache, data),
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
