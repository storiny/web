import { boolean_action, number_action } from "~/redux/features";
import { setup_store } from "~/redux/store";

const test_id = "0";

describe("entities_listener", () => {
  describe("block", () => {
    it("unfollows, unsubscribes, removes friend request, and removes user from followers and friends list when they are blocked", async () => {
      const store = setup_store(undefined, true);

      // Follow user
      store.dispatch(boolean_action("following", test_id, true));
      // Subscribe
      store.dispatch(boolean_action("subscriptions", test_id, true));
      // Add user to the follower list
      store.dispatch(boolean_action("followers", test_id, true));
      // Add user to the friend list
      store.dispatch(boolean_action("friends", test_id, true));
      // Send request
      store.dispatch(boolean_action("sent_requests", test_id, true));

      expect(store.getState().entities.following[test_id]).toBeTrue();
      expect(store.getState().entities.followers[test_id]).toBeTrue();
      expect(store.getState().entities.friends[test_id]).toBeTrue();
      expect(store.getState().entities.subscriptions[test_id]).toBeTrue();
      expect(store.getState().entities.sent_requests[test_id]).toBeTrue();

      // Block the user
      store.dispatch(boolean_action("blocks", test_id, true));

      expect(store.getState().entities.following[test_id]).toBeFalse();
      expect(store.getState().entities.followers[test_id]).toBeFalse();
      expect(store.getState().entities.friends[test_id]).toBeFalse();
      expect(store.getState().entities.subscriptions[test_id]).toBeFalse();
      expect(store.getState().entities.sent_requests[test_id]).toBeFalse();
      expect(store.getState().entities.self_block_count).toEqual(1);
    });
  });

  describe("following", () => {
    it("subscribes/unsubscribes to/from user when following/unfollowing them", () => {
      const store = setup_store(undefined, true);

      // Follow user
      store.dispatch(boolean_action("following", test_id, true));

      expect(store.getState().entities.following[test_id]).toBeTrue();
      expect(store.getState().entities.subscriptions[test_id]).toBeTrue();

      // Unfollow user
      store.dispatch(boolean_action("following", test_id, false));

      expect(store.getState().entities.following[test_id]).toBeFalse();
      expect(store.getState().entities.subscriptions[test_id]).toBeFalse();
    });

    it("syncs count on toggling following", () => {
      const store = setup_store(undefined, true);

      // Follow user
      store.dispatch(boolean_action("following", test_id));
      expect(store.getState().entities.follower_counts[test_id]).toEqual(1);

      // Unfollow user
      store.dispatch(boolean_action("following", test_id));
      expect(store.getState().entities.follower_counts[test_id]).toEqual(0);
    });
  });

  describe("friend", () => {
    it("syncs count on toggling friends", () => {
      const store = setup_store(undefined, true);

      store.dispatch(boolean_action("friends", test_id, true));
      store.dispatch(number_action("friend_counts", test_id, 5));

      // Remove friend
      store.dispatch(boolean_action("friends", test_id));
      expect(store.getState().entities.friend_counts[test_id]).toEqual(4);
    });
  });

  describe("story", () => {
    it("syncs count on toggling story like", () => {
      const store = setup_store(undefined, true);

      // Like story
      store.dispatch(boolean_action("liked_stories", test_id));
      expect(store.getState().entities.story_like_counts[test_id]).toEqual(1);

      // Unlike story
      store.dispatch(boolean_action("liked_stories", test_id));
      expect(store.getState().entities.story_like_counts[test_id]).toEqual(0);
    });
  });

  describe("comment", () => {
    it("syncs count on toggling comment like", () => {
      const store = setup_store(undefined, true);

      // Like comment
      store.dispatch(boolean_action("liked_comments", test_id));
      expect(store.getState().entities.comment_like_counts[test_id]).toEqual(1);

      // Unlike comment
      store.dispatch(boolean_action("liked_comments", test_id));
      expect(store.getState().entities.comment_like_counts[test_id]).toEqual(0);
    });
  });

  describe("reply", () => {
    it("syncs count on toggling reply like", () => {
      const store = setup_store(undefined, true);

      // Like reply
      store.dispatch(boolean_action("liked_replies", test_id));
      expect(store.getState().entities.reply_like_counts[test_id]).toEqual(1);

      // Unlike reply
      store.dispatch(boolean_action("liked_replies", test_id));
      expect(store.getState().entities.reply_like_counts[test_id]).toEqual(0);
    });
  });

  describe("tag follower", () => {
    it("syncs count on toggling tag follower", () => {
      const store = setup_store(undefined, true);

      // Follow tag
      store.dispatch(boolean_action("followed_tags", test_id));
      expect(store.getState().entities.tag_follower_counts[test_id]).toEqual(1);

      // Unfollow tag
      store.dispatch(boolean_action("followed_tags", test_id));
      expect(store.getState().entities.tag_follower_counts[test_id]).toEqual(0);
    });
  });
});
