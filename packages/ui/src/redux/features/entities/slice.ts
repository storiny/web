import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Comment, Reply, Story, Tag, User } from "@storiny/types";

import { clamp } from "~/utils/clamp";

interface EntitiesPredicateState {
  blocks: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  followedTags: Record<string, boolean>;
  followers: Record<string, boolean>;
  following: Record<string, boolean>;
  friends: Record<string, boolean>;
  likedComments: Record<string, boolean>;
  likedReplies: Record<string, boolean>;
  likedStories: Record<string, boolean>;
  mutes: Record<string, boolean>;
  sentRequests: Record<string, boolean>;
  subscriptions: Record<string, boolean>;
}

interface EntitiesIntegralState {
  commentLikeCounts: Record<string, number>;
  commentReplyCounts: Record<string, number>;
  followerCounts: Record<string, number>;
  followingCounts: Record<string, number>;
  friendCounts: Record<string, number>;
  replyLikeCounts: Record<string, number>;
  storyCommentCounts: Record<string, number>;
  storyHiddenCommentCounts: Record<string, number>;
  storyLikeCounts: Record<string, number>;
  tagFollowerCounts: Record<string, number>;
}

interface EntitiesSelfState {
  selfBlockCount: number;
  selfCommentCount: number;
  selfDeletedDraftCount: number;
  selfDeletedStoryCount: number;
  selfFollowedTagCount: number;
  selfMuteCount: number;
  selfPendingDraftCount: number;
  selfPendingFriendRequestCount: number;
  selfPublishedStoryCount: number;
  selfReplyCount: number;
}

export type EntitiesState = EntitiesPredicateState &
  EntitiesIntegralState &
  EntitiesSelfState;

type SyncableUser = Pick<
  User,
  | "id"
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
>;

type SyncableStory = Pick<
  Story,
  "id" | "is_liked" | "is_bookmarked" | "stats" | "user"
>;

type SyncableTag = Pick<Tag, "id" | "follower_count" | "is_following">;

type SyncableComment = Pick<
  Comment,
  "id" | "like_count" | "reply_count" | "is_liked" | "story" | "user"
>;

type SyncableReply = Pick<
  Reply,
  "id" | "like_count" | "is_liked" | "comment" | "user"
>;

export const entitiesInitialState: EntitiesState = {
  blocks: {},
  bookmarks: {},
  commentLikeCounts: {},
  commentReplyCounts: {},
  followedTags: {},
  followerCounts: {},
  followers: {},
  following: {},
  followingCounts: {},
  friendCounts: {},
  friends: {},
  likedComments: {},
  likedReplies: {},
  likedStories: {},
  mutes: {},
  replyLikeCounts: {},
  selfBlockCount: 0,
  selfCommentCount: 0,
  selfDeletedDraftCount: 0,
  selfDeletedStoryCount: 0,
  selfFollowedTagCount: 0,
  selfMuteCount: 0,
  selfPendingDraftCount: 0,
  selfPendingFriendRequestCount: 0,
  selfPublishedStoryCount: 0,
  selfReplyCount: 0,
  sentRequests: {},
  storyCommentCounts: {},
  storyHiddenCommentCounts: {},
  storyLikeCounts: {},
  subscriptions: {},
  tagFollowerCounts: {}
};

/**
 * Predicate function for validating numbers
 * @param value Value to check
 */
export const isNum = (value?: number | string | null): value is number =>
  typeof value === "number";

/**
 * Predicate function for validating boolean values
 * @param value Value to check
 */
export const isBool = (value?: boolean): value is boolean =>
  typeof value === "boolean";

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

/**
 * Sets the integral entity value for the user
 * @param key Entity key
 */
export const setSelfEntityValue =
  <T extends Record<any, any>>(key: keyof T) =>
  (state: T, action: PayloadAction<(prevState: number) => number>): void => {
    const callback = action.payload;
    const prevState = state[key] as number | undefined;
    const newValue = callback(typeof prevState === "undefined" ? 0 : prevState);

    state[key] = clamp(0, newValue, Infinity) as any;
  };

/**
 * Sync incoming user to the store
 * @param state App state
 * @param user Incoming user
 */
const syncWithUserImpl = (state: EntitiesState, user: SyncableUser): void => {
  // Predicates
  if (isBool(user.is_following)) {
    state.following[user.id] = user.is_following;
  }

  if (isBool(user.is_follower)) {
    state.followers[user.id] = user.is_follower;
  }

  if (isBool(user.is_friend)) {
    state.friends[user.id] = user.is_friend;
  }

  if (isBool(user.is_muted)) {
    state.mutes[user.id] = user.is_muted;
  }

  if (isBool(user.is_blocking)) {
    state.blocks[user.id] = user.is_blocking;
  }

  if (isBool(user.is_subscribed)) {
    state.subscriptions[user.id] = user.is_subscribed;
  }

  if (isBool(user.is_friend_request_sent)) {
    state.sentRequests[user.id] = user.is_friend_request_sent;
  }

  // Integral
  if (isNum(user.follower_count)) {
    state.followerCounts[user.id] = user.follower_count;
  }

  if (isNum(user.following_count)) {
    state.followingCounts[user.id] = user.following_count;
  }

  if (isNum(user.friend_count)) {
    state.friendCounts[user.id] = user.friend_count;
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
  if (isBool(story.is_bookmarked)) {
    state.bookmarks[story.id] = story.is_bookmarked;
  }

  if (isBool(story.is_liked)) {
    state.likedStories[story.id] = story.is_liked;
  }

  // Integral
  if (isNum(story.stats.like_count)) {
    state.storyLikeCounts[story.id] = story.stats.like_count;
  }

  if (isNum(story.stats.comment_count)) {
    state.storyCommentCounts[story.id] = story.stats.comment_count;
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
  if (isBool(tag.is_following)) {
    state.followedTags[tag.id] = tag.is_following;
  }

  // Integral
  if (isNum(tag.follower_count)) {
    state.tagFollowerCounts[tag.id] = tag.follower_count;
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
  if (isBool(comment.is_liked)) {
    state.likedComments[comment.id] = comment.is_liked;
  }

  // Integral
  if (isNum(comment.like_count)) {
    state.commentLikeCounts[comment.id] = comment.like_count;
  }

  if (isNum(comment.reply_count)) {
    state.commentReplyCounts[comment.id] = comment.reply_count;
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
  if (isBool(reply.is_liked)) {
    state.likedReplies[reply.id] = reply.is_liked;
  }

  // Integral
  if (isNum(reply.like_count)) {
    state.replyLikeCounts[reply.id] = reply.like_count;
  }

  // Other
  if (reply.user) {
    syncWithUserImpl(state, reply.user);
  }

  if (reply.comment) {
    syncWithCommentImpl(state, reply.comment);
  }
};

export const entitiesSlice = createSlice({
  name: "entities",
  initialState: entitiesInitialState,
  reducers: {
    // Boolean
    setFollowing: setEntityValue<EntitiesState, "boolean">(
      "following",
      "boolean"
    ),
    setFollower: setEntityValue<EntitiesState, "boolean">(
      "followers",
      "boolean"
    ),
    setFriend: setEntityValue<EntitiesState, "boolean">("friends", "boolean"),
    setBookmark: setEntityValue<EntitiesState, "boolean">(
      "bookmarks",
      "boolean"
    ),
    setBlock: setEntityValue<EntitiesState, "boolean">("blocks", "boolean"),
    setMute: setEntityValue<EntitiesState, "boolean">("mutes", "boolean"),
    setLikedStory: setEntityValue<EntitiesState, "boolean">(
      "likedStories",
      "boolean"
    ),
    setLikedComment: setEntityValue<EntitiesState, "boolean">(
      "likedComments",
      "boolean"
    ),
    setLikedReply: setEntityValue<EntitiesState, "boolean">(
      "likedReplies",
      "boolean"
    ),
    setFollowedTag: setEntityValue<EntitiesState, "boolean">(
      "followedTags",
      "boolean"
    ),
    setSubscription: setEntityValue<EntitiesState, "boolean">(
      "subscriptions",
      "boolean"
    ),
    setSentRequest: setEntityValue<EntitiesState, "boolean">(
      "sentRequests",
      "boolean"
    ),
    // Number
    setFollowerCount: setEntityValue<EntitiesState, "number">(
      "followerCounts",
      "number"
    ),
    setFollowingCount: setEntityValue<EntitiesState, "number">(
      "followingCounts",
      "number"
    ),
    setFriendCount: setEntityValue<EntitiesState, "number">(
      "friendCounts",
      "number"
    ),
    setStoryLikeCount: setEntityValue<EntitiesState, "number">(
      "storyLikeCounts",
      "number"
    ),
    setStoryCommentCount: setEntityValue<EntitiesState, "number">(
      "storyCommentCounts",
      "number"
    ),
    setStoryHiddenCommentCount: setEntityValue<EntitiesState, "number">(
      "storyHiddenCommentCounts",
      "number"
    ),
    setCommentLikeCount: setEntityValue<EntitiesState, "number">(
      "commentLikeCounts",
      "number"
    ),
    setCommentReplyCount: setEntityValue<EntitiesState, "number">(
      "commentReplyCounts",
      "number"
    ),
    setReplyLikeCount: setEntityValue<EntitiesState, "number">(
      "replyLikeCounts",
      "number"
    ),
    setTagFollowerCount: setEntityValue<EntitiesState, "number">(
      "tagFollowerCounts",
      "number"
    ),
    // Self
    setSelfReplyCount: setSelfEntityValue<EntitiesState>("selfReplyCount"),
    setSelfCommentCount: setSelfEntityValue<EntitiesState>("selfCommentCount"),
    setSelfPublishedStoryCount: setSelfEntityValue<EntitiesState>(
      "selfPublishedStoryCount"
    ),
    setSelfDeletedStoryCount: setSelfEntityValue<EntitiesState>(
      "selfDeletedStoryCount"
    ),
    setSelfPendingDraftCount: setSelfEntityValue<EntitiesState>(
      "selfPendingDraftCount"
    ),
    setSelfDeletedDraftCount: setSelfEntityValue<EntitiesState>(
      "selfDeletedDraftCount"
    ),
    setSelfFollowedTagCount: setSelfEntityValue<EntitiesState>(
      "selfFollowedTagCount"
    ),
    setSelfPendingFriendRequestCount: setSelfEntityValue<EntitiesState>(
      "selfPendingFriendRequestCount"
    ),
    setSelfBlockCount: setSelfEntityValue<EntitiesState>("selfBlockCount"),
    setSelfMuteCount: setSelfEntityValue<EntitiesState>("selfMuteCount"),
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
  setBlock,
  setBookmark,
  setCommentLikeCount,
  setCommentReplyCount,
  setFollowedTag,
  setFollower,
  setFollowerCount,
  setFollowing,
  setFollowingCount,
  setFriend,
  setFriendCount,
  setLikedComment,
  setLikedReply,
  setLikedStory,
  setMute,
  setReplyLikeCount,
  setSelfBlockCount,
  setSelfCommentCount,
  setSelfDeletedDraftCount,
  setSelfDeletedStoryCount,
  setSelfFollowedTagCount,
  setSelfMuteCount,
  setSelfPendingDraftCount,
  setSelfPendingFriendRequestCount,
  setSelfPublishedStoryCount,
  setSelfReplyCount,
  setSentRequest,
  setStoryCommentCount,
  setStoryHiddenCommentCount,
  setStoryLikeCount,
  setSubscription,
  setTagFollowerCount,
  syncWithComment,
  syncWithReply,
  syncWithStory,
  syncWithTag,
  syncWithUser
} = entitiesSlice.actions;

export default entitiesSlice.reducer;
