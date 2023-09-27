import { is_bool } from "@storiny/shared/src/utils/is-bool";
import { is_num } from "@storiny/shared/src/utils/is-num";
import { Reply } from "@storiny/types";

import { EntitiesState } from "~/redux/features";
import { sync_with_comment_impl } from "~/redux/features/entities/sync/comment";
import { sync_with_user_impl } from "~/redux/features/entities/sync/user";

export type SyncableReply = Pick<Reply, "id"> &
  Partial<Pick<Reply, "like_count" | "is_liked" | "comment" | "user">>;

/**
 * Syncs an incoming reply to the store
 * @param state App state
 * @param reply Incoming reply
 */
export const sync_with_reply_impl = (
  state: EntitiesState,
  reply: SyncableReply
): void => {
  // Predicates
  if (is_bool(reply.is_liked)) {
    state.liked_replies[reply.id] = reply.is_liked;
  }

  // Integral
  if (is_num(reply.like_count)) {
    state.reply_like_counts[reply.id] = reply.like_count;
  }

  // Other
  if (reply.user) {
    sync_with_user_impl(state, reply.user);
  }

  if (reply.comment) {
    sync_with_comment_impl(state, reply.comment);
  }
};
