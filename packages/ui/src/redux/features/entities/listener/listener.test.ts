import {
  falseAction,
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
  setFollower,
  setFollowing,
  setFriend,
  setSentRequest,
  setSubscription
} from "../slice";

const testId = "0";

describe("entitiesListener", () => {
  describe("block", () => {
    it("unfollows, unsubscribes, removes friend request, and removes user from followers and friends list when they are blocked", () => {
      const store = setupStore(undefined, true);

      // Follow user
      store.dispatch(setFollowing([testId, trueAction]));
      // Subscribe
      store.dispatch(setSubscription([testId, trueAction]));
      // Add user to the follower list
      store.dispatch(setFollower([testId, trueAction]));
      // Add user to the friend list
      store.dispatch(setFriend([testId, trueAction]));
      // Send request
      store.dispatch(setSentRequest([testId, trueAction]));

      expect(store.getState().entities.following[testId]).toBeTruthy();
      expect(store.getState().entities.followers[testId]).toBeTruthy();
      expect(store.getState().entities.friends[testId]).toBeTruthy();
      expect(store.getState().entities.subscriptions[testId]).toBeTruthy();
      expect(store.getState().entities.sentRequests[testId]).toBeTruthy();

      // Block the user
      store.dispatch(setBlock([testId, trueAction]));

      expect(store.getState().entities.following[testId]).toBeFalsy();
      expect(store.getState().entities.followers[testId]).toBeFalsy();
      expect(store.getState().entities.friends[testId]).toBeFalsy();
      expect(store.getState().entities.subscriptions[testId]).toBeFalsy();
      expect(store.getState().entities.sentRequests[testId]).toBeFalsy();
      expect(store.getState().entities.selfBlockCount).toEqual(1);
    });
  });

  describe("following", () => {
    it("subscribes/unsubscribes to/from user when following/unfollowing them", () => {
      const store = setupStore(undefined, true);

      // Follow user
      store.dispatch(setFollowing([testId, trueAction]));

      expect(store.getState().entities.following[testId]).toBeTruthy();
      expect(store.getState().entities.subscriptions[testId]).toBeTruthy();

      // Unfollow user
      store.dispatch(setFollowing([testId, falseAction]));

      expect(store.getState().entities.following[testId]).toBeFalsy();
      expect(store.getState().entities.subscriptions[testId]).toBeFalsy();
    });

    it("syncs count on toggling following", () => {
      const store = setupStore(undefined, true);
      store.dispatch(setFollowing([testId, falseAction]));

      // Follow user
      store.dispatch(setFollowing([testId]));
      expect(store.getState().entities.followerCounts[testId]).toEqual(1);

      // Unfollow user
      store.dispatch(setFollowing([testId]));
      expect(store.getState().entities.followerCounts[testId]).toEqual(0);
    });
  });

  describe("friend", () => {
    it("syncs count on toggling friends", () => {
      const store = setupStore(undefined, true);
      store.dispatch(setFriend([testId, trueAction]));
      store.dispatch(setFriendCount([testId, (): number => 5]));

      // Remove friend
      store.dispatch(setFriend([testId]));
      expect(store.getState().entities.friendCounts[testId]).toEqual(4);
    });
  });

  describe("story", () => {
    it("syncs count on toggling story like", () => {
      const store = setupStore(undefined, true);
      store.dispatch(setLikedStory([testId, falseAction]));

      // Like story
      store.dispatch(setLikedStory([testId]));
      expect(store.getState().entities.storyLikeCounts[testId]).toEqual(1);

      // Unlike story
      store.dispatch(setLikedStory([testId]));
      expect(store.getState().entities.storyLikeCounts[testId]).toEqual(0);
    });
  });

  describe("comment", () => {
    it("syncs count on toggling comment like", () => {
      const store = setupStore(undefined, true);
      store.dispatch(setLikedComment([testId, falseAction]));

      // Like comment
      store.dispatch(setLikedComment([testId]));
      expect(store.getState().entities.commentLikeCounts[testId]).toEqual(1);

      // Unlike comment
      store.dispatch(setLikedComment([testId]));
      expect(store.getState().entities.commentLikeCounts[testId]).toEqual(0);
    });
  });

  describe("reply", () => {
    it("syncs count on toggling reply like", () => {
      const store = setupStore(undefined, true);
      store.dispatch(setLikedReply([testId, falseAction]));

      // Like reply
      store.dispatch(setLikedReply([testId]));
      expect(store.getState().entities.replyLikeCounts[testId]).toEqual(1);

      // Unlike reply
      store.dispatch(setLikedReply([testId]));
      expect(store.getState().entities.replyLikeCounts[testId]).toEqual(0);
    });
  });

  describe("tag follower", () => {
    it("syncs count on toggling tag follower", () => {
      const store = setupStore(undefined, true);
      store.dispatch(setFollowedTag([testId, falseAction]));

      // Follow tag
      store.dispatch(setFollowedTag([testId]));
      expect(store.getState().entities.tagFollowerCounts[testId]).toEqual(1);

      // Unfollow tag
      store.dispatch(setFollowedTag([testId]));
      expect(store.getState().entities.tagFollowerCounts[testId]).toEqual(0);
    });
  });
});
