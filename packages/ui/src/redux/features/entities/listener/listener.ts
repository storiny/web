import { AppStartListening } from "~/redux/listenerMiddleware";

import { addBlockListener } from "./block";
import { addFollowedTagListener } from "./followedTag";
import { addFollowerListener } from "./follower";
import { addFollowingListener } from "./following";
import { addFriendListener } from "./friend";
import { addLikedCommentListener } from "./likedComment";
import { addLikedReplyListener } from "./likedReply";
import { addLikedStoryListener } from "./likedStory";
import { addMuteListener } from "./mute";

export const addEntitiesListeners = (
  startListening: AppStartListening
): void => {
  [
    addBlockListener,
    addFollowedTagListener,
    addFollowerListener,
    addFollowingListener,
    addFriendListener,
    addLikedCommentListener,
    addLikedReplyListener,
    addLikedStoryListener,
    addMuteListener
  ].forEach((bind) => bind(startListening));
};
