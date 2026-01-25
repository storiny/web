import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/stories/${id}/read`;

export type ReadStoryPayload = { id: string; referrer: string; token: string };

export const { useReadStoryMutation: use_read_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      readStory: builder.mutation<void, ReadStoryPayload>({
        query: ({ id, referrer, token }) => ({
          url: `/${SEGMENT(id)}?token=${token}&referrer=${encodeURIComponent(
            referrer
          )}`,
          method: "POST",
          keepalive: true // This is needed for the `pagehide` event
        })
      })
    })
  });
