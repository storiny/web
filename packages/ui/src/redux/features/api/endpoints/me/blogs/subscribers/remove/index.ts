import { number_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, subscriber_id: string): string =>
  `me/blogs/${blog_id}/subscribers/${subscriber_id}`;

export interface RemoveBlogSubscriberPayload {
  blog_id: string;
  subscriber_id: string;
}

export const {
  useRemoveBlogSubscriberMutation: use_remove_blog_subscriber_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    removeBlogSubscriber: builder.mutation<void, RemoveBlogSubscriberPayload>({
      query: ({ blog_id, subscriber_id }) => ({
        url: `/${SEGMENT(blog_id, subscriber_id)}`,
        method: "DELETE"
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(
            number_action("blog_subscriber_counts", arg.blog_id, "decrement")
          );
        });
      }
    })
  })
});
