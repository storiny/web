import { StoryMetadataSchema } from "@storiny/editor/src/components/metadata-modal/schema";
import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/metadata`;

export type StoryMetadataResponse = Story;
export interface StoryMetadataPayload extends Partial<StoryMetadataSchema> {
  id: string;
}

export const { useStoryMetadataMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    storyMetadata: builder.mutation<
      StoryMetadataResponse,
      StoryMetadataPayload
    >({
      query: ({ id, ...rest }) => ({
        url: `/${SEGMENT(id)}`,
        method: "PATCH",
        body: rest
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }]
    })
  })
});
