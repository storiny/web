import { ContentType } from "@storiny/shared";
import { DocUserRole } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string =>
  `me/stories/${story_id}/contributors`;

export interface InviteContributorPayload {
  role: Exclude<DocUserRole, "reader" | "blog-member">;
  story_id: string;
  username: string;
}

export const { useInviteContributorMutation: use_invite_contributor_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      inviteContributor: builder.mutation<void, InviteContributorPayload>({
        query: ({ story_id, username, role }) => ({
          url: `/${SEGMENT(story_id)}`,
          method: "POST",
          body: { role, username },
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: ["CollaborationRequest"]
      })
    })
  });
