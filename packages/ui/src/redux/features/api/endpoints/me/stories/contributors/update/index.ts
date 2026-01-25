import { ContentType } from "@storiny/shared";
import { DocUserRole } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string, user_id: string): string =>
  `me/stories/${story_id}/contributors/${user_id}`;

export interface UpdateContributorPayload {
  role: Exclude<DocUserRole, "reader" | "blog-member">;
  story_id: string;
  user_id: string;
}

export const { useUpdateContributorMutation: use_update_contributor_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      updateContributor: builder.mutation<void, UpdateContributorPayload>({
        query: ({ story_id, user_id, role }) => ({
          url: `/${SEGMENT(story_id, user_id)}`,
          method: "PATCH",
          body: { role },
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
