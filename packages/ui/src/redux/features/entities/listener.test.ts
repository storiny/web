import {
  falseAction,
  selectCommentLikeCount,
  selectReplyLikeCount,
  setBlock,
  setFollowedTag,
  setFriendCount,
  setLikedComment,
  setLikedReply,
  setLikedStory,
  trueAction
} from "~/redux/features";
import { setupStore } from "~/redux/store";

import {
  selectFollower,
  selectFollowerCount,
  selectFollowing,
  selectFriend,
  selectFriendCount,
  selectSentRequest,
  selectStoryLikeCount,
  selectSubscribed,
  selectTagFollowerCount
} from "./selectors";
import {
  setFollower,
  setFollowing,
  setFriend,
  setSentRequest,
  setSubscription
} from "./slice";

const testId = "0000-0000-0000-0000";

describe("entitiesListener", () => {
  it("unfollows, unsubscribes, removes friend request, and removes user from followers and friends list when they are blocked", () => {
    const store = setupStore(undefined, true);

    // Follow user
    store.dispatch(setFollowing([testId, trueAction]));
    // Subscribe
    store.dispatch(setSubscription([testId, trueAction]));
    // Add user to follower list
    store.dispatch(setFollower([testId, trueAction]));
    // Add user to friend list
    store.dispatch(setFriend([testId, trueAction]));
    // Send request
    store.dispatch(setSentRequest([testId, trueAction]));

    expect(selectFollowing(testId)(store.getState())).toBeTruthy();
    expect(selectSubscribed(testId)(store.getState())).toBeTruthy();
    expect(selectFollower(testId)(store.getState())).toBeTruthy();
    expect(selectFriend(testId)(store.getState())).toBeTruthy();
    expect(selectSentRequest(testId)(store.getState())).toBeTruthy();

    // Block the user
    store.dispatch(setBlock([testId, trueAction]));

    expect(selectFollowing(testId)(store.getState())).toBeFalsy();
    expect(selectSubscribed(testId)(store.getState())).toBeFalsy();
    expect(selectFollower(testId)(store.getState())).toBeFalsy();
    expect(selectFriend(testId)(store.getState())).toBeFalsy();
    expect(selectSentRequest(testId)(store.getState())).toBeFalsy();
  });

  it("subscribes/unsubscribes to/from user when following/unfollowing them", () => {
    const store = setupStore(undefined, true);

    // Follow user
    store.dispatch(setFollowing([testId, trueAction]));

    expect(selectFollowing(testId)(store.getState())).toBeTruthy();
    expect(selectSubscribed(testId)(store.getState())).toBeTruthy();

    // Unfollow user
    store.dispatch(setFollowing([testId, falseAction]));

    expect(selectFollowing(testId)(store.getState())).toBeFalsy();
    expect(selectSubscribed(testId)(store.getState())).toBeFalsy();
  });

  it("syncs count on toggling following", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setFollowing([testId, falseAction]));

    // Follow user
    store.dispatch(setFollowing([testId]));
    expect(selectFollowerCount(testId)(store.getState())).toEqual(1);

    // Unfollow user
    store.dispatch(setFollowing([testId]));
    expect(selectFollowerCount(testId)(store.getState())).toEqual(0);
  });

  it("syncs count on toggling friends", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setFriend([testId, trueAction]));
    store.dispatch(setFriendCount([testId, (): number => 5]));

    // Remove friend
    store.dispatch(setFriend([testId]));
    expect(selectFriendCount(testId)(store.getState())).toEqual(4);
  });

  it("syncs count on toggling story like", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setLikedStory([testId, falseAction]));

    // Like story
    store.dispatch(setLikedStory([testId]));
    expect(selectStoryLikeCount(testId)(store.getState())).toEqual(1);

    // Unlike story
    store.dispatch(setLikedStory([testId]));
    expect(selectStoryLikeCount(testId)(store.getState())).toEqual(0);
  });

  it("syncs count on toggling comment like", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setLikedComment([testId, falseAction]));

    // Like comment
    store.dispatch(setLikedComment([testId]));
    expect(selectCommentLikeCount(testId)(store.getState())).toEqual(1);

    // Unlike comment
    store.dispatch(setLikedComment([testId]));
    expect(selectCommentLikeCount(testId)(store.getState())).toEqual(0);
  });

  it("syncs count on toggling reply like", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setLikedReply([testId, falseAction]));

    // Like reply
    store.dispatch(setLikedReply([testId]));
    expect(selectReplyLikeCount(testId)(store.getState())).toEqual(1);

    // Unlike reply
    store.dispatch(setLikedReply([testId]));
    expect(selectReplyLikeCount(testId)(store.getState())).toEqual(0);
  });

  it("syncs count on toggling tag follower", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setFollowedTag([testId, falseAction]));

    // Follow tag
    store.dispatch(setFollowedTag([testId]));
    expect(selectTagFollowerCount(testId)(store.getState())).toEqual(1);

    // Unfollow tag
    store.dispatch(setFollowedTag([testId]));
    expect(selectTagFollowerCount(testId)(store.getState())).toEqual(0);
  });
});
