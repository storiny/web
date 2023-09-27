import { is_bool } from "@storiny/shared/src/utils/is-bool";
import { is_num } from "@storiny/shared/src/utils/is-num";
import { Comment } from "@storiny/types";

import { EntitiesState } from "~/redux/features";
import { sync_with_story_impl } from "~/redux/features/entities/sync/story";
import { sync_with_user_impl } from "~/redux/features/entities/sync/user";

export type SyncableComment = Pick<Comment, "id"> &
  Partial<
    Pick<Comment, "like_count" | "reply_count" | "is_liked" | "story" | "user">
  >;

/**
 * Syncs an incoming comment to the store
 * @param state App state
 * @param comment Incoming comment
 */
export const sync_with_comment_impl = (
  state: EntitiesState,
  comment: SyncableComment
): void => {
  // Predicates
  if (is_bool(comment.is_liked)) {
    state.liked_comments[comment.id] = comment.is_liked;
  }

  // Integral
  if (is_num(comment.like_count)) {
    state.comment_like_counts[comment.id] = comment.like_count;
  }

  if (is_num(comment.reply_count)) {
    state.comment_reply_counts[comment.id] = comment.reply_count;
  }

  // Other
  if (comment.user) {
    sync_with_user_impl(state, comment.user);
  }

  if (comment.story) {
    sync_with_story_impl(state, comment.story);
  }
};
