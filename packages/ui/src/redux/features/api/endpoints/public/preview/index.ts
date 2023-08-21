import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (storyId: string): string => `public/preview/${storyId}`;

export type GetStoryPreviewResponse = Story;

export const { useGetStoryPreviewQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoryPreview: builder.query<
      Story,
      {
        storyId: string;
      }
    >({
      query: ({ storyId }) => `/${SEGMENT(storyId)}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.storyId}`,
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.storyId !== previousArg?.storyId
    })
  })
});
