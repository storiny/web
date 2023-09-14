import React from "react";

import type { default as data } from "../../data.json";

export interface EmojiProps extends React.ComponentPropsWithoutRef<"button"> {
  /**
   * ID of the emoji
   */
  emojiId: keyof typeof data.emojis;
}
