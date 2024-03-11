import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, id: string): string =>
  `me/blogs/${blog_id}/writer-requests/${id}/cancel`;

export interface CancelBlogWriterRequestPayload {
  blog_id: string;
  id: string;
}

export const {
  useCancelBlogWriterRequestMutation: use_cancel_blog_writer_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    cancelBlogWriterRequest: builder.mutation<
      void,
      CancelBlogWriterRequestPayload
    >({
      query: ({ blog_id, id }) => ({
        url: `/${SEGMENT(blog_id, id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "BlogWriterRequest", id: arg.id }
      ]
    })
  })
});
