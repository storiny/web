import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "feed";
const ITEMS_PER_PAGE = 10;

export type GetHomeFeedResponse = Story[];

export const { useGetHomeFeedQuery: use_get_home_feed_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getHomeFeed: builder.query<
        { has_more: boolean; items: Story[]; page: number },
        { page: number; type: "suggested" | "friends-and-following" }
      >({
        query: ({ page, type = "suggested" }) =>
          `/${SEGMENT}?page=${page}&type=${type}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.type}`,
        transformResponse: (response: Story[], _, { page }) => ({
          page,
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (cache, data) => merge_fn(cache, data),
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.type !== previousArg?.type
      })
    })
  });
