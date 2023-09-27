import { add_followed_tag_listener } from "~/redux/features/entities/listener/followed-tag";
import { add_follower_listener } from "~/redux/features/entities/listener/follower";
import { add_following_listener } from "~/redux/features/entities/listener/following";
import { add_friend_listener } from "~/redux/features/entities/listener/friend";
import { add_liked_comment_listener } from "~/redux/features/entities/listener/liked-comment";
import { add_liked_reply_listener } from "~/redux/features/entities/listener/liked-reply";
import { add_liked_story_listener } from "~/redux/features/entities/listener/liked-story";
import { add_mute_listener } from "~/redux/features/entities/listener/mute";
import { AppStartListening } from "src/redux/listener-middleware";

import { add_block_listener } from "./block";

export const add_entities_listeners = (
  start_listening: AppStartListening
): void => {
  [
    add_block_listener,
    add_followed_tag_listener,
    add_follower_listener,
    add_following_listener,
    add_friend_listener,
    add_liked_comment_listener,
    add_liked_reply_listener,
    add_liked_story_listener,
    add_mute_listener
  ].forEach((bind) => bind(start_listening));
};
