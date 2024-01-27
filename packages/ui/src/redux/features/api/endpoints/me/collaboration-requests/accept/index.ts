import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/collaboration-requests/${id}`;

export interface AcceptCollaborationRequestPayload {
  id: string;
}

export const {
  useAcceptCollaborationRequestMutation:
    use_accept_collaboration_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    acceptCollaborationRequest: builder.mutation<
      void,
      AcceptCollaborationRequestPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "CollaborationRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            self_action("self_contributable_story_count", "increment"),
            self_action("self_pending_collaboration_request_count", "decrement")
          ].forEach(dispatch);
        });
      }
    })
  })
});
