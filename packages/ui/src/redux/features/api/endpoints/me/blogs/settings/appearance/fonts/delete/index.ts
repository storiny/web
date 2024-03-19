import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string, variant: string): string =>
  `me/blogs/${id}/settings/appearance/fonts/${variant}`;

export interface BlogFontDeletePayload {
  blog_id: string;
  variant: "primary" | "secondary" | "code";
}

export const { useDeleteBlogFontMutation: use_delete_blog_font_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      deleteBlogFont: builder.mutation<void, BlogFontDeletePayload>({
        query: ({ variant, blog_id }) => ({
          url: `/${SEGMENT(blog_id, variant)}`,
          method: "DELETE"
        })
      })
    })
  });
