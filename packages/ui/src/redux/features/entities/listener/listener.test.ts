import { boolean_action, number_action } from "~/redux/features";
import { setup_store } from "~/redux/store";

const testId = "0";

describe("entitiesListener", () => {
  describe("block", () => {
    it("unfollows, unsubscribes, removes friend request, and removes user from followers and friends list when they are blocked", async () => {
      const store = setup_store(undefined, true);

      // Follow user
      store.dispatch(boolean_action("following", testId, true));
      // Subscribe
      store.dispatch(boolean_action("subscriptions", testId, true));
      // Add user to the follower list
      store.dispatch(boolean_action("followers", testId, true));
      // Add user to the friend list
      store.dispatch(boolean_action("friends", testId, true));
      // Send request
      store.dispatch(boolean_action("sentRequests", testId, true));

      expect(store.getState().entities.following[testId]).toBeTruthy();
      expect(store.getState().entities.followers[testId]).toBeTruthy();
      expect(store.getState().entities.friends[testId]).toBeTruthy();
      expect(store.getState().entities.subscriptions[testId]).toBeTruthy();
      expect(store.getState().entities.sentRequests[testId]).toBeTruthy();

      // Block the user
      store.dispatch(boolean_action("blocks", testId, true));

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
      const store = setup_store(undefined, true);

      // Follow user
      store.dispatch(boolean_action("following", testId, true));

      expect(store.getState().entities.following[testId]).toBeTruthy();
      expect(store.getState().entities.subscriptions[testId]).toBeTruthy();

      // Unfollow user
      store.dispatch(boolean_action("following", testId, true));

      expect(store.getState().entities.following[testId]).toBeFalsy();
      expect(store.getState().entities.subscriptions[testId]).toBeFalsy();
    });

    it("syncs count on toggling following", () => {
      const store = setup_store(undefined, true);

      // Follow user
      store.dispatch(boolean_action("following", testId));
      expect(store.getState().entities.followerCounts[testId]).toEqual(1);

      // Unfollow user
      store.dispatch(boolean_action("following", testId));
      expect(store.getState().entities.followerCounts[testId]).toEqual(0);
    });
  });

  describe("friend", () => {
    it("syncs count on toggling friends", () => {
      const store = setup_store(undefined, true);

      store.dispatch(boolean_action("friends", testId, true));
      store.dispatch(number_action("friendCounts", testId, 5));

      // Remove friend
      store.dispatch(boolean_action("friends", testId));
      expect(store.getState().entities.friendCounts[testId]).toEqual(4);
    });
  });

  describe("story", () => {
    it("syncs count on toggling story like", () => {
      const store = setup_store(undefined, true);

      // Like story
      store.dispatch(boolean_action("likedStories", testId));
      expect(store.getState().entities.storyLikeCounts[testId]).toEqual(1);

      // Unlike story
      store.dispatch(boolean_action("likedStories", testId));
      expect(store.getState().entities.storyLikeCounts[testId]).toEqual(0);
    });
  });

  describe("comment", () => {
    it("syncs count on toggling comment like", () => {
      const store = setup_store(undefined, true);

      // Like comment
      store.dispatch(boolean_action("likedComments", testId));
      expect(store.getState().entities.commentLikeCounts[testId]).toEqual(1);

      // Unlike comment
      store.dispatch(boolean_action("likedComments", testId));
      expect(store.getState().entities.commentLikeCounts[testId]).toEqual(0);
    });
  });

  describe("reply", () => {
    it("syncs count on toggling reply like", () => {
      const store = setup_store(undefined, true);

      // Like reply
      store.dispatch(boolean_action("likedReplies", testId));
      expect(store.getState().entities.replyLikeCounts[testId]).toEqual(1);

      // Unlike reply
      store.dispatch(boolean_action("likedReplies", testId));
      expect(store.getState().entities.replyLikeCounts[testId]).toEqual(0);
    });
  });

  describe("tag follower", () => {
    it("syncs count on toggling tag follower", () => {
      const store = setup_store(undefined, true);

      // Follow tag
      store.dispatch(boolean_action("followedTags", testId));
      expect(store.getState().entities.tagFollowerCounts[testId]).toEqual(1);

      // Unfollow tag
      store.dispatch(boolean_action("followedTags", testId));
      expect(store.getState().entities.tagFollowerCounts[testId]).toEqual(0);
    });
  });
});
