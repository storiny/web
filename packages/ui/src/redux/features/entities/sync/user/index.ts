import { is_bool } from "@storiny/shared/src/utils/is-bool";
import { is_num } from "@storiny/shared/src/utils/is-num";
import { User } from "@storiny/types";

import { EntitiesState } from "~/redux/features";

export type SyncableUser = Pick<User, "id"> &
  Partial<
    Pick<
      User,
      | "is_follower"
      | "is_following"
      | "is_friend"
      | "is_subscribed"
      | "is_friend_request_sent"
      | "is_muted"
      | "is_blocking"
      | "follower_count"
      | "following_count"
      | "friend_count"
    >
  >;

/**
 * Syncs an incoming user to the store
 * @param state App state
 * @param user Incoming user
 */
export const sync_with_user_impl = (
  state: EntitiesState,
  user: SyncableUser
): void => {
  // Predicates
  if (is_bool(user.is_following)) {
    state.following[user.id] = user.is_following;
  }

  if (is_bool(user.is_follower)) {
    state.followers[user.id] = user.is_follower;
  }

  if (is_bool(user.is_friend)) {
    state.friends[user.id] = user.is_friend;
  }

  if (is_bool(user.is_muted)) {
    state.mutes[user.id] = user.is_muted;
  }

  if (is_bool(user.is_blocking)) {
    state.blocks[user.id] = user.is_blocking;
  }

  if (is_bool(user.is_subscribed)) {
    state.subscriptions[user.id] = user.is_subscribed;
  }

  if (is_bool(user.is_friend_request_sent)) {
    state.sent_requests[user.id] = user.is_friend_request_sent;
  }

  // Integral
  if (is_num(user.follower_count)) {
    state.follower_counts[user.id] = user.follower_count;
  }

  if (is_num(user.following_count)) {
    state.following_counts[user.id] = user.following_count;
  }

  if (is_num(user.friend_count)) {
    state.friend_counts[user.id] = user.friend_count;
  }
};
