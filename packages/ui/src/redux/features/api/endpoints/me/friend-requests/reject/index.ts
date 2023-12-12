import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}`;

export interface RejectFriendRequestPayload {
  id: string;
}

export const {
  useRejectFriendRequestMutation: use_reject_friend_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    rejectFriendRequest: builder.mutation<void, RejectFriendRequestPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
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
