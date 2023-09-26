import { self_action } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/drafts/${id}`;

export interface DraftDeleteResponse {}
export interface DraftDeletePayload {
  id: string;
}

export const { useDeleteDraftMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    deleteDraft: builder.mutation<DraftDeleteResponse, DraftDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            self_action("self_pending_draft_count", "decrement"),
            self_action("self_deleted_draft_count", "increment")
          ].forEach(dispatch);
        });
      }
    })
  })
});
