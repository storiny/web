import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/leave-story/${id}`;

export interface LeaveStoryRequestPayload {
  id: string;
}

export const { useLeaveStoryMutation: use_leave_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      leaveStory: builder.mutation<void, LeaveStoryRequestPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Story", id: arg.id }
        ]
      })
    })
  });
