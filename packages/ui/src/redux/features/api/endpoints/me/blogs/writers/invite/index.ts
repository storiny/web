import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `me/blogs/${blog_id}/writers`;

export interface InviteBlogWriterPayload {
  blog_id: string;
  username: string;
}

export const { useInviteBlogWriterMutation: use_invite_blog_writer_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      inviteBlogWriter: builder.mutation<void, InviteBlogWriterPayload>({
        query: ({ blog_id, username }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "POST",
          body: { username },
          headers: { "Content-type": ContentType.JSON }
        }),
        invalidatesTags: ["BlogWriterRequest"]
      })
    })
  });
