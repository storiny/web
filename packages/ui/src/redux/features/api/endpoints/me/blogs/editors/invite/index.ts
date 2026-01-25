import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `me/blogs/${blog_id}/editors`;

export interface InviteBlogEditorPayload {
  blog_id: string;
  username: string;
}

export const { useInviteBlogEditorMutation: use_invite_blog_editor_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      inviteBlogEditor: builder.mutation<void, InviteBlogEditorPayload>({
        query: ({ blog_id, username }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "POST",
          body: { username },
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: ["BlogEditorRequest"]
      })
    })
  });
