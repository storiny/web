import { StoryMetadataSchema } from "@storiny/editor/src/components/metadata-modal/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/metadata`;

export type StoryMetadataResponse = { has_blog_modified: boolean };

export interface StoryMetadataPayload extends Partial<StoryMetadataSchema> {
  id: string;
}

export const { useStoryMetadataMutation: use_story_metadata_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
