import { falseAction, trueAction } from "~/redux/features";
import { setupStore } from "~/redux/store";
import { renderHookWithProvider } from "~/redux/testUtils";

import { useEntityBooleanDispatch, useEntityNumberDispatch } from "../slice";

const testId = "0";

describe("entitiesListener", () => {
  describe("block", () => {
    it("unfollows, unsubscribes, removes friend request, and removes user from followers and friends list when they are blocked", async () => {
      const store = setupStore(undefined, true);
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Follow user
      result.current("following", testId, trueAction);
      // Subscribe
      result.current("subscriptions", testId, trueAction);
      // Add user to the follower list
      result.current("followers", testId, trueAction);
      // Add user to the friend list
      result.current("friends", testId, trueAction);
      // Send request
      result.current("sentRequests", testId, trueAction);

      expect(store.getState().entities.following[testId]).toBeTruthy();
      expect(store.getState().entities.followers[testId]).toBeTruthy();
      expect(store.getState().entities.friends[testId]).toBeTruthy();
      expect(store.getState().entities.subscriptions[testId]).toBeTruthy();
      expect(store.getState().entities.sentRequests[testId]).toBeTruthy();

      // Block the user
      result.current("blocks", testId, trueAction);

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
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Follow user
      result.current("following", testId, trueAction);

      expect(store.getState().entities.following[testId]).toBeTruthy();
      expect(store.getState().entities.subscriptions[testId]).toBeTruthy();

      // Unfollow user
      result.current("following", testId, falseAction);

      expect(store.getState().entities.following[testId]).toBeFalsy();
      expect(store.getState().entities.subscriptions[testId]).toBeFalsy();
    });

    it("syncs count on toggling following", () => {
      const store = setupStore(undefined, true);
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Follow user
      result.current("following", testId);
      expect(store.getState().entities.followerCounts[testId]).toEqual(1);

      // Unfollow user
      result.current("following", testId);
      expect(store.getState().entities.followerCounts[testId]).toEqual(0);
    });
  });

  describe("friend", () => {
    it("syncs count on toggling friends", () => {
      const store = setupStore(undefined, true);
      const { result: booleanResult } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );
      const { result: numberResult } = renderHookWithProvider(
        () => useEntityNumberDispatch(),
        {},
        { store }
      );

      booleanResult.current("friends", testId, trueAction);
      numberResult.current("friendCounts", testId, 5);

      // Remove friend
      booleanResult.current("friends", testId);
      expect(store.getState().entities.friendCounts[testId]).toEqual(4);
    });
  });

  describe("story", () => {
    it("syncs count on toggling story like", () => {
      const store = setupStore(undefined, true);
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Like story
      result.current("likedStories", testId);
      expect(store.getState().entities.storyLikeCounts[testId]).toEqual(1);

      // Unlike story
      result.current("likedStories", testId);
      expect(store.getState().entities.storyLikeCounts[testId]).toEqual(0);
    });
  });

  describe("comment", () => {
    it("syncs count on toggling comment like", () => {
      const store = setupStore(undefined, true);
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Like comment
      result.current("likedComments", testId);
      expect(store.getState().entities.commentLikeCounts[testId]).toEqual(1);

      // Unlike comment
      result.current("likedComments", testId);
      expect(store.getState().entities.commentLikeCounts[testId]).toEqual(0);
    });
  });

  describe("reply", () => {
    it("syncs count on toggling reply like", () => {
      const store = setupStore(undefined, true);
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Like reply
      result.current("likedReplies", testId);
      expect(store.getState().entities.replyLikeCounts[testId]).toEqual(1);

      // Unlike reply
      result.current("likedReplies", testId);
      expect(store.getState().entities.replyLikeCounts[testId]).toEqual(0);
    });
  });

  describe("tag follower", () => {
    it("syncs count on toggling tag follower", () => {
      const store = setupStore(undefined, true);
      const { result } = renderHookWithProvider(
        () => useEntityBooleanDispatch(),
        {},
        { store }
      );

      // Follow tag
      result.current("followedTags", testId);
      expect(store.getState().entities.tagFollowerCounts[testId]).toEqual(1);

      // Unfollow tag
      result.current("followedTags", testId);
      expect(store.getState().entities.tagFollowerCounts[testId]).toEqual(0);
    });
  });
});
