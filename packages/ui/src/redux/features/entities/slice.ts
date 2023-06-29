import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { Story, User } from "@storiny/types";

import {
  decrementSelfFollowerCount,
  decrementSelfFollowingCount,
  decrementSelfFriendCount,
  incrementSelfFollowingCount,
  renderToast,
  selectBlock,
  selectFollower,
  selectFollowing,
  selectFriend,
  selectLikedStory,
  selectSentRequest,
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
};

/**
 * Predicate function for validating numbers
 * @param value Value to check
 */
const isNum = (value?: number | string | null): value is number =>
  typeof value === "number";

/**
 * Predicate function for validating boolean values
 * @param value Value to check
 */
const isBool = (value?: boolean): value is boolean =>
  typeof value === "boolean";

/**
 * Toggles boolean entity value
 * @param key Entity key
 */
const toggleEntityValue =
  (key: keyof EntitiesState) =>
  (state: EntitiesState, action: PayloadAction<string>): void => {
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
const changeEntityValue =
  (key: keyof EntitiesState, mode: "increment" | "decrement") =>
  (state: EntitiesState, action: PayloadAction<string>): void => {
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
      // Case when absent from the map
      state[key][entityId] = mode === "increment" ? 1 : 0;
    }
  };

/**
 * Overwrites entity value if exists
 * @param key Entity key
 */
const overwriteEntityValue =
  (key: keyof EntitiesState) =>
  (
    state: EntitiesState,
    action: PayloadAction<[string, number | boolean]>
  ): void => {
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

  // Integrals
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

export const entitiesSlice = createSlice({
  name: "entities",
  initialState: entitiesInitialState,
  reducers: {
    // Predicate toggle
    toggleFollowing: toggleEntityValue("following"),
    toggleFollower: toggleEntityValue("followers"),
    toggleFriend: toggleEntityValue("friends"),
    toggleBookmark: toggleEntityValue("bookmarks"),
    toggleBlock: toggleEntityValue("blocks"),
    toggleMute: toggleEntityValue("mutes"),
    toggleLikedStory: toggleEntityValue("likedStories"),
    toggleFollowedTag: toggleEntityValue("followedTags"),
    toggleSubscription: toggleEntityValue("subscriptions"),
    toggleSentRequest: toggleEntityValue("sentRequests"),
    // Integral
    incrementFollowerCount: changeEntityValue("followerCounts", "increment"),
    incrementFollowingCount: changeEntityValue("followingCounts", "increment"),
    incrementFriendsCount: changeEntityValue("friendCounts", "increment"),
    incrementStoryLikeCount: changeEntityValue("storyLikeCounts", "increment"),
    decrementFollowerCount: changeEntityValue("followerCounts", "decrement"),
    decrementFollowingCount: changeEntityValue("followingCounts", "decrement"),
    decrementFriendCount: changeEntityValue("friendCounts", "decrement"),
    decrementStoryLikeCount: changeEntityValue("storyLikeCounts", "decrement"),
    // Overwrite
    overwriteFollowing: overwriteEntityValue("following"),
    overwriteFollower: overwriteEntityValue("followers"),
    overwriteFriend: overwriteEntityValue("friends"),
    overwriteBookmark: overwriteEntityValue("bookmarks"),
    overwriteBlock: overwriteEntityValue("blocks"),
    overwriteMute: overwriteEntityValue("mutes"),
    overwriteLikedStory: overwriteEntityValue("likedStories"),
    overwriteFollowedTag: overwriteEntityValue("followedTags"),
    overwriteSubscription: overwriteEntityValue("subscriptions"),
    overwriteSentRequest: overwriteEntityValue("sentRequests"),
    overwriteFollowerCount: overwriteEntityValue("followerCounts"),
    overwriteFollowingCount: overwriteEntityValue("followingCounts"),
    overwriteFriendCount: overwriteEntityValue("friendCounts"),
    overwriteStoryLikeCount: overwriteEntityValue("storyLikeCounts"),
    // Syncing utils
    syncWithUser: (state, action: PayloadAction<SyncableUser>) =>
      syncWithUserImpl(state, action.payload),
    syncWithStory: (state, action: PayloadAction<SyncableStory>) =>
      syncWithStoryImpl(state, action.payload),
  },
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
  decrementFollowingCount,
  decrementFollowerCount,
  decrementFriendCount,
  decrementStoryLikeCount,
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
  syncWithStory,
  syncWithUser,
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
  });
};

export {
  decrementFollowerCount,
  decrementFollowingCount,
  decrementFriendCount,
  decrementStoryLikeCount,
  incrementFollowerCount,
  incrementFollowingCount,
  incrementFriendsCount,
  incrementStoryLikeCount,
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
  syncWithStory,
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
  toggleSubscription,
};

export default entitiesSlice.reducer;
