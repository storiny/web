import {
  decrementAction,
  incrementAction,
  setSelfFriendCount,
  setSelfPendingFriendRequestCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}/accept`;

export interface FriendRequestAcceptResponse {}
export interface FriendRequestAcceptPayload {
  id: string;
}

export const { useFriendRequestAcceptMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    friendRequestAccept: builder.mutation<
      FriendRequestAcceptResponse,
      FriendRequestAcceptPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setSelfPendingFriendRequestCount(decrementAction));
          dispatch(setSelfFriendCount(incrementAction));
        });
      }
    })
  })
});
