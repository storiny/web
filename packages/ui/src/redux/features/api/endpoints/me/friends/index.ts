import { boolean_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/friends/${id}`;

export interface SendFriendRequestPayload {
  id: string;
}

export const {
  useSendFriendRequestMutation: use_send_friend_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    sendFriendRequest: builder.mutation<void, SendFriendRequestPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: ["FriendRequest"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(boolean_action("sent_requests", arg.id, true));
        });
      }
    })
  })
});
