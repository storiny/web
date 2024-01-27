import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/collaboration-requests/${id}/cancel`;

export interface CancelCollaborationRequestPayload {
  id: string;
}

export const {
  useCancelCollaborationRequestMutation:
    use_cancel_collaboration_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    cancelCollaborationRequest: builder.mutation<
      void,
      CancelCollaborationRequestPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "CollaborationRequest", id: arg.id }
      ]
    })
  })
});
