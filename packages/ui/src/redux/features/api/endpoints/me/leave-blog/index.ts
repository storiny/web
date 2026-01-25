import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/leave-blog/${id}`;

export interface LeaveBlogPayload {
  id: string;
}

export const { useLeaveBlogMutation: use_leave_blog_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      leaveBlog: builder.mutation<void, LeaveBlogPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Blog", id: arg.id }
        ],
        onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            dispatch(self_action("self_blog_count", "decrement"));
          });
        }
      })
    })
  });
