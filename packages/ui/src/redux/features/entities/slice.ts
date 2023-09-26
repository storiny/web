import {
  AnyAction,
  createSlice,
  PayloadAction,
  ThunkDispatch
} from "@reduxjs/toolkit";
import { Comment, Reply, Story, Tag, User } from "@storiny/types";

import { AppState } from "~/redux/store";
import { clamp } from "~/utils/clamp";

interface EntitiesPredicateState {
  blocks: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
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
  self_comment_count: number;
  self_deleted_draft_count: number;
  self_deleted_story_count: number;
  self_followed_tag_count: number;
  self_mute_count: number;
  self_pending_draft_count: number;
  self_pending_friend_request_count: number;
  self_published_story_count: number;
  self_reply_count: number;
}

export type EntitiesState = EntitiesPredicateState &
  EntitiesIntegralState &
  EntitiesSelfState;

type SyncableUser = Pick<User, "id"> &
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

type SyncableStory = Pick<Story, "id"> &
  Partial<Pick<Story, "is_liked" | "is_bookmarked" | "stats" | "user">>;

type SyncableTag = Pick<Tag, "id"> &
  Partial<Pick<Tag, "follower_count" | "is_following">>;

type SyncableComment = Pick<Comment, "id"> &
  Partial<
    Pick<Comment, "like_count" | "reply_count" | "is_liked" | "story" | "user">
  >;

type SyncableReply = Pick<Reply, "id"> &
  Partial<Pick<Reply, "like_count" | "is_liked" | "comment" | "user">>;

export const entities_initial_state: EntitiesState = {
  blocks: /*                           */ {},
  bookmarks: /*                        */ {},
  comment_like_counts: /*              */ {},
  comment_reply_counts: /*             */ {},
  followed_tags: /*                    */ {},
  follower_counts: /*                  */ {},
  followers: /*                        */ {},
  following: /*                        */ {},
  following_counts: /*                 */ {},
  friend_counts: /*                    */ {},
  friends: /*                          */ {},
  liked_comments: /*                   */ {},
  liked_replies: /*                    */ {},
  liked_stories: /*                    */ {},
  mutes: /*                            */ {},
  reply_like_counts: /*                */ {},
  sent_requests: /*                    */ {},
  story_comment_counts: /*             */ {},
  story_hidden_comment_counts: /*      */ {},
  story_like_counts: /*                */ {},
  subscriptions: /*                    */ {},
  tag_follower_counts: /*              */ {},
  self_block_count: /*                 */ 0,
  self_comment_count: /*               */ 0,
  self_deleted_draft_count: /*         */ 0,
  self_deleted_story_count: /*         */ 0,
  self_followed_tag_count: /*          */ 0,
  self_mute_count: /*                  */ 0,
  self_pending_draft_count: /*         */ 0,
  self_pending_friend_request_count: /**/ 0,
  self_published_story_count: /*       */ 0,
  self_reply_count: /*                 */ 0
};

/**
 * Predicate function for validating numbers
 * @param value Value to check
 */
export const is_num = (value?: number | string | null): value is number =>
  typeof value === "number";

/**
 * Predicate function for validating boolean values
 * @param value Value to check
 */
export const is_bool = (value?: boolean): value is boolean =>
  typeof value === "boolean";

export const number_action =
  (
    key: {
      [K in keyof EntitiesState]: EntitiesState[K] extends Record<
        string,
        number
      >
        ? K
        : never;
    }[keyof EntitiesState],
    id: string,
    value_or_callback:
      | "increment"
      | "decrement"
      | number
      | ((prev_value: number) => number)
  ) =>
  (
    dispatch: ThunkDispatch<AppState, unknown, AnyAction>,
    get_state: () => AppState
  ): void => {
    if (typeof value_or_callback === "number") {
      dispatch(set_entity_record_value([key, id, value_or_callback]));
    } else {
      const prev_value = get_state().entities[key][id] as number | undefined;
      const curr_value = typeof prev_value === "undefined" ? 0 : prev_value;
      const next_value = clamp(
        0,
        value_or_callback === "increment"
          ? curr_value + 1
          : value_or_callback === "decrement"
          ? curr_value - 1
          : value_or_callback(curr_value),
        Infinity
      );

      dispatch(set_entity_record_value([key, id, next_value]));
    }
  };

export const boolean_action =
  (
    key: {
      [K in keyof EntitiesState]: EntitiesState[K] extends Record<
        string,
        boolean
      >
        ? K
        : never;
    }[keyof EntitiesState],
    id: string,
    valueOrCallback?: boolean | ((prevValue: boolean) => boolean)
  ) =>
  (
    dispatchAction: ThunkDispatch<AppState, unknown, AnyAction>,
    getState: () => AppState
  ): void => {
    if (typeof valueOrCallback === "boolean") {
      dispatchAction(set_entity_record_value([key, id, valueOrCallback]));
    } else {
      const prevValue = getState().entities[key][id] as boolean | undefined;
      // Set to `true` when absent from the map
      const currValue = typeof prevValue === "undefined" ? true : prevValue;

      if (typeof valueOrCallback === "undefined") {
        dispatchAction(set_entity_record_value([key, id, !currValue])); // Toggle value
      } else {
        dispatchAction(
          set_entity_record_value([key, id, valueOrCallback(currValue)])
        );
      }
    }
  };

/**
 * Sets the entity value
 * @param key Entity key
 * @param type Type of the entity
 */
export const setEntityValue =
  <
    T extends Record<any, any>,
    Q extends "boolean" | "number",
    K = Q extends "boolean" ? boolean : number
  >(
    key: keyof T,
    type: Q
  ) =>
  (
    state: T,
    action: PayloadAction<
      Q extends "boolean"
        ? [string] | [string, ((prevState: K) => K) | undefined] // Allow `undefined` for `boolean` type to toggle the value
        : [string, (prevState: K) => K]
    >
  ): void => {
    const [entityId, callback] = action.payload;
    const prevState = state[key][entityId] as K | undefined;

    if (typeof prevState === "undefined" && type === "boolean") {
      // Set to `true` when absent from the map
      state[key][entityId] = true;
    }

    if (type === "boolean") {
      if (!callback) {
        state[key][entityId] = !prevState;
      } else {
        state[key][entityId] = callback(
          (typeof prevState === "undefined" ? 0 : prevState) as K
        );
      }
    } else {
      const newValue = callback!(
        (typeof prevState === "undefined" ? 0 : prevState) as K
      );

      state[key][entityId] = clamp(0, newValue as number, Infinity);
    }
  };

export const self_action =
  (
    key: {
      [K in keyof EntitiesState]: EntitiesState[K] extends number ? K : never;
    }[keyof EntitiesState],
    value_or_callback:
      | "increment"
      | "decrement"
      | number
      | ((prev_value: number) => number)
  ) =>
  (
    dispatch: ThunkDispatch<AppState, unknown, AnyAction>,
    get_state: () => AppState
  ): void => {
    if (typeof value_or_callback === "number") {
      dispatch(set_entity_value([key, value_or_callback]));
    } else {
      const prev_value = get_state().entities[key] as number | undefined;
      const curr_value = typeof prev_value === "undefined" ? 0 : prev_value;
      const next_value = clamp(
        0,
        value_or_callback === "increment"
          ? curr_value + 1
          : value_or_callback === "decrement"
          ? curr_value - 1
          : value_or_callback(curr_value),
        Infinity
      );

      dispatch(set_entity_value([key, next_value]));
    }
  };

/**
 * Sync incoming user to the store
 * @param state App state
 * @param user Incoming user
 */
const syncWithUserImpl = (state: EntitiesState, user: SyncableUser): void => {
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

/**
 * Sync incoming story to the store
 * @param state App state
 * @param story Incoming story
 */
const syncWithStoryImpl = (
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
    syncWithUserImpl(state, story.user);
  }
};

/**
 * Sync incoming tag to the store
 * @param state App state
 * @param tag Incoming tag
 */
const syncWithTagImpl = (state: EntitiesState, tag: SyncableTag): void => {
  // Predicates
  if (is_bool(tag.is_following)) {
    state.followed_tags[tag.id] = tag.is_following;
  }

  // Integral
  if (is_num(tag.follower_count)) {
    state.tag_follower_counts[tag.id] = tag.follower_count;
  }
};

/**
 * Sync incoming comment to the store
 * @param state App state
 * @param comment Incoming comment
 */
const syncWithCommentImpl = (
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
    syncWithUserImpl(state, comment.user);
  }

  if (comment.story) {
    syncWithStoryImpl(state, comment.story);
  }
};

/**
 * Sync incoming comment to the store
 * @param state App state
 * @param reply Incoming reply
 */
const syncWithReplyImpl = (
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
    syncWithUserImpl(state, reply.user);
  }

  if (reply.comment) {
    syncWithCommentImpl(state, reply.comment);
  }
};

export const entities_slice = createSlice({
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
          number | boolean
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
    syncWithUser: (state, action: PayloadAction<SyncableUser>) =>
      syncWithUserImpl(state, action.payload),
    syncWithStory: (state, action: PayloadAction<SyncableStory>) =>
      syncWithStoryImpl(state, action.payload),
    syncWithTag: (state, action: PayloadAction<SyncableTag>) =>
      syncWithTagImpl(state, action.payload),
    syncWithComment: (state, action: PayloadAction<SyncableComment>) =>
      syncWithCommentImpl(state, action.payload),
    syncWithReply: (state, action: PayloadAction<SyncableReply>) =>
      syncWithReplyImpl(state, action.payload)
  }
});

export const {
  set_entity_record_value,
  set_entity_value,
  syncWithComment,
  syncWithReply,
  syncWithStory,
  syncWithTag,
  syncWithUser
} = entities_slice.actions;

export default entities_slice.reducer;
