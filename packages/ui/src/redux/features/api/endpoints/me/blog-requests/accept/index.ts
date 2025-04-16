import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blog-requests/${id}`;

export interface AcceptBlogRequestPayload {
  id: string;
}

export const {
  useAcceptBlogRequestMutation: use_accept_blog_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    acceptBlogRequest: builder.mutation<void, AcceptBlogRequestPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "BlogRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            self_action("self_blog_count", "increment"),
            self_action("self_pending_blog_request_count", "decrement")
          ].forEach(dispatch);
        });
      }
    })
  })
});
