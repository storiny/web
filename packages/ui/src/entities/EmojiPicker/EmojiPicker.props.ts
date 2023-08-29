import React from "react";

import { PopoverProps } from "~/components/Popover";

export interface EmojiPickerProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Callback function called when selecting an emoji
   */
  onEmojiSelect?: (emoji: string) => void;
  /**
   * Props passed to the Popover component
   */
  popoverProps?: Partial<PopoverProps>;
}
