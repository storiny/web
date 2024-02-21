import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blog/${blog_id}/editors`;

export type GetBlogEditorsResponse = User[];

export const { useGetBlogEditorsQuery: use_get_blog_editors_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getBlogEditors: builder.query<GetBlogEditorsResponse, { id: string }>({
        query: ({ id }) => `/${SEGMENT(id)}`
      })
    })
  });
