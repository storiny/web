import { AppStartListening } from "~/redux/listenerMiddleware";

import { addBlockListener } from "./block";
import { addFollowedTagListener } from "./followed-tag";
import { addFollowerListener } from "./follower";
import { addFollowingListener } from "./following";
import { addFriendListener } from "./friend";
import { addLikedCommentListener } from "./liked-comment";
import { addLikedReplyListener } from "./liked-reply";
import { addLikedStoryListener } from "./liked-story";
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
