import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (user_id: string): string => `user/${user_id}/stories`;
const ITEMS_PER_PAGE = 10;

export type GetUserStoriesResponse = Story[];

export const { useGetUserStoriesQuery: use_get_user_stories_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getUserStories: builder.query<
        { has_more: boolean; items: Story[] },
        {
          page: number;
          query?: string;
          sort: "recent" | "popular" | "old";
          user_id: string;
        }
      >({
        query: ({ page, sort = "recent", query, user_id }) =>
          `/${SEGMENT(user_id)}?page=${page}&sort=${sort}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.user_id}:${queryArgs.sort}:${queryArgs.query}`,
        transformResponse: (response: Story[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, new_items) => {
          current_cache.items.push(...new_items.items);
          current_cache.has_more = new_items.has_more;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.user_id !== previousArg?.user_id ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.sort !== previousArg?.sort ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
