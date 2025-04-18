import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/drafts/${id}/recover`;

export interface DraftRecoverPayload {
  id: string;
}

export const { useRecoverDraftMutation: use_recover_draft_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      recoverDraft: builder.mutation<void, DraftRecoverPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Story", id: arg.id }
        ],
        onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
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
