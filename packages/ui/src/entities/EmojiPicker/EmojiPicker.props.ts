import React from "react";

import { Emoji } from "./core/types";

export interface EmojiPickerProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Callback function called when selecting an emoji
   */
  onEmojiSelect?: (emoji: Emoji) => void;
}
