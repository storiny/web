import { Comment } from "@storiny/types";
import { StoryResponsesSortValue } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/content/stories/[story_id]/responses/client";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string =>
  `public/stories/${story_id}/comments`;
const ITEMS_PER_PAGE = 10;

export type GetStoryCommentsResponse = Comment[];

export const get_story_comments_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStoryComments: builder.query<
      { has_more: boolean; items: Comment[] },
      {
        page: number;
        query?: string;
        sort: StoryResponsesSortValue;
        story_id: string;
        type: "all" | "hidden";
      }
    >({
      query: ({ story_id, type, page, sort, query }) =>
        `/${SEGMENT(story_id)}?type=${type}&page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.story_id}:${queryArgs.type}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Comment[]) => ({
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
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
                type: "Comment" as const,
                id
              })),
              "Comment"
            ]
          : ["Comment"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.story_id !== previousArg?.story_id ||
        currentArg?.type !== previousArg?.type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetStoryCommentsQuery: use_get_story_comments_query } =
  get_story_comments_api;
