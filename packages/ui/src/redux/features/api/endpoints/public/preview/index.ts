import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string => `public/preview/${story_id}`;

export type GetStoryPreviewResponse = Story;

export const { useGetStoryPreviewQuery: use_get_story_preview_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getStoryPreview: builder.query<Story, string>({
        query: (story_id) => `/${SEGMENT(story_id)}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs}`,
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg !== previousArg
      })
    })
  });
