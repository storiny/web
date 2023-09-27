import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/drafts/${id}`;

export interface DraftDeletePayload {
  id: string;
}

export const { useDeleteDraftMutation: use_delete_draft_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      deleteDraft: builder.mutation<void, DraftDeletePayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Story", id: arg.id }
        ],
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
