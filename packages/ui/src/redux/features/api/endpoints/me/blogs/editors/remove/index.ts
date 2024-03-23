import { number_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, user_id: string): string =>
  `me/blogs/${blog_id}/editors/${user_id}`;

export interface RemoveBlogEditorPayload {
  blog_id: string;
  user_id: string;
}

export const { useRemoveBlogEditorMutation: use_remove_blog_editor_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      removeBlogEditor: builder.mutation<void, RemoveBlogEditorPayload>({
        query: ({ blog_id, user_id }) => ({
          url: `/${SEGMENT(blog_id, user_id)}`,
          method: "DELETE"
        }),
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            dispatch(
              number_action("blog_editor_counts", arg.blog_id, "decrement")
            );
          });
        }
      })
    })
  });
