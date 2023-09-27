import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}/reject`;

export interface FriendRequestRejectPayload {
  id: string;
}

export const {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  useRejectFriendRequestMutation: use_reject_friend_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    rejectFriendRequest: builder.mutation<void, FriendRequestRejectPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "FriendRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(
            self_action("self_pending_friend_request_count", "decrement")
          );
        });
      }
    })
  })
});
