import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/stories/${id}/read`;

export type ReadStoryPayload = { id: string; referrer: string; token: string };

export const { useReadStoryMutation: use_read_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      readStory: builder.mutation<void, ReadStoryPayload>({
        query: ({ id, ...rest }) => ({
          url: `/${SEGMENT(id)}`,
          method: "POST",
          body: rest,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
