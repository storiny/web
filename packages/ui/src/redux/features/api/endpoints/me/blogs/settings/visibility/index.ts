import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/visibility`;

export type BlogVisibilityPayload = {
  blog_id: string;
  hidden: boolean;
};

export const { useBlogVisibilityMutation: use_blog_visibility_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      blogVisibility: builder.mutation<void, BlogVisibilityPayload>({
        query: ({ blog_id, ...body }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
