import { is_bool } from "@storiny/shared/src/utils/is-bool";
import { is_num } from "@storiny/shared/src/utils/is-num";
import { Tag } from "@storiny/types";

import { EntitiesState } from "~/redux/features";

export type SyncableTag = Pick<Tag, "id"> &
  Partial<Pick<Tag, "follower_count" | "is_following">>;

/**
 * Syncs an incoming tag to the store
 * @param state App state
 * @param tag Incoming tag
 */
export const sync_with_tag_impl = (
  state: EntitiesState,
  tag: SyncableTag
): void => {
  // Predicates
  if (is_bool(tag.is_following)) {
    state.followed_tags[tag.id] = tag.is_following;
  }

  // Integral
  if (is_num(tag.follower_count)) {
    state.tag_follower_counts[tag.id] = tag.follower_count;
  }
};
