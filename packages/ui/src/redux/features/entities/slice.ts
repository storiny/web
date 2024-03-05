import { createSlice as create_slice, PayloadAction } from "@reduxjs/toolkit";

import {
  sync_with_blog_impl,
  sync_with_comment_impl,
  sync_with_reply_impl,
  sync_with_story_impl,
  sync_with_tag_impl,
  sync_with_user_impl,
  SyncableBlog,
  SyncableComment,
  SyncableReply,
  SyncableStory,
  SyncableTag,
  SyncableUser
} from "~/redux/features/entities/sync";

interface EntitiesPredicateState {
  blocks: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  followed_blogs: Record<string, boolean>;
  followed_tags: Record<string, boolean>;
  followers: Record<string, boolean>;
  following: Record<string, boolean>;
  friends: Record<string, boolean>;
  liked_comments: Record<string, boolean>;
  liked_replies: Record<string, boolean>;
  liked_stories: Record<string, boolean>;
  mutes: Record<string, boolean>;
  sent_requests: Record<string, boolean>;
  subscriptions: Record<string, boolean>;
}

interface EntitiesIntegralState {
  blog_follower_counts: Record<string, number>;
  blog_pending_story_counts: Record<string, number>;
  comment_like_counts: Record<string, number>;
  comment_reply_counts: Record<string, number>;
  follower_counts: Record<string, number>;
  following_counts: Record<string, number>;
  friend_counts: Record<string, number>;
  reply_like_counts: Record<string, number>;
  story_comment_counts: Record<string, number>;
  story_hidden_comment_counts: Record<string, number>;
  story_like_counts: Record<string, number>;
  tag_follower_counts: Record<string, number>;
}

interface EntitiesSelfState {
  self_block_count: number;
  self_blog_count: number;
  self_comment_count: number;
  self_contributable_story_count: number;
  self_deleted_draft_count: number;
  self_deleted_story_count: number;
  self_followed_tag_count: number;
  self_mute_count: number;
  self_pending_blog_request_count: number;
  self_pending_collaboration_request_count: number;
  self_pending_draft_count: number;
  self_pending_friend_request_count: number;
  self_published_story_count: number;
  self_reply_count: number;
}

export type EntitiesState = EntitiesPredicateState &
  EntitiesIntegralState &
  EntitiesSelfState & { rate_limits: Record<string, boolean> };

export const entities_initial_state: EntitiesState = {
  blocks: /*                                  */ {},
  blog_follower_counts: /*                    */ {},
  blog_pending_story_counts: /*               */ {},
  bookmarks: /*                               */ {},
  comment_like_counts: /*                     */ {},
  comment_reply_counts: /*                    */ {},
  followed_blogs: /*                          */ {},
  followed_tags: /*                           */ {},
  follower_counts: /*                         */ {},
  followers: /*                               */ {},
  following: /*                               */ {},
  following_counts: /*                        */ {},
  friend_counts: /*                           */ {},
  friends: /*                                 */ {},
  liked_comments: /*                          */ {},
  liked_replies: /*                           */ {},
  liked_stories: /*                           */ {},
  mutes: /*                                   */ {},
  rate_limits: /*                             */ {},
  reply_like_counts: /*                       */ {},
  self_block_count: /*                        */ 0,
  self_blog_count: /*                         */ 0,
  self_comment_count: /*                      */ 0,
  self_contributable_story_count: /*          */ 0,
  self_deleted_draft_count: /*                */ 0,
  self_deleted_story_count: /*                */ 0,
  self_followed_tag_count: /*                 */ 0,
  self_mute_count: /*                         */ 0,
  self_pending_blog_request_count: /*         */ 0,
  self_pending_collaboration_request_count: /**/ 0,
  self_pending_draft_count: /*                */ 0,
  self_pending_friend_request_count: /*       */ 0,
  self_published_story_count: /*              */ 0,
  self_reply_count: /*                        */ 0,
  sent_requests: /*                           */ {},
  story_comment_counts: /*                    */ {},
  story_hidden_comment_counts: /*             */ {},
  story_like_counts: /*                       */ {},
  subscriptions: /*                           */ {},
  tag_follower_counts: /*                     */ {}
};

export const entities_slice = create_slice({
  name: "entities",
  initialState: entities_initial_state,
  reducers: {
    set_entity_record_value: (
      state: EntitiesState,
      action: PayloadAction<
        [
          {
            [K in keyof EntitiesState]: EntitiesState[K] extends Record<
              string,
              number | boolean
            >
              ? K
              : never;
          }[keyof EntitiesState],
          string,
          number | boolean,
          // Tags is the additional metadata attached to the action.
          tags?: Record<string, string | number | boolean>
        ]
      >
    ) => {
      const [key, id, value] = action.payload;
      state[key][id] = value;
    },
    set_entity_value: (
      state: EntitiesState,
      action: PayloadAction<
        [
          {
            [K in keyof EntitiesState]: EntitiesState[K] extends number
              ? K
              : never;
          }[keyof EntitiesState],
          number
        ]
      >
    ) => {
      const [key, value] = action.payload;
      state[key] = value;
    },
    // Syncing utils
    sync_with_user: (state, action: PayloadAction<SyncableUser>) =>
      sync_with_user_impl(state, action.payload),
    sync_with_story: (state, action: PayloadAction<SyncableStory>) =>
      sync_with_story_impl(state, action.payload),
    sync_with_blog: (state, action: PayloadAction<SyncableBlog>) =>
      sync_with_blog_impl(state, action.payload),
    sync_with_tag: (state, action: PayloadAction<SyncableTag>) =>
      sync_with_tag_impl(state, action.payload),
    sync_with_comment: (state, action: PayloadAction<SyncableComment>) =>
      sync_with_comment_impl(state, action.payload),
    sync_with_reply: (state, action: PayloadAction<SyncableReply>) =>
      sync_with_reply_impl(state, action.payload),
    set_rate_limit: (
      state,
      action: PayloadAction<[key: string, timestamp: boolean]>
    ) => {
      const [key, value] = action.payload;
      // Remove from cache if the value is `false`
      if (!value) {
        delete state.rate_limits[key];
      } else {
        state.rate_limits[key] = value;
      }
    }
  }
});

export const {
  set_entity_record_value,
  set_entity_value,
  sync_with_comment,
  sync_with_reply,
  sync_with_story,
  sync_with_blog,
  sync_with_tag,
  sync_with_user,
  set_rate_limit
} = entities_slice.actions;

export default entities_slice.reducer;
