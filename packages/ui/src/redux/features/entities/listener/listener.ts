import { AppStartListening } from "~/redux/listener-middleware";

import { add_block_listener } from "./block";
import { add_bookmark_listener } from "./bookmark";
import { add_followed_blog_listener } from "./followed-blog";
import { add_followed_tag_listener } from "./followed-tag";
import { add_follower_listener } from "./follower";
import { add_following_listener } from "./following";
import { add_friend_listener } from "./friend";
import { add_liked_comment_listener } from "./liked-comment";
import { add_liked_reply_listener } from "./liked-reply";
import { add_liked_story_listener } from "./liked-story";
import { add_mute_listener } from "./mute";
import { add_subscription_listener } from "./subscription";

export const add_entities_listeners = (
  start_listening: AppStartListening
): void => {
  [
    add_block_listener,
    add_followed_tag_listener,
    add_followed_blog_listener,
    add_follower_listener,
    add_following_listener,
    add_friend_listener,
    add_liked_comment_listener,
    add_liked_reply_listener,
    add_liked_story_listener,
    add_mute_listener,
    add_bookmark_listener,
    add_subscription_listener
  ].forEach((bind) => bind(start_listening));
};
