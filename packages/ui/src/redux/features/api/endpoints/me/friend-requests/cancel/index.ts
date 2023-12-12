import { boolean_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friend-requests/${id}/cancel`;

export interface CancelFriendRequestPayload {
  id: string;
}

export const {
  useCancelFriendRequestMutation: use_cancel_friend_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    cancelFriendRequest: builder.mutation<void, CancelFriendRequestPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "FriendRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(boolean_action("sent_requests", arg.id, false));
        });
      }
    })
  })
});
