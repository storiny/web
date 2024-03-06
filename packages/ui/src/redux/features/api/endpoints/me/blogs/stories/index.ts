import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, story_id: string): string =>
  `me/blogs/${blog_id}/stories/${story_id}`;

export interface RemoveBlogStoryPayload {
  blog_id: string;
  story_id: string;
}

export const { useRemoveBlogStoryMutation: use_remove_blog_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      removeBlogStory: builder.mutation<void, RemoveBlogStoryPayload>({
        query: ({ blog_id, story_id }) => ({
          url: `/${SEGMENT(blog_id, story_id)}`,
          method: "DELETE"
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Story", id: arg.story_id }
        ]
      })
    })
  });
