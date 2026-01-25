import { Comment } from "@storiny/types";
import { StoryResponsesSortValue } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/content/stories/[story_id]/responses/client";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string =>
  `public/stories/${story_id}/comments`;
const ITEMS_PER_PAGE = 10;

export type GetStoryCommentsResponse = Comment[];

export const get_story_comments_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getStoryComments: builder.query<
      { has_more: boolean; items: Comment[]; page: number },
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
      transformResponse: (response: Comment[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
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

export const {
  useLazyGetStoryCommentsQuery: use_get_story_comments_query,
  endpoints: {
    getStoryComments: { select: select_story_comments }
  }
} = get_story_comments_api;
