import {
  decrementAction,
  setSelfPendingFriendRequestCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}/reject`;

export interface FriendRequestRejectResponse {}
export interface FriendRequestRejectPayload {
  id: string;
}

export const { useRejectFriendRequestMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    rejectFriendRequest: builder.mutation<
      FriendRequestRejectResponse,
      FriendRequestRejectPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setSelfPendingFriendRequestCount(decrementAction));
        });
      }
    })
  })
});
