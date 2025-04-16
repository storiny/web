import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blog-requests/${id}`;

export interface RejectBlogRequestPayload {
  id: string;
}

export const {
  useRejectBlogRequestMutation: use_reject_blog_request_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    rejectBlogRequest: builder.mutation<void, RejectBlogRequestPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "BlogRequest", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(self_action("self_pending_blog_request_count", "decrement"));
        });
      }
    })
  })
});
