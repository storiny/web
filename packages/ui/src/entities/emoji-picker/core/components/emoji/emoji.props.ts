import React from "react";

import type { default as data } from "../../data.json";

export interface EmojiProps extends React.ComponentPropsWithoutRef<"button"> {
  /**
   * ID of the emoji
   */
  emoji_id: keyof typeof data.emojis;
}
