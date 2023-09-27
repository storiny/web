import { self_action, set_self_friend_count } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}/accept`;

export interface FriendRequestAcceptPayload {
  id: string;
}

export const {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  useAcceptFriendRequestMutation: use_accept_friend_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    acceptFriendRequest: builder.mutation<void, FriendRequestAcceptPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "FriendRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            set_self_friend_count("increment"),
            self_action("self_pending_friend_request_count", "decrement")
          ].forEach(dispatch);
        });
      }
    })
  })
});
