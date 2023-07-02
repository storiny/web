import { setupStore } from "~/redux/store";

import {
  selectBlock,
  selectFollower,
  selectFollowerCount,
  selectFollowing,
  selectFriend,
  selectFriendCount,
  selectSentRequest,
  selectStoryLikeCount,
  selectSubscribed
} from "./selectors";
import {
  overwriteBlock,
  overwriteFollower,
  overwriteFollowing,
  overwriteFriend,
  overwriteFriendCount,
  overwriteLikedStory,
  overwriteSentRequest,
  overwriteSubscription,
  toggleBlock,
  toggleFollowing,
  toggleFriend,
  toggleLikedStory
} from "./slice";

const testId = "0000-0000-0000-0000";

describe("entitiesListener", () => {
  it("unfollows, unsubscribes, removes friend request, and removes user from followers and friends list when they are blocked", () => {
    const store = setupStore(undefined, true);

    // Using `overwriteBlock`

    // Follow user
    store.dispatch(overwriteFollowing([testId, true]));
    // Subscribe
    store.dispatch(overwriteSubscription([testId, true]));
    // Add user to follower list
    store.dispatch(overwriteFollower([testId, true]));
    // Add user to friend list
    store.dispatch(overwriteFriend([testId, true]));
    // Send request
    store.dispatch(overwriteSentRequest([testId, true]));

    expect(selectFollowing(testId)(store.getState())).toBeTruthy();
    expect(selectSubscribed(testId)(store.getState())).toBeTruthy();
    expect(selectFollower(testId)(store.getState())).toBeTruthy();
    expect(selectFriend(testId)(store.getState())).toBeTruthy();
    expect(selectSentRequest(testId)(store.getState())).toBeTruthy();

    // Block the user
    store.dispatch(overwriteBlock([testId, true]));

    expect(selectFollowing(testId)(store.getState())).toBeFalsy();
    expect(selectSubscribed(testId)(store.getState())).toBeFalsy();
    expect(selectFollower(testId)(store.getState())).toBeFalsy();
    expect(selectFriend(testId)(store.getState())).toBeFalsy();
    expect(selectSentRequest(testId)(store.getState())).toBeFalsy();

    // Using `toggleBlock`

    // Unblock user
    store.dispatch(toggleBlock(testId));

    expect(selectBlock(testId)(store.getState())).toBeFalsy();

    // Follow user again
    store.dispatch(overwriteFollowing([testId, true]));
    // Subscribe
    store.dispatch(overwriteSubscription([testId, true]));
    // Add user to follower list again
    store.dispatch(overwriteFollower([testId, true]));
    // Add user to friend list again
    store.dispatch(overwriteFriend([testId, true]));
    // Send friend request again
    store.dispatch(overwriteSentRequest([testId, true]));

    // Block the user
    store.dispatch(toggleBlock(testId));

    expect(selectFollowing(testId)(store.getState())).toBeFalsy();
    expect(selectSubscribed(testId)(store.getState())).toBeFalsy();
    expect(selectFollower(testId)(store.getState())).toBeFalsy();
    expect(selectFriend(testId)(store.getState())).toBeFalsy();
    expect(selectSentRequest(testId)(store.getState())).toBeFalsy();
  });

  it("subscribes/unsubscribes to/from user when following/unfollowing them", () => {
    const store = setupStore(undefined, true);

    // Follow user
    store.dispatch(overwriteFollowing([testId, true]));

    expect(selectFollowing(testId)(store.getState())).toBeTruthy();
    expect(selectSubscribed(testId)(store.getState())).toBeTruthy();

    // Unfollow user
    store.dispatch(overwriteFollowing([testId, false]));

    expect(selectFollowing(testId)(store.getState())).toBeFalsy();
    expect(selectSubscribed(testId)(store.getState())).toBeFalsy();
  });

  it("syncs count on toggling following", () => {
    const store = setupStore(undefined, true);
    store.dispatch(overwriteFollowing([testId, false]));

    // Follow user
    store.dispatch(toggleFollowing(testId));
    expect(selectFollowerCount(testId)(store.getState())).toEqual(1);

    // Unfollow user
    store.dispatch(toggleFollowing(testId));
    expect(selectFollowerCount(testId)(store.getState())).toEqual(0);
  });

  it("syncs count on toggling friends", () => {
    const store = setupStore(undefined, true);
    store.dispatch(overwriteFriend([testId, true]));
    store.dispatch(overwriteFriendCount([testId, 5]));

    // Remove friend
    store.dispatch(toggleFriend(testId));
    expect(selectFriendCount(testId)(store.getState())).toEqual(4);
  });

  it("syncs count on toggling story like", () => {
    const store = setupStore(undefined, true);
    store.dispatch(overwriteLikedStory([testId, false]));

    // Like story
    store.dispatch(toggleLikedStory(testId));
    expect(selectStoryLikeCount(testId)(store.getState())).toEqual(1);

    // Unlike story
    store.dispatch(toggleLikedStory(testId));
    expect(selectStoryLikeCount(testId)(store.getState())).toEqual(0);
  });
});
