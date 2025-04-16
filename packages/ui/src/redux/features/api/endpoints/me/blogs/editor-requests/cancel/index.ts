import { number_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, id: string): string =>
  `me/blogs/${blog_id}/editor-requests/${id}/cancel`;

export interface CancelBlogEditorRequestPayload {
  blog_id: string;
  id: string;
}

export const {
  useCancelBlogEditorRequestMutation: use_cancel_blog_editor_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    cancelBlogEditorRequest: builder.mutation<
      void,
      CancelBlogEditorRequestPayload
    >({
      query: ({ blog_id, id }) => ({
        url: `/${SEGMENT(blog_id, id)}`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "BlogEditorRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(
            number_action(
              "blog_pending_editor_request_counts",
              arg.blog_id,
              "decrement"
            )
          );
        });
      }
    })
  })
});
