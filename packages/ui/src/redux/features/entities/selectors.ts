import { AppState } from "~/redux/store";

// Predicate

export const selectFollowing =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.following[userId];

export const selectFollower =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.followers[userId];

export const selectFriend =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.friends[userId];

export const selectSubscribed =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.subscriptions[userId];

export const selectSentRequest =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.sentRequests[userId];

export const selectBookmark =
  (storyId: string) =>
  (state: AppState): boolean =>
    state.entities.bookmarks[storyId];

export const selectLikedStory =
  (storyId: string) =>
  (state: AppState): boolean =>
    state.entities.likedStories[storyId];

export const selectFollowedTag =
  (tagId: string) =>
  (state: AppState): boolean =>
    state.entities.followedTags[tagId];

export const selectBlock =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.blocks[userId];

export const selectMute =
  (userId: string) =>
  (state: AppState): boolean =>
    state.entities.mutes[userId];

// Integral

export const selectFollowerCount =
  (userId: string) =>
  (state: AppState): number =>
    state.entities.followerCounts[userId];

export const selectFollowingCount =
  (userId: string) =>
  (state: AppState): number =>
    state.entities.followingCounts[userId];

export const selectFriendCount =
  (userId: string) =>
  (state: AppState): number =>
    state.entities.friendCounts[userId];

export const selectStoryLikeCount =
  (storyId: string) =>
  (state: AppState): number =>
    state.entities.storyLikeCounts[storyId];
