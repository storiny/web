import { ContentType } from "@storiny/shared";
import { DocUserRole } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string, username: string): string =>
  `me/stories/${story_id}/contributors/${username}`;

export interface InviteContributorPayload {
  role: Exclude<DocUserRole, "reader">;
  story_id: string;
  username: string;
}

export const { useInviteContributorMutation: use_invite_contributor_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      inviteContributor: builder.mutation<void, InviteContributorPayload>({
        query: ({ story_id, username, role }) => ({
          url: `/${SEGMENT(story_id, username)}`,
          method: "POST",
          body: { role },
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: ["CollaborationRequest"]
      })
    })
  });
