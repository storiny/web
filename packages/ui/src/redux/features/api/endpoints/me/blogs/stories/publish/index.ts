import { ContentType } from "@storiny/shared";

import { number_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, story_id: string): string =>
  `me/blogs/${blog_id}/stories/${story_id}`;

export interface BlogStoryPublishPayload {
  blog_id: string;
  status: "draft" | "published";
  story_id: string;
  word_count: number;
}

export const { usePublishBlogStoryMutation: use_publish_blog_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      publishBlogStory: builder.mutation<void, BlogStoryPublishPayload>({
        query: ({ blog_id, story_id, word_count, status }) => ({
          url: `/${SEGMENT(blog_id, story_id)}`,
          body: { word_count },
          headers: { "Content-type": ContentType.JSON },
          method: status === "draft" ? "POST" : "PUT"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Story", id: arg.story_id }
        ],
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            if (arg.status === "draft") {
              // Story published
              [
                number_action(
                  "blog_pending_story_counts",
                  arg.blog_id,
                  "decrement"
                ),
                number_action(
                  "blog_published_story_counts",
                  arg.blog_id,
                  "increment"
                )
              ].forEach(dispatch);
            }
          });
        }
      })
    })
  });
