import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string, type: string): string =>
  `me/blogs/${id}/settings/appearance/fonts/${type}`;

export interface BlogFontDeletePayload {
  blog_id: string;
  type: "primary" | "secondary" | "code";
}

export const { useDeleteBlogFontMutation: use_delete_blog_font_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      deleteBlogFont: builder.mutation<void, BlogFontDeletePayload>({
        query: ({ type, blog_id }) => ({
          url: `/${SEGMENT(blog_id, type)}`,
          method: "DELETE"
        })
      })
    })
  });
