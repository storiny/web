import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { Story, Tag, User } from "@storiny/types";

import {
  decrementSelfFollowerCount,
  decrementSelfFollowingCount,
  decrementSelfFriendCount,
  incrementSelfFollowingCount,
  renderToast,
  selectBlock,
  selectFollowedTag,
  selectFollower,
  selectFollowing,
  selectFriend,
  selectLikedStory,
  selectSentRequest
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

interface EntitiesPredicateState {
  blocks: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  followedTags: Record<string, boolean>;
  followers: Record<string, boolean>;
  following: Record<string, boolean>;
  friends: Record<string, boolean>;
  likedStories: Record<string, boolean>;
  mutes: Record<string, boolean>;
  sentRequests: Record<string, boolean>;
  subscriptions: Record<string, boolean>;
}

interface EntitesIntegralState {
  followerCounts: Record<string, number>;
  followingCounts: Record<string, number>;
  friendCounts: Record<string, number>;
  storyLikeCounts: Record<string, number>;
  tagFollowerCounts: Record<string, number>;
}

export type EntitiesState = EntitiesPredicateState & EntitesIntegralState;

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

export const entitiesInitialState: EntitiesState = {
  following: {},
  followers: {},
  friends: {},
  subscriptions: {},
  bookmarks: {},
  likedStories: {},
  followedTags: {},
  blocks: {},
  mutes: {},
  sentRequests: {},
  followerCounts: {},
  followingCounts: {},
  friendCounts: {},
  storyLikeCounts: {},
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
 * Toggles boolean entity value
 * @param key Entity key
 */
export const toggleEntityValue =
  <T extends Record<any, any>>(key: keyof T) =>
  (state: T, action: PayloadAction<string>): void => {
    const entityId = action.payload;
    const prevState = state[key][entityId];

    if (typeof prevState !== "undefined") {
      state[key][entityId] = !prevState;
    } else {
      // Set to `true` when absent from the map.
      state[key][entityId] = true;
    }
  };

/**
 * Increments or decrements integral entity value
 * @param key Entity key
 * @param mode Mode of operation
 */
export const changeEntityValue =
  <T extends Record<any, any>>(key: keyof T, mode: "increment" | "decrement") =>
  (state: T, action: PayloadAction<string>): void => {
    const entityId = action.payload;
    const prevState = state[key][entityId] as number;

    if (typeof prevState !== "undefined") {
      state[key][entityId] =
        mode === "increment"
          ? prevState + 1
          : prevState > 0
          ? prevState - 1
          : prevState;
    } else {
      // When absent from the map
      state[key][entityId] = mode === "increment" ? 1 : 0;
    }
  };

/**
 * Overwrites entity value if exists
 * @param key Entity key
 */
export const overwriteEntityValue =
  <T extends Record<any, any>>(key: keyof T) =>
  (state: T, action: PayloadAction<[string, number | boolean]>): void => {
    const [entityId, value] = action.payload;
    state[key][entityId] = value;
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

export const entitiesSlice = createSlice({
  name: "entities",
  initialState: entitiesInitialState,
  reducers: {
    // Predicate toggle
    toggleFollowing: toggleEntityValue<EntitiesState>("following"),
    toggleFollower: toggleEntityValue<EntitiesState>("followers"),
    toggleFriend: toggleEntityValue<EntitiesState>("friends"),
    toggleBookmark: toggleEntityValue<EntitiesState>("bookmarks"),
    toggleBlock: toggleEntityValue<EntitiesState>("blocks"),
    toggleMute: toggleEntityValue<EntitiesState>("mutes"),
    toggleLikedStory: toggleEntityValue<EntitiesState>("likedStories"),
    toggleFollowedTag: toggleEntityValue<EntitiesState>("followedTags"),
    toggleSubscription: toggleEntityValue<EntitiesState>("subscriptions"),
    toggleSentRequest: toggleEntityValue<EntitiesState>("sentRequests"),
    // Integral
    incrementFollowerCount: changeEntityValue<EntitiesState>(
      "followerCounts",
      "increment"
    ),
    incrementFollowingCount: changeEntityValue<EntitiesState>(
      "followingCounts",
      "increment"
    ),
    incrementFriendsCount: changeEntityValue<EntitiesState>(
      "friendCounts",
      "increment"
    ),
    incrementStoryLikeCount: changeEntityValue<EntitiesState>(
      "storyLikeCounts",
      "increment"
    ),
    incrementTagFollowerCount: changeEntityValue<EntitiesState>(
      "tagFollowerCounts",
      "increment"
    ),
    decrementFollowerCount: changeEntityValue<EntitiesState>(
      "followerCounts",
      "decrement"
    ),
    decrementFollowingCount: changeEntityValue<EntitiesState>(
      "followingCounts",
      "decrement"
    ),
    decrementFriendCount: changeEntityValue<EntitiesState>(
      "friendCounts",
      "decrement"
    ),
    decrementStoryLikeCount: changeEntityValue<EntitiesState>(
      "storyLikeCounts",
      "decrement"
    ),
    decrementTagFollowerCount: changeEntityValue<EntitiesState>(
      "tagFollowerCounts",
      "decrement"
    ),
    // Overwrite
    overwriteFollowing: overwriteEntityValue<EntitiesState>("following"),
    overwriteFollower: overwriteEntityValue<EntitiesState>("followers"),
    overwriteFriend: overwriteEntityValue<EntitiesState>("friends"),
    overwriteBookmark: overwriteEntityValue<EntitiesState>("bookmarks"),
    overwriteBlock: overwriteEntityValue<EntitiesState>("blocks"),
    overwriteMute: overwriteEntityValue<EntitiesState>("mutes"),
    overwriteLikedStory: overwriteEntityValue<EntitiesState>("likedStories"),
    overwriteFollowedTag: overwriteEntityValue<EntitiesState>("followedTags"),
    overwriteSubscription: overwriteEntityValue<EntitiesState>("subscriptions"),
    overwriteSentRequest: overwriteEntityValue<EntitiesState>("sentRequests"),
    overwriteFollowerCount:
      overwriteEntityValue<EntitiesState>("followerCounts"),
    overwriteFollowingCount:
      overwriteEntityValue<EntitiesState>("followingCounts"),
    overwriteFriendCount: overwriteEntityValue<EntitiesState>("friendCounts"),
    overwriteStoryLikeCount:
      overwriteEntityValue<EntitiesState>("storyLikeCounts"),
    overwriteTagFollowerCount:
      overwriteEntityValue<EntitiesState>("tagFollowerCounts"),
    // Syncing utils
    syncWithUser: (state, action: PayloadAction<SyncableUser>) =>
      syncWithUserImpl(state, action.payload),
    syncWithStory: (state, action: PayloadAction<SyncableStory>) =>
      syncWithStoryImpl(state, action.payload),
    syncWithTag: (state, action: PayloadAction<SyncableTag>) =>
      syncWithTagImpl(state, action.payload)
  }
});

const {
  toggleFollowing,
  toggleFollower,
  toggleFriend,
  toggleBookmark,
  toggleBlock,
  toggleMute,
  toggleLikedStory,
  toggleFollowedTag,
  toggleSubscription,
  toggleSentRequest,
  incrementFollowingCount,
  incrementFollowerCount,
  incrementFriendsCount,
  incrementStoryLikeCount,
  incrementTagFollowerCount,
  decrementFollowingCount,
  decrementFollowerCount,
  decrementFriendCount,
  decrementStoryLikeCount,
  decrementTagFollowerCount,
  overwriteFollowing,
  overwriteFollower,
  overwriteFriend,
  overwriteBookmark,
  overwriteBlock,
  overwriteMute,
  overwriteLikedStory,
  overwriteFollowedTag,
  overwriteSubscription,
  overwriteSentRequest,
  overwriteFollowingCount,
  overwriteFollowerCount,
  overwriteFriendCount,
  overwriteStoryLikeCount,
  overwriteTagFollowerCount,
  syncWithStory,
  syncWithUser,
  syncWithTag
} = entitiesSlice.actions;

export const addEntitiesListeners = (
  startListening: AppStartListening
): void => {
  /**
   * Unfollow user, unsubscribe from them, remove them from the
   * follower list and friend list when they are blocked
   */
  startListening({
    matcher: isAnyOf(toggleBlock, overwriteBlock),
    effect: ({ payload }, listenerApi) => {
      const userId = Array.isArray(payload) ? payload[0] : payload; // Payload is an array for overwriteBlock
      const isBlocked = selectBlock(userId)(listenerApi.getState());

      if (isBlocked) {
        listenerApi.dispatch(overwriteFollowing([userId, false]));
        listenerApi.dispatch(overwriteFollower([userId, false]));
        listenerApi.dispatch(overwriteFriend([userId, false]));
        listenerApi.dispatch(overwriteSubscription([userId, false]));
        listenerApi.dispatch(overwriteSentRequest([userId, false]));
      }
    }
  });

  /**
   * Render a toast on sending a friend request
   */
  startListening({
    actionCreator: toggleSentRequest,
    effect: ({ payload }, listenerApi) => {
      const isFriendRequestSent = selectSentRequest(payload)(
        listenerApi.getState()
      );

      if (isFriendRequestSent) {
        listenerApi.dispatch(
          renderToast({ message: "Friend request sent", severity: "success" })
        );
      }
    }
  });

  /**
   * Subscribe to user when following them by default, and unsubscribe from them when unfollowing
   */
  startListening({
    matcher: isAnyOf(toggleFollowing, overwriteFollowing),
    effect: ({ payload }, listenerApi) => {
      const userId = Array.isArray(payload) ? payload[0] : payload; // Payload is an array for overwriteFollowing
      const isFollowing = selectFollowing(userId)(listenerApi.getState());

      if (isFollowing) {
        listenerApi.dispatch(overwriteSubscription([userId, true]));
      } else {
        listenerApi.dispatch(overwriteSubscription([userId, false]));
      }
    }
  });

  /**
   * Increment and decrement following count
   */
  startListening({
    actionCreator: toggleFollowing,
    effect: ({ payload }, listenerApi) => {
      const userId = payload;
      const hasFollowed = selectFollowing(userId)(listenerApi.getState());

      if (hasFollowed) {
        listenerApi.dispatch(incrementSelfFollowingCount());
        listenerApi.dispatch(incrementFollowerCount(userId));
      } else {
        listenerApi.dispatch(decrementSelfFollowingCount());
        listenerApi.dispatch(decrementFollowerCount(userId));
      }
    }
  });

  /**
   * Increment and decrement on follower toggle. Follower can only
   * be removed using the `Remove this follower` option.
   */
  startListening({
    actionCreator: toggleFollower,
    effect: ({ payload }, listenerApi) => {
      const userId = payload;
      const hasRemovedFollower = !selectFollower(userId)(
        listenerApi.getState()
      );

      if (hasRemovedFollower) {
        listenerApi.dispatch(decrementSelfFollowerCount());
        listenerApi.dispatch(decrementFollowingCount(userId));
      }
    }
  });

  /**
   * Increment and decrement friend count. The client can only remove friend,
   * and to add a friend, the friend request needs to be accepted by the recipient.
   */
  startListening({
    actionCreator: toggleFriend,
    effect: ({ payload }, listenerApi) => {
      const userId = payload;
      const hasRemovedFriend = !selectFriend(userId)(listenerApi.getState());

      if (hasRemovedFriend) {
        listenerApi.dispatch(decrementSelfFriendCount());
        listenerApi.dispatch(decrementFriendCount(userId));
      }
    }
  });

  /**
   * Increment and decrement story like count
   */
  startListening({
    actionCreator: toggleLikedStory,
    effect: ({ payload }, listenerApi) => {
      const storyId = payload;
      const hasLiked = selectLikedStory(storyId)(listenerApi.getState());

      if (hasLiked) {
        listenerApi.dispatch(incrementStoryLikeCount(storyId));
      } else {
        listenerApi.dispatch(decrementStoryLikeCount(storyId));
      }
    }
  });

  /**
   * Increment and decrement tag follower count
   */
  startListening({
    actionCreator: toggleFollowedTag,
    effect: ({ payload }, listenerApi) => {
      const tagId = payload;
      const hasFollowed = selectFollowedTag(tagId)(listenerApi.getState());

      if (hasFollowed) {
        listenerApi.dispatch(incrementTagFollowerCount(tagId));
      } else {
        listenerApi.dispatch(decrementTagFollowerCount(tagId));
      }
    }
  });
};

export {
  decrementFollowerCount,
  decrementFollowingCount,
  decrementFriendCount,
  decrementStoryLikeCount,
  decrementTagFollowerCount,
  incrementFollowerCount,
  incrementFollowingCount,
  incrementFriendsCount,
  incrementStoryLikeCount,
  incrementTagFollowerCount,
  overwriteBlock,
  overwriteBookmark,
  overwriteFollowedTag,
  overwriteFollower,
  overwriteFollowerCount,
  overwriteFollowing,
  overwriteFollowingCount,
  overwriteFriend,
  overwriteFriendCount,
  overwriteLikedStory,
  overwriteMute,
  overwriteSentRequest,
  overwriteStoryLikeCount,
  overwriteSubscription,
  overwriteTagFollowerCount,
  syncWithStory,
  syncWithTag,
  syncWithUser,
  toggleBlock,
  toggleBookmark,
  toggleFollowedTag,
  toggleFollower,
  toggleFollowing,
  toggleFriend,
  toggleLikedStory,
  toggleMute,
  toggleSentRequest,
  toggleSubscription
};

export default entitiesSlice.reducer;
