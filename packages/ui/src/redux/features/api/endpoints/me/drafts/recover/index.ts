import { self_action } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/drafts/${id}/recover`;

export interface DraftRecoverResponse {}
export interface DraftRecoverPayload {
  id: string;
}

export const { useRecoverDraftMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    recoverDraft: builder.mutation<DraftRecoverResponse, DraftRecoverPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            self_action("self_pending_draft_count", "increment"),
            self_action("self_deleted_draft_count", "decrement")
          ].forEach(dispatch);
        });
      }
    })
  })
});
