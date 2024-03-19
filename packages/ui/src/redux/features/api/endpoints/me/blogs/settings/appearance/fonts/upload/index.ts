import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/settings/appearance/fonts/upload`;

export type BlogFontUploadReponse = { id: string };

export interface BlogFontUploadPayload {
  blog_id: string;
  file: File;
  variant: "primary" | "secondary" | "code";
}

export const { useUploadBlogFontMutation: use_upload_blog_font_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      uploadBlogFont: builder.mutation<
        BlogFontUploadReponse,
        BlogFontUploadPayload
      >({
        query: ({ blog_id, type, file }) => {
          const body = new FormData();
          body.append("Content-Type", file.type);
          body.append("file", file);
          body.append("type", type);

          return {
            url: `/${SEGMENT(blog_id)}`,
            method: "POST",
            body
          };
        }
      })
    })
  });
