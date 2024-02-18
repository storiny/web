import { is_bool } from "@storiny/shared/src/utils/is-bool";
import { is_num } from "@storiny/shared/src/utils/is-num";
import { Blog } from "@storiny/types";

import { EntitiesState } from "~/redux/features";

export type SyncableBlog = Pick<Blog, "id"> &
  Partial<Pick<Blog, "is_following" | "follower_count">>;

/**
 * Syncs an incoming blog to the store
 * @param state App state
 * @param blog Incoming blog
 */
export const sync_with_blog_impl = (
  state: EntitiesState,
  blog: SyncableBlog
): void => {
  // Predicates
  if (is_bool(blog.is_following)) {
    state.followed_blogs[blog.id] = blog.is_following;
  }

  // Integral
  if (is_num(blog.follower_count)) {
    state.blog_follower_counts[blog.id] = blog.follower_count;
  }
};
