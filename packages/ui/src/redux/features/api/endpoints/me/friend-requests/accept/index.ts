import {
  incrementAction,
  self_action,
  setSelfFriendCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}/accept`;

export interface FriendRequestAcceptResponse {}
export interface FriendRequestAcceptPayload {
  id: string;
}

export const { useAcceptFriendRequestMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    acceptFriendRequest: builder.mutation<
      FriendRequestAcceptResponse,
      FriendRequestAcceptPayload
    >({
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
            self_action("self_pending_friend_request_count", "decrement")
          ].forEach(dispatch);
          // TODO: ---
          dispatch(setSelfFriendCount(incrementAction));
        });
      }
    })
  })
});
