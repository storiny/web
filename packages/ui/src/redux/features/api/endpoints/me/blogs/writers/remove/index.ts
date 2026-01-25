import { number_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, user_id: string): string =>
  `me/blogs/${blog_id}/writers/${user_id}`;

export interface RemoveBlogWriterPayload {
  blog_id: string;
  user_id: string;
}

export const { useRemoveBlogWriterMutation: use_remove_blog_writer_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      removeBlogWriter: builder.mutation<void, RemoveBlogWriterPayload>({
        query: ({ blog_id, user_id }) => ({
          url: `/${SEGMENT(blog_id, user_id)}`,
          method: "DELETE"
        }),
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            dispatch(
              number_action("blog_writer_counts", arg.blog_id, "decrement")
            );
          });
        }
      })
    })
  });
