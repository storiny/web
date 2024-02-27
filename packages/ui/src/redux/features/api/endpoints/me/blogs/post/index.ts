import { ContentType } from "@storiny/shared";

import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/blogs";

export interface CreateBlogPayload {
  name: string;
  slug: string;
}

export const { useCreateBlogMutation: use_create_blog_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      createBlog: builder.mutation<void, CreateBlogPayload>({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: "POST",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: ["Blog"],
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            dispatch(self_action("self_blog_count", "increment"));
          });
        }
      })
    })
  });
