import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/collaboration-requests/${id}`;

export interface RejectCollaborationRequestPayload {
  id: string;
}

export const {
  useRejectCollaborationRequestMutation:
    use_reject_collaboration_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    rejectCollaborationRequest: builder.mutation<
      void,
      RejectCollaborationRequestPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "CollaborationRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(
            self_action("self_pending_collaboration_request_count", "decrement")
          );
        });
      }
    })
  })
});
