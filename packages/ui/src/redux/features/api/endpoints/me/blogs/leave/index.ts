import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/leave`;

export interface LeaveBlogPayload {
  id: string;
}

export const { useLeaveBlogMutation: use_leave_blog_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      leaveBlog: builder.mutation<void, LeaveBlogPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (result, error, arg) => [{ type: "Blog", id: arg.id }]
      })
    })
  });
