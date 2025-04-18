import { ContentType } from "@storiny/shared";
import { BlogDeleteActionSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/blogs/[identifier]/settings/general/delete-action/delete-action.schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/delete-blog`;

export type DeleteBlogPayload = BlogDeleteActionSchema & { blog_id: string };

export const { useDeleteBlogMutation: use_delete_blog_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      deleteBlog: builder.mutation<void, DeleteBlogPayload>({
        query: ({ blog_id, ...rest }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "POST",
          body: rest,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
