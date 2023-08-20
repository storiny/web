import React from "react";

export interface EmojiPickerProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Callback function called when selecting an emoji
   */
  onEmojiSelect?: (emoji: string) => void;
}
