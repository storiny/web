import React from "react";

import type { emojis } from "../../data.json";

export interface EmojiProps extends React.ComponentPropsWithoutRef<"button"> {
  /**
   * ID of the emoji
   */
  emojiId: keyof typeof emojis;
}
