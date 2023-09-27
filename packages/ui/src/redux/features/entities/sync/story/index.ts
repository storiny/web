import { is_bool } from "@storiny/shared/src/utils/is-bool";
import { is_num } from "@storiny/shared/src/utils/is-num";
import { Story } from "@storiny/types";

import { EntitiesState } from "~/redux/features";
import { sync_with_user_impl } from "~/redux/features/entities/sync/user";

export type SyncableStory = Pick<Story, "id"> &
  Partial<Pick<Story, "is_liked" | "is_bookmarked" | "stats" | "user">>;

/**
 * Syncs an incoming story to the store
 * @param state App state
 * @param story Incoming story
 */
export const sync_with_story_impl = (
  state: EntitiesState,
  story: SyncableStory
): void => {
  // Predicates
  if (is_bool(story.is_bookmarked)) {
    state.bookmarks[story.id] = story.is_bookmarked;
  }

  if (is_bool(story.is_liked)) {
    state.liked_stories[story.id] = story.is_liked;
  }

  if (story.stats) {
    // Integral
    if (is_num(story.stats.like_count)) {
      state.story_like_counts[story.id] = story.stats.like_count;
    }

    if (is_num(story.stats.comment_count)) {
      state.story_comment_counts[story.id] = story.stats.comment_count;
    }
  }

  // Other
  if (story.user) {
    sync_with_user_impl(state, story.user);
  }
};
